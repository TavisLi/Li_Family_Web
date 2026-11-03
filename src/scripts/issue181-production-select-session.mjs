// Production execution remains disabled until an independently verified host capability exists.
// Arguments are deliberately ignored: caller-supplied providers, transports, and clocks grant no authority.
export async function executeIssue181Session() {
  throw new Error('BLOCK: trusted production host capability is not configured')
}
