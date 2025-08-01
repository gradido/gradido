import * as v from 'valibot'
import { MemoryBlock } from 'gradido-blockchain-js'

export const keyGenerationSeedSchema = v.pipe(
  v.string('expect string type'),
  v.hexadecimal('expect hexadecimal string'),
  v.length(64, 'expect seed length minimum 64 characters (32 Bytes)'),
  v.transform<string, MemoryBlock>(
    (input: string) => MemoryBlock.fromHex(input),
  ),
)