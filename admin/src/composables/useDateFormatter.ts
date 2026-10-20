// AI-GENERATED — not an architecture reference
export const useDateFormatter = () => {
  const formatDateFromDateTime = (datetimeString: string | null | undefined) => {
    if (!datetimeString || !datetimeString?.includes('T')) {
      return datetimeString
    }
    return datetimeString.split('T')[0]
  }
  // also a table's formatter, which hands over whatever the cell holds
  const formatDateOrDash = (value: unknown) =>
    value ? new Date(value as string | number | Date).toLocaleDateString() : '—'

  return {
    formatDateFromDateTime,
    formatDateOrDash,
  }
}
