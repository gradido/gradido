// AI-GENERATED — not an architecture reference

/**
 * How many of the moderation's remarks one HTTP request may read or write -- userRemark and
 * setUserRemark counted as one: a document may repeat a field under any number of aliases
 * (RequestBudget). The admin interface asks for one at a time, with the messages of a contribution.
 */
export const USER_REMARKS_MAX_PER_REQUEST = 5

/** An emptied remark is taken away rather than kept as an empty row: whitespace alone says nothing. */
export const isEmptyRemark = (remark: string): boolean => remark.trim() === ''
