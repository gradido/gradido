// AI-GENERATED — not an architecture reference
import { getCurrentInstance } from 'vue'
import type { createFilters } from '@/filters/amount'

/** The wallet's number filters, as main.js hangs them on every component (`$filters`). */
export type Filters = ReturnType<typeof createFilters>

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $filters: Filters
  }
}

/**
 * The filters a template reaches as `$filters`, for a component written in TSX, which has no
 * template to reach them in. Read off the instance as the template reads them, and when a
 * filter is called, not when the component is made: a spec hands its own in through `mocks`,
 * as it did for the template, and those reach the instance only after setup has run.
 */
export const useFilters = (): Filters => {
  const instance = getCurrentInstance()
  if (!instance?.proxy) {
    throw new Error('useFilters() is for setup() only')
  }
  const { proxy } = instance
  const filter = (name: keyof Filters) => (value: unknown) => proxy.$filters[name](value)
  return { amount: filter('amount'), signedAmount: filter('signedAmount'), GDD: filter('GDD') }
}
