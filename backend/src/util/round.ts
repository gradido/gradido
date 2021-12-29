function roundCeilFrom4(decimal: number): number {
  return Math.ceil(decimal / 100) / 100
}

function roundFloorFrom4(decimal: number): number {
  return Math.floor(decimal / 100) / 100
}

function roundCeilFrom2(decimal: number): number {
  return Math.ceil(decimal / 100)
}

function roundFloorFrom2(decimal: number): number {
  return Math.floor(decimal / 100)
}

export { roundCeilFrom4, roundFloorFrom4, roundCeilFrom2, roundFloorFrom2 }
