// AI-GENERATED — not an architecture reference
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'

// The subject bound is not in `shared` because the frontend cannot import from there yet
// (see the note in frontend/src/validationSchemas.js); keep both in step by hand.
const SUBJECT_MAX_CHARS = 100
const SUBJECT_MIN_CHARS = 5
const SENDER_NAME_MAX_CHARS = 50
const SENDER_NAME_MIN_CHARS = 2

@ArgsType()
export class PublicContactArgs {
  // The alias out of the Gradido address, or the Gradido ID for an account that has no
  // user name yet. Deliberately NOT an e-mail address - see PublicContactResolver.
  @Field(() => String)
  @IsString()
  @MaxLength(64)
  recipientIdentifier: string

  // Unverified, like everything else a stranger types here. The mail that carries it says so.
  @Field(() => String)
  @MaxLength(SENDER_NAME_MAX_CHARS)
  @MinLength(SENDER_NAME_MIN_CHARS)
  senderName: string

  // The only way the recipient can answer, so the shape is checked - but never the owner.
  @Field(() => String)
  @IsEmail()
  senderEmail: string

  @Field(() => String)
  @MaxLength(SUBJECT_MAX_CHARS)
  @MinLength(SUBJECT_MIN_CHARS)
  subject: string

  // No amount travels with this, so it uses the roomier message bounds, like sendEmail does.
  @Field(() => String)
  @MaxLength(MESSAGE_MAX_CHARS)
  @MinLength(MESSAGE_MIN_CHARS)
  message: string

  // A honeypot: the form renders it out of sight, so a human leaves it empty and a bot
  // fills it in. Whoever fills it gets the same answer as everybody else and no mail.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string
}
