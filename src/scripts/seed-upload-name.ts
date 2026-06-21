export function uploadFilenameForSourcePath(sourcePath: string): string {
  return sourcePath.replace(/[^A-Za-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '')
}
