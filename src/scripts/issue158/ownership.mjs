import assert from 'node:assert/strict'

export function inspectOwnedCiService(containers, { hostPort, image }) {
  assert(Array.isArray(containers), 'BLOCK: Docker inspect result')
  const matches = containers.filter((container) => container?.ports?.some((port) =>
    port.hostPort === Number(hostPort) && port.containerPort === 5432 && port.protocol === 'tcp'))
  assert.equal(matches.length, 1, 'BLOCK: CI PostgreSQL service ownership is ambiguous')
  const [service] = matches
  assert.match(service.id ?? '', /^[a-f0-9]{12,64}$/i, 'BLOCK: CI service container identity')
  assert.equal(service.image, image, 'BLOCK: CI service image digest drift')
  assert(service.ports.some((port) => port.hostPort === Number(hostPort) && port.hostIp === '127.0.0.1'),
    'BLOCK: CI service port is not loopback-bound')
  return { containerId: service.id, image: service.image, hostPort: Number(hostPort), containerPort: 5432,
    hostIp: '127.0.0.1', ownership: 'GitHub Actions job service; Docker inspect readback' }
}

export function verifyConnectedPeer({ endpointHost, endpointPort, serverAddress, serverPort, version, socket = false }) {
  assert.match(version, /^17\.11(?:\b|$)/, 'BLOCK: PostgreSQL exact runtime mismatch')
  if (socket) {
    assert.equal(serverAddress, null, 'BLOCK: Unix-socket peer mismatch')
    assert([0, null].includes(serverPort), 'BLOCK: Unix-socket peer reported an unexpected TCP port')
    return { endpoint: 'owned-private-unix-socket', serverAddress: null, serverPort: null, version }
  }
  assert.equal(Number(serverPort), 5432, 'BLOCK: PostgreSQL service port mismatch')
  assert.equal(endpointHost, '127.0.0.1', 'BLOCK: TCP endpoint must be loopback')
  assert(Number.isInteger(Number(endpointPort)) && Number(endpointPort) > 0, 'BLOCK: TCP endpoint port')
  assert(typeof serverAddress === 'string' && serverAddress.length > 0,
    'BLOCK: PostgreSQL container peer is unavailable')
  return { endpoint: `127.0.0.1:${Number(endpointPort)}`, serverAddress, serverPort: 5432, version,
    note: 'server address may be a Docker bridge address; ownership is established separately by Docker inspect' }
}
