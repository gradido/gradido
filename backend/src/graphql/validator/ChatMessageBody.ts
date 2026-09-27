// AI-GENERATED — not an architecture reference
import {
  minLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator'
import { MESSAGE_MIN_CHARS } from 'shared'

/**
 * The text of a chat message is at least MESSAGE_MIN_CHARS long -- unless the message carries a
 * picture: a picture without a caption is a message (E-044, "Bildunterschrift (freiwillig)").
 * The upper bound stays where it was, a MaxLength of its own on the same field. Without a picture
 * it counts as @MinLength counted before: class-validator's own minLength.
 *
 * ⛔ A decorator of its own rather than a MinLength behind @ValidateIf: class-validator's
 * @ValidateIf switches off EVERY check of the field when its condition is false, the MaxLength
 * beside it included -- a message with a picture would have taken any length of text.
 *
 * Reads the picture from the args object it is validated on (SendChatMessageArgs.image).
 */
export function isLongEnoughForChatMessage(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLongEnoughForChatMessage',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const withPicture = (args.object as { image?: unknown }).image != null
          return withPicture ? typeof value === 'string' : minLength(value, MESSAGE_MIN_CHARS)
        },
        defaultMessage() {
          return `${propertyName} must be at least ${MESSAGE_MIN_CHARS} characters long, unless the message carries a picture`
        },
      },
    })
  }
}
