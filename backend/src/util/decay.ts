export default function (amount: number, from: Date, to: Date): number {
  const decayDuration = (to.getTime() - from.getTime()) / 1000
  return amount * Math.pow(0.99999997802044727, decayDuration)
}
