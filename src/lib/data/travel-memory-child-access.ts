export async function readTravelMemoryChildAfterOwner<Owner, Child>(input: {
  readOwner: () => Promise<Owner | null>
  readChild: (owner: Owner) => Promise<Child | null>
}): Promise<Child | null> {
  const owner = await input.readOwner()
  return owner ? input.readChild(owner) : null
}
