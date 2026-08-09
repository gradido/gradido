// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * One message in the moderator's chat with Crea (CreaChat).
 *
 * `errorCode` carries the trouble instead of a ready-made sentence: the backend has no
 * business deciding which language the moderator reads. When it is set, `content` is
 * empty and the admin renders the matching `ai.error-*` text. Known codes:
 * `api_inactive` (Crea is switched off), `thread_not_found` (the thread is gone or
 * belongs to someone else), `output_too_long` (the answer was cut off - paste less at
 * a time), `send_failed` (anything else the call ran into; the cause is in the log).
 */
@ObjectType()
export class CreaChatMessage {
  @Field()
  content: string

  @Field()
  role: string

  @Field(() => String, { nullable: true })
  threadId?: string | null

  @Field(() => String, { nullable: true })
  errorCode?: string | null

  public constructor(content: string, role: string, threadId?: string | null) {
    this.content = content
    this.role = role
    this.threadId = threadId ?? null
    this.errorCode = null
  }

  /** An empty assistant message that only names what went wrong. */
  public static error(errorCode: string): CreaChatMessage {
    const message = new CreaChatMessage('', 'assistant')
    message.errorCode = errorCode
    return message
  }
}
