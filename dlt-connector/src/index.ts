/* eslint-disable @typescript-eslint/no-explicit-any */

async function main() {
  // eslint-disable-next-line no-console
  console.log('Hallo Welt')
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})
