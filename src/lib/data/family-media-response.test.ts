import assert from 'node:assert/strict'
import test from 'node:test'
import { familyMediaResponse } from './family-media-response'

const digest = 'a'.repeat(64)
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
const body = () => new Blob([bytes]).stream()

test('anonymous and invalid requests never resolve metadata or reach the private store', async () => {
  for (const target of [{ canReadFamily: false, id:'3', variant:'original' },
    { canReadFamily:true,id:'-1',variant:'original' }, { canReadFamily:true,id:'3',variant:'../original' }]) {
    const response = await familyMediaResponse({ ...target, findFamilyKey: async () => assert.fail(),
      getPrivatePhoto: async () => assert.fail() })
    assert.equal(response.status,404)
    assert.equal(response.headers.get('cache-control'),'private, no-store')
  }
})

test('family reads fetch one exact key and do not disclose the bucket or cache the response', async () => {
  const response = await familyMediaResponse({ canReadFamily:true,id:'3',variant:'medium',
    findFamilyKey:async id => { assert.equal(id,3); return digest },
    getPrivatePhoto:async key => {
      assert.equal(key,`family-media/${digest}/medium.jpeg`)
      return {body:body(),bytes:4,mimeType:'image/jpeg'}
    },
  })
  assert.equal(response.status,200)
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes)
  assert.equal(response.headers.get('cache-control'),'private, no-store')
  assert.equal(response.headers.get('location'),null)
})

test('wrong metadata or an invalid asset key cannot be used for an object fetch', async () => {
  const noKey = await familyMediaResponse({canReadFamily:true,id:'3',variant:'original',
    findFamilyKey:async ()=>'../public',getPrivatePhoto:async () => assert.fail()})
  assert.equal(noKey.status,404)
  const invalid = await familyMediaResponse({canReadFamily:true,id:'3',variant:'original',
    findFamilyKey:async ()=>digest,getPrivatePhoto:async ()=>({body:body(),bytes:4,mimeType:'text/html'})})
  assert.equal(invalid.status,502)
})

test('a mismatched object length cannot complete a successful response', async () => {
  for (const reported of [3,5]) {
    const response = await familyMediaResponse({canReadFamily:true,id:'3',variant:'original',
      findFamilyKey:async ()=>digest,getPrivatePhoto:async ()=>({body:body(),bytes:reported,mimeType:'image/jpeg'})})
    await assert.rejects(response.arrayBuffer(),/size/)
  }
})
