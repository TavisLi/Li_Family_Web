import assert from 'node:assert/strict'
import test from 'node:test'

import { boundedRestoreScript, boundedRestoreSql, terminalStatus } from './restore.mjs'

test('restore removes dump timeout resets and fails closed if one survives', () => {
  const sql = '\\restrict RestoreKey\nSET statement_timeout = 0;\nSET lock_timeout=0;\n' +
    'CREATE TABLE public.t (id int);\n\\unrestrict RestoreKey\n'
  const restored = boundedRestoreSql(sql)
  assert.equal(restored, '\n\nCREATE TABLE public.t (id int);\n')
  assert.doesNotMatch(restored, /SET (?:statement_timeout|lock_timeout)\s*=\s*0/i)
  assert.doesNotMatch(restored, /^\\(?:restrict|unrestrict)/m)
  assert.throws(() => boundedRestoreSql('\\copy public.t from stdin\n'), /unexpected psql command/)
})

test('full dump restore preserves only paired markers and balanced COPY blocks under timeout bounds', () => {
  const sql = '\\restrict RestoreKey\nSET statement_timeout = 0;\nCREATE TABLE public.t (id int);\n' +
    'COPY public.t (id) FROM stdin;\n1\nSET statement_timeout = 0;\n' +
    'COPY public.x FROM stdin;\n\\N\n\\.\n\\unrestrict RestoreKey\n'
  const restored = boundedRestoreScript(sql)
  assert.match(restored, /^\\restrict RestoreKey/m)
  assert.match(restored, /^\\unrestrict RestoreKey/m)
  assert.match(restored, /^COPY public\.t \(id\) FROM stdin;\n1\nSET statement_timeout = 0;\nCOPY public\.x FROM stdin;\n\\N\n\\\.$/m)
  assert.doesNotMatch(restored.split(/^COPY .*FROM stdin;$/im)[0], /^SET statement_timeout\s*=\s*0/im)
  assert.throws(() => boundedRestoreScript(sql.replace('\\unrestrict', '\\copy public.t from stdin\n\\unrestrict')),
    /unexpected psql command/)
  assert.throws(() => boundedRestoreScript(sql.replace('\\.\n', '')), /unterminated COPY/)
})

test('cleanup UNKNOWN cannot produce a passing terminal result', () => {
  assert.equal(terminalStatus('PASS', 'PASS'), 'PASS')
  assert.equal(terminalStatus('PASS', 'UNKNOWN'), 'BLOCK')
  assert.equal(terminalStatus('BLOCK', 'PASS'), 'BLOCK')
})
