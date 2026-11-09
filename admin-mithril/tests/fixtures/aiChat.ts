// AI-GENERATED — not an architecture reference

/** A message of Crea's chat, as resumeChat and sendMessage answer it. */
export const chatMessage = (more: Record<string, unknown> = {}) => ({
  __typename: 'CreaChatMessage',
  content: 'Hello, I am Crea.',
  role: 'assistant',
  threadId: 'thread-1',
  errorCode: null,
  ...more,
})

/**
 * The chat on the contributions page, for the tests about something else: it stands there for
 * every AI moderator and reads the last conversation as the page loads. One is resumed -- without
 * one the chat would start a new one at once, and ask Crea for her greeting.
 */
export const resumedChat = { resumeChat: [chatMessage()] }
