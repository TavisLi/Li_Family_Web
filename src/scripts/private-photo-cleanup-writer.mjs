export const deleteFixtureMediaSql = 'DELETE FROM public.media WHERE id = $1 AND family_asset_key = $2 RETURNING id'

export async function privatePhotoCleanupWriter() {
  throw new Error('BLOCK: Production photo cleanup requires Supervisor integration')
}
