export enum CrossGroupType {
  LOCAL = 0,
  INBOUND = 1,
  OUTBOUND = 2,
  // for cross group transaction which haven't a direction like group friend update
  // CROSS = 3,
}

export function getCrossGroupTypeEnumValue(typeValue: number | string): CrossGroupType | undefined {
  if (typeof typeValue === 'number') {
    return CrossGroupType[typeValue] as unknown as CrossGroupType
  } else if (typeof typeValue === 'string') {
    // Iterate through all enum values
    for (const key in CrossGroupType) {
      if (CrossGroupType[key] === typeValue) {
        return CrossGroupType[key] as unknown as CrossGroupType
      }
    }
  }
  return undefined // If the string is not found
}
