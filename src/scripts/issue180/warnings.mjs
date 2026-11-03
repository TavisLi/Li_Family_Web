// LC_ALL=C is fixed by the lifecycle. Match severity records, not stderr itself.
export function warningLines(text = '') {
  return String(text).split(/\r?\n/).filter(line =>
    /^\s*(?:(?:initdb|postgres|pg_ctl|pg_config|psql|ps)(?::[^\r\n]*?)?:\s*)?WARNING:\s*/i.test(line) ||
    /^\s*\d{4}-\d\d-\d\d[^\r\n]*\bWARNING:\s*/.test(line))
}

// Payload's pretty logger uses ANSI-coloured [HH:MM:SS] WARN: records.
export function workerWarningLines(text = '') {
  return String(text).split(/\r?\n/).filter(line => {
    const plain = line.replace(/\x1b\[[0-9;]*m/g, '')
    if (/^\s*\[\d{2}:\d{2}:\d{2}\]\s+WARN:\s*/.test(plain)) return true
    try { return JSON.parse(plain).level === 40 } catch { return warningLines(plain).length > 0 }
  })
}
