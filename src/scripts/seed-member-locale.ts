export function memberLocalizedWriteOptions() {
  return { locale: 'zh-TW' as const }
}

export function memberEnglishLocalizedData<T extends Record<string, unknown>>(
  memberData: T,
  displayName: string,
): T & { displayName: string } {
  return {
    ...memberData,
    displayName,
  }
}
