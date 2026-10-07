import { AppContext } from 'shared'

// The hashing thread test/testSetup.ts started for this file. Without this every file in the
// run leaves its thread behind, and jest reports the thread-safe function as an open handle.
afterAll(() => {
  AppContext.getInstance().destroy()
})
