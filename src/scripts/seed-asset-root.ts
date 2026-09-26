import path from 'node:path'

export function seedAssetRoot(projectRoot: string): string {
  const configured = process.env.CONTENT_SOURCE_ASSET_ROOT
  if (!configured) return path.join(projectRoot, 'content-source/assets')
  if (!path.isAbsolute(configured)) throw new Error('CONTENT_SOURCE_ASSET_ROOT must be an absolute path')
  return configured
}
