export class NotEnoughGradidoBalanceError extends Error {
  constructor(public needed: number, public exist: number) {
    super(`Not enough Gradido Balance for send coins, needed: ${needed} Gradido, exist: ${exist} Gradido`)
  }
}
  