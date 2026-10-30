// Payload rebuilds scoped Current/version arrays and relationships with RETURNING.
// Bound each SQL result while preserving the caller's DB/transaction and row order.
export async function withIssue134BoundedInserts(adapter, update) {
  const original = adapter.insert
  if (typeof original !== 'function') throw new Error('BLOCK: Payload insert adapter unavailable')
  const wrapped = async function (args) {
    if (!/^(?:travel_memories|travel_memory_days|_travel_memories_v|_travel_memory_days_v|media)(?:_|$)/.test(args.tableName) ||
      !Array.isArray(args.values) || args.values.length <= 20) {
      return original.call(this, args)
    }
    const result = []
    for (let offset = 0; offset < args.values.length; offset += 20) {
      const values = args.values.slice(offset, offset + 20)
      const rows = await original.call(this, { ...args, values })
      if (!Array.isArray(rows) || rows.length !== values.length) {
        throw Object.assign(new Error('BLOCK: scoped Payload insert returned incomplete batch'),
          { code: 'MEMORY_RELATION_BATCH_INCOMPLETE' })
      }
      result.push(...rows)
    }
    return result
  }
  adapter.insert = wrapped
  try { return await update() } finally {
    if (adapter.insert === wrapped) adapter.insert = original
  }
}
