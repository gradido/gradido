export const useDateFormatter = () => {
  const formatDateFromDateTime = (datetimeString) => {
    if (!datetimeString || !datetimeString?.includes('T')) {
      return datetimeString
    }
    return datetimeString.split('T')[0]
  }
  const formatDateOrDash = (value) => (value ? new Date(value).toLocaleDateString() : '—')

  return {
    formatDateFromDateTime,
    formatDateOrDash,
  }
}
