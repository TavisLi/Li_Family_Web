export type AdminAccessUser = { role?: string | null } | null | undefined

export function canAccessAdmin({ user }: { user: AdminAccessUser }): boolean {
  return user?.role === 'admin'
}

export function canManageContent({ user }: { user: AdminAccessUser }): boolean {
  return canAccessAdmin({ user })
}
