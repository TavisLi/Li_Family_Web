import assert from 'node:assert/strict'

const boundedSettings = ['statement_timeout', 'lock_timeout', 'idle_in_transaction_session_timeout', 'transaction_timeout']

export function boundedRestoreSql(sql) {
  assert.equal(typeof sql, 'string')
  const lines = sql.split('\n')
  const psqlCommands = lines.filter((line) => line.startsWith('\\'))
  assert.equal(psqlCommands.length, 2, 'BLOCK: unexpected psql command in restore artifact')
  const restrict = psqlCommands[0].match(/^\\restrict ([A-Za-z0-9_]+)$/)
  assert(restrict, 'BLOCK: restore restrict marker')
  assert.equal(psqlCommands[1], `\\unrestrict ${restrict[1]}`, 'BLOCK: restore unrestrict marker')
  let result = lines.filter((line) => !line.startsWith('\\')).join('\n')
  for (const name of boundedSettings) {
    const reset = new RegExp(`^SET ${name}\\s*=\\s*0\\s*;\\s*$`, 'gim')
    result = result.replace(reset, '')
  }
  assert.doesNotMatch(result, /^SET (?:statement_timeout|lock_timeout|idle_in_transaction_session_timeout|transaction_timeout)\s*=\s*0\s*;/im,
    'BLOCK: schema restore would disable bounded server timeouts')
  return result
}

export function boundedRestoreScript(sql) {
  assert.equal(typeof sql, 'string')
  const lines = sql.split('\n')
  const markers = []
  let copyOpen = false
  for (const line of lines) {
    if (copyOpen) {
      if (line === '\\.') copyOpen = false
      continue
    }
    if (/^COPY\b.*\bFROM stdin;$/i.test(line)) { copyOpen = true; continue }
    if (!line.startsWith('\\')) continue
    const restrict = line.match(/^\\restrict ([A-Za-z0-9_]+)$/)
    if (restrict) { markers.push(['restrict', restrict[1]]); continue }
    const unrestrict = line.match(/^\\unrestrict ([A-Za-z0-9_]+)$/)
    if (unrestrict) { markers.push(['unrestrict', unrestrict[1]]); continue }
    assert.fail('BLOCK: unexpected psql command in restore artifact')
  }
  assert.equal(copyOpen, false, 'BLOCK: unterminated COPY in restore artifact')
  assert.deepEqual(markers.length, 2, 'BLOCK: restore restrict marker count')
  assert.deepEqual(markers, [['restrict', markers[0]?.[1]], ['unrestrict', markers[0]?.[1]]],
    'BLOCK: restore restrict marker pair')
  copyOpen = false
  const boundedLines = []
  for (const line of lines) {
    if (copyOpen) {
      boundedLines.push(line)
      if (line === '\\.') copyOpen = false
      continue
    }
    if (/^COPY\b.*\bFROM stdin;$/i.test(line)) {
      copyOpen = true
      boundedLines.push(line)
      continue
    }
    const reset = new RegExp(`^SET (?:${boundedSettings.join('|')})\\s*=\\s*0\\s*;\\s*$`, 'i')
    boundedLines.push(reset.test(line) ? '' : line)
  }
  copyOpen = false
  const timeoutReset = /^SET (?:statement_timeout|lock_timeout|idle_in_transaction_session_timeout|transaction_timeout)\s*=\s*0\s*;\s*$/i
  for (const line of boundedLines) {
    if (copyOpen) {
      if (line === '\\.') copyOpen = false
      continue
    }
    if (/^COPY\b.*\bFROM stdin;$/i.test(line)) { copyOpen = true; continue }
    assert.doesNotMatch(line, timeoutReset, 'BLOCK: schema restore would disable bounded server timeouts')
  }
  const result = boundedLines.join('\n')
  return result
}

export function terminalStatus(result, cleanup) {
  return result === 'PASS' && cleanup === 'PASS' ? 'PASS' : 'BLOCK'
}
