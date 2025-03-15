export class Message {
  content: string
  role: 'user' | 'assistant' = 'user'
  threadId: string

  constructor(content: string, role: 'user' | 'assistant' = 'user') {
    this.content = content
    this.role = role
  }
}
