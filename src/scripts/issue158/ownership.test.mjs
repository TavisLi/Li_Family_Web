import assert from 'node:assert/strict'
import test from 'node:test'

import { inspectOwnedCiService, verifyConnectedPeer } from './ownership.mjs'

const image = 'postgres:17.11@sha256:d74eeac9a635390a49bc21bd49fccd973de707e2a53a76ac49b552b8712ec46f'

test('CI peer is bound to one inspected loopback-published digest-pinned service', () => {
  const service = { id: 'abc123def456', image, ports: [
    { hostIp: '127.0.0.1', hostPort: 55444, containerPort: 5432, protocol: 'tcp' },
  ] }
  assert.equal(inspectOwnedCiService([service], { hostPort: 55444, image }).containerId, service.id)
  assert.throws(() => inspectOwnedCiService([service, service], { hostPort: 55444, image }), /ambiguous/)
  assert.throws(() => inspectOwnedCiService([{ ...service, image: 'postgres:17.11' }], { hostPort: 55444, image }), /digest drift/)
  assert.throws(() => inspectOwnedCiService([{ ...service, ports: [{ ...service.ports[0], hostIp: '0.0.0.0' }] }],
    { hostPort: 55444, image }), /loopback-bound/)
})

test('container bridge peer is recorded separately from the loopback connection endpoint', () => {
  const peer = verifyConnectedPeer({ endpointHost: '127.0.0.1', endpointPort: 55444,
    serverAddress: '172.18.0.2/32', serverPort: 5432, version: '17.11' })
  assert.equal(peer.endpoint, '127.0.0.1:55444')
  assert.equal(peer.serverAddress, '172.18.0.2/32')
  assert.throws(() => verifyConnectedPeer({ endpointHost: '127.0.0.1', endpointPort: 55444,
    serverAddress: null, serverPort: 5432, version: '17.11' }), /peer is unavailable/)
  assert.throws(() => verifyConnectedPeer({ endpointHost: '127.0.0.1', endpointPort: 55444,
    serverAddress: '172.18.0.2', serverPort: 5432, version: '17.10' }), /exact runtime/)
})
