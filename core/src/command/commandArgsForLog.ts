// AI-GENERATED — not an architecture reference
import { chatMessageImagesForLog } from '../logic/ChatMessageImage.logic'

/**
 * A command's arguments as the debug log writes them. They travel as JSON strings, and those of
 * a chat message may carry a picture (P7b, SendEmailCommandParams.images): each picture's `data`
 * is written as its length (chatMessageImagesForLog). Everything else as it came -- the text of a
 * message too, as before the pictures. An argument that is no JSON stays as it is.
 *
 * For the lines of the command path that write a command's arguments: the executor, the factory,
 * the base command and SendEmailCommand itself.
 */
export const commandArgsForLog = (args: unknown): unknown =>
  Array.isArray(args) ? args.map(commandArgForLog) : args

const commandArgForLog = (arg: unknown): unknown => {
  if (typeof arg !== 'string') {
    return arg
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(arg)
  } catch {
    return arg
  }
  return typeof parsed === 'object' && parsed !== null && 'images' in parsed
    ? JSON.stringify({ ...parsed, images: chatMessageImagesForLog(parsed.images) })
    : arg
}
