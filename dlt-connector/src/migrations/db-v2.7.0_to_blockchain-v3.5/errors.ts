import * as v from 'valibot'

export class NotEnoughGradidoBalanceError extends Error {
  constructor(public needed: number, public exist: number) {
    super(`Not enough Gradido Balance for send coins, needed: ${needed} Gradido, exist: ${exist} Gradido`)
    this.name = 'NotEnoughGradidoBalanceError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string, rows: any, originalError: Error) {
    const parts: string[] = [`DatabaseError in ${message}`]

    // Valibot-specific
    if (originalError instanceof v.ValiError) {
      const flattened = v.flatten(originalError.issues)
      parts.push('Validation errors:')
      parts.push(JSON.stringify(flattened, null, 2))
    } else {
      parts.push(`Original error: ${originalError.message}`)
    }

    parts.push('Rows:')
    parts.push(JSON.stringify(rows, null, 2))

    super(parts.join('\n\n'))

    this.name = 'DatabaseError'
  }
}

export class BlockchainError extends Error {
  constructor(message: string, item: any, originalError: Error) {
    const parts: string[] = [`BlockchainError in ${message}`]

    parts.push(`Original error: ${originalError.message}`)
    parts.push('Item:')
    parts.push(JSON.stringify(item, null, 2))

    super(parts.join('\n\n'))

    this.name = 'BlockchainError'
    this.stack = originalError.stack
  }
}

export class NegativeBalanceError extends Error {
  constructor(message: string, previousBalanceString: string, amount: string, previousDecayedBalance: string) {
    const parts: string[] = [`NegativeBalanceError in ${message}`]
    parts.push(`Previous balance: ${previousBalanceString}`)
    parts.push(`Amount: ${amount}`)
    parts.push(`Previous decayed balance: ${previousDecayedBalance}`)
    super(parts.join('\n'))
    this.name = 'NegativeBalanceError'
  }
}