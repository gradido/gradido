export const useDateFormatter = () => {
  const formatDateFromDateTime = (datetimeString) => {
    if (!datetimeString || !datetimeString?.includes('T')) return datetimeString
    return datetimeString.split('T')[0]
  }

  return {
    formatDateFromDateTime,
  }
}
