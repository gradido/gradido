// AI-GENERATED — not an architecture reference

/**
 * Where a chat message was written, where the wallet says so (`origin` of sendChatMessage). Only
 * the map profile's "say hello" sets it; every other way of writing leaves it out. It decides one
 * thing: whether the first message of a conversation is noted as an event (CHAT_HELLO_SEND, for
 * the community figures). Nothing of it is filed with the message.
 *
 * MAP only, for now: a further origin comes with the figure that needs it.
 */
export enum ChatMessageOrigin {
  MAP = 'MAP',
}
