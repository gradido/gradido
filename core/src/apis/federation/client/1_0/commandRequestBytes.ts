// AI-GENERATED — not an architecture reference
import { EncryptedTransferArgs } from '../../../../graphql/model/EncryptedTransferArgs'
import { sendCommand } from './query/sendCommand'

/**
 * The largest request the federation module takes: it mounts express.json() without a limit
 * (federation/src/server/createServer.ts), and body-parser's default is 100 KB. Measured with
 * the express the module uses (4.22, body-parser 1.20): a body of 102,400 bytes comes in, one of
 * 102,401 is answered 413 before any resolver runs -- and the sending server learns no more than
 * that.
 */
export const FEDERATION_REQUEST_MAX_BYTES = 100 * 1024

/**
 * Room kept free under that limit for what another version of graphql-request might add around
 * the same query and variables -- an operation name, extensions. commandRequestBytes counts the
 * body the installed version sends, byte for byte (commandRequestBytes.test.ts).
 */
export const FEDERATION_REQUEST_MARGIN_BYTES = 1024

/**
 * The size of the request CommandClient sends for a command: the JSON body as graphql-request
 * writes it -- `{ query, variables: { args } }` with the sendCommand document; the operation name
 * of an anonymous document stays out -- counted in bytes of UTF-8, as it goes over the wire and as
 * body-parser counts it.
 *
 * A chat message with a picture comes close to the federation's limit (P7b): the sending server
 * measures its sealed command before it files or sends anything (commandRequestFits).
 */
export const commandRequestBytes = (args: EncryptedTransferArgs): number =>
  Buffer.byteLength(JSON.stringify({ query: sendCommand, variables: { args } }), 'utf8')

/** Whether the federation module takes the request for this command, with the room kept free. */
export const commandRequestFits = (args: EncryptedTransferArgs): boolean =>
  commandRequestBytes(args) + FEDERATION_REQUEST_MARGIN_BYTES <= FEDERATION_REQUEST_MAX_BYTES
