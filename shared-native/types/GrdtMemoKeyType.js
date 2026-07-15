const GRDT_MEMO_KEY_TYPES = [
  'GRDT_MEMO_KEY_SHARED_SECRET',
  'GRDT_MEMO_KEY_COMMUNITY_SECRET',
  'GRDT_MEMO_KEY_PLAIN',
]

// The type is derived directly from the array
// for runtime check
function isGrdtMemoKeyType(input) {
  return GRDT_MEMO_KEY_TYPES.includes(input)
}

module.exports = {
  GRDT_MEMO_KEY_TYPES,
  isGrdtMemoKeyType,
}
