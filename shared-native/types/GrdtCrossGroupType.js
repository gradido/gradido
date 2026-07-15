const GRDT_CROSS_GROUP_TYPES = [
  'GRDT_CROSS_GROUP_LOCAL',
  'GRDT_CROSS_GROUP_INBOUND',
  'GRDT_CROSS_GROUP_OUTBOUND',
  'GRDT_CROSS_GROUP_CROSS',
] 

// The type is derived directly from the array
// for runtime check
function isGrdtCrossGroupType(input) {
  return GRDT_CROSS_GROUP_TYPES.includes(input)
}
module.exports = {
  GRDT_CROSS_GROUP_TYPES,
  isGrdtCrossGroupType,
}
