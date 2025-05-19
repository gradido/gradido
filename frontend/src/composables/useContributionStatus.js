export const useContributionStatus = () => {
  const statusMapping = {
    CONFIRMED: { variant: 'success', icon: 'check' },
    DELETED: { variant: 'danger', icon: 'trash' },
    DENIED: { variant: 'warning', icon: 'x-circle' },
    IN_PROGRESS: { variant: '205', icon: 'question' },
    default: { variant: 'primary', icon: 'bell-fill' },
  }

  const getVariant = (status) => {
    return (statusMapping[status] || statusMapping.default).variant
  }

  const getIcon = (status) => {
    return (statusMapping[status] || statusMapping.default).icon
  }

  return {
    getVariant,
    getIcon,
  }
}
