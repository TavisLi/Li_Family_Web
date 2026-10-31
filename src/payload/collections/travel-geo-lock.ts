import { sql } from '@payloadcms/db-postgres'
import type { CollectionBeforeOperationHook, PayloadRequest } from 'payload'

// All three travel collections share this lock so a parent audience change
// cannot race a Day approval. The operation owns commit/rollback.
export async function lockTravelGeoRequest(req: PayloadRequest): Promise<void> {
  const transactionID = await req.transactionID
  const transaction = transactionID == null
    ? undefined
    : req.payload.db.sessions?.[transactionID]?.db as Pick<typeof req.payload.db.drizzle, 'execute'> | undefined
  if (!transaction) throw new Error('Travel geo writes require an active transaction')
  const result = await transaction.execute(sql`select pg_try_advisory_xact_lock(180, 1) as locked, current_setting('transaction_isolation') as isolation`)
  const lock = result?.rows?.[0]
  if (lock?.locked !== true || lock?.isolation !== 'read committed') {
    throw new Error('Travel geo write conflict: an immediate read committed transaction lock is required')
  }
}

// Payload initializes the transaction before this hook and reads Current after
// it. Locking in beforeChange would leave that original document stale.
export const lockTravelGeoWrites: CollectionBeforeOperationHook = async ({ args, operation }) => {
  if (['create', 'update', 'delete', 'restoreVersion'].includes(operation)) {
    if (!args.req) throw new Error('Travel geo writes require a request')
    await lockTravelGeoRequest(args.req)
  }
  return args
}
