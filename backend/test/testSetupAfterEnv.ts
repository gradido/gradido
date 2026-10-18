import cluster from 'node:cluster'
import { AppContext } from 'shared'

// The hashing thread test/testSetup.ts started for this file. Without this every file in the
// run leaves its thread behind, and jest reports the thread-safe function as an open handle.
afterAll(() => {
  AppContext.getInstance().destroyPasswordHashing()
})

// log4js listens for the messages of cluster workers, on Node's own `cluster`, which every
// file of the run shares. Left there, the listener of each file keeps all that file loaded
// alive: some 30 MB a file, and the run ends on the heap limit before its last file.
afterAll(() => {
  cluster.removeAllListeners('message')
})
