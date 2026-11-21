import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Evaluate a scoped control-plane observation recorded by an authorized operator.
export function reviewDataApi({ project, capturedAt, enabled, exposedSchemas, extraSearchPath },
  { expectedProject, privateSchema }) {
  if (!expectedProject || project !== expectedProject || !privateSchema ||
      typeof capturedAt !== 'string' || !Number.isFinite(Date.parse(capturedAt))) {
    return { decision: 'BLOCK', reason: 'PROJECT_OR_OBSERVATION_TIME_UNVERIFIED' }
  }
  for (const list of [exposedSchemas, extraSearchPath]) {
    if (list !== null && (!Array.isArray(list) || list.some(name => typeof name !== 'string' || !name.trim()))) {
      return { decision: 'BLOCK', reason: 'INVALID_SCHEMA_OBSERVATION' }
    }
    if (list?.some(name => name.trim() === privateSchema)) {
      return { decision: 'BLOCK', reason: 'PRIVATE_SCHEMA_IN_API_CONFIGURATION' }
    }
  }
  if (typeof enabled !== 'boolean') return { decision: 'BLOCK', reason: 'DATA_API_STATE_UNKNOWN' }
  if (exposedSchemas === null || extraSearchPath === null) {
    return enabled
      ? { decision: 'BLOCK', reason: 'ACTIVE_API_CONFIGURATION_UNKNOWN' }
      : { decision: 'ACCEPT WITH FOLLOW-UP', reason: 'DISABLED_API_WITH_UNOBSERVED_SETTINGS',
          recheck: ['before Data API enablement', 'if control-plane evidence drifts'] }
  }
  return { decision: 'PASS', reason: 'PRIVATE_SCHEMA_EXCLUDED' }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [file, expectedProject, privateSchema, ...extra] = process.argv.slice(2)
  if (!file || !expectedProject || !privateSchema || extra.length) {
    throw new Error('Usage: node review-data-api-observation.mjs observation.json project-ref private-schema')
  }
  const observation = JSON.parse(await readFile(file, 'utf8'))
  const result = reviewDataApi(observation, { expectedProject, privateSchema })
  console.log(JSON.stringify(result))
  if (result.decision === 'BLOCK') process.exitCode = 1
}
