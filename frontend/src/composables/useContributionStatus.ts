// AI-GENERATED — not an architecture reference

/**
 * The colour and the symbol of a contribution's status, as the list rows draw them in the
 * avatar circle. `205` is a colour of the wallet's own, not one of Bootstrap's.
 */
export const useContributionStatus = () => {
  const statusMapping: Record<string, { variant: string; icon: string }> = {
    CONFIRMED: { variant: 'success', icon: 'check' },
    DELETED: { variant: 'danger', icon: 'trash' },
    DENIED: { variant: 'warning', icon: 'x-circle' },
    IN_PROGRESS: { variant: '205', icon: 'question' },
    default: { variant: 'primary', icon: 'bell-fill' },
  }

  const getVariant = (status: string) => (statusMapping[status] || statusMapping.default).variant

  const getIcon = (status: string) => (statusMapping[status] || statusMapping.default).icon

  return {
    getVariant,
    getIcon,
  }
}
