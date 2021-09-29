export default function (amount: number, from: Date, to: Date): number {
  // what happens when from > to
  // Do we want to have negative decay?
  const decayDuration = (to.getTime() - from.getTime()) / 1000
  return amount * Math.pow(0.99999997802044727, decayDuration)
}
