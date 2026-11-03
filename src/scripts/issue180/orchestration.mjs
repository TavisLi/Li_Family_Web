// Offline orchestration seam. It is not wired to a live backend or CLI.
// A stage is accepted only after the previous stage has returned verified evidence.
export async function orchestrate({ backend, authorize, cases, deadline, signal, clock = Date.now }) {
  let stage = 'authorization', owned = false, outcome = 'BLOCK', reason = 'UNKNOWN', cleanup = 'NOT_STARTED'
  const evidence = []
  const guard = () => {
    if (signal?.aborted) throw new Error('INTERRUPTED')
    if (!Number.isFinite(deadline) || clock() >= deadline) throw new Error('DEADLINE')
  }
  const run = async (name, action) => {
    guard(); stage = name
    const result = await action({ signal, deadline })
    guard()
    if (!result || result.verified !== true) throw new Error(`${name}:READBACK_UNVERIFIED`)
    evidence.push({ stage: name, digest: result.digest ?? null })
    return result
  }
  try {
    guard()
    if (await authorize() !== true) throw new Error('SOURCE_UNVERIFIED')
    guard()
    // Backend must mark ownership before it allocates any resource and retain an
    // independently verifiable marker even if provision throws.
    await run('prepare-owner', x => backend.prepareOwner(x))
    owned = true
    await run('provision', x => backend.provision(x))
    await run('baseline', x => backend.baseline(x))
    await run('fixture', x => backend.fixture(x))
    await run('before-image', x => backend.beforeImage(x))
    await run('migration', x => backend.migration(x))
    for (const id of cases) await run(`case:${id}`, x => backend.case(id, x))
    await run('independent-restore', x => backend.restore(x))
    outcome = 'PASS'; reason = 'VERIFIED'
  } catch (error) { reason = error.message }
  finally {
    if (owned) {
      try {
        // Cleanup receives its own short bound; aborting work must not suppress cleanup.
        const result = await backend.cleanup({ deadline: clock() + 10000 })
        cleanup = result?.verified === true ? 'VERIFIED' : 'UNKNOWN'
      } catch { cleanup = 'UNKNOWN' }
      if (cleanup !== 'VERIFIED') { outcome = 'BLOCK'; reason = 'CLEANUP_UNKNOWN' }
    }
  }
  return { status: outcome, reason, stage, cleanup, evidence }
}
