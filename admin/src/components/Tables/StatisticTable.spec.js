import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import StatisticTable from './StatisticTable.vue'
import { useI18n } from 'vue-i18n'
import { BTableSimple, BTbody, BTd, BTh, BThead, BTr } from 'bootstrap-vue-next'

vi.mock('vue-i18n')

describe('StatisticTable', () => {
  let wrapper
  const mockT = vi.fn((key) => key)
  const mockN = vi.fn((n) => n.toFixed(2))

  beforeEach(() => {
    useI18n.mockReturnValue({
      t: mockT,
      n: mockN,
    })

    wrapper = mount(StatisticTable, {
      props: {
        statistics: {
          totalUsers: 3113,
          activeUsers: 1057,
          deletedUsers: 35,
          totalGradidoCreated: '4083774.05000000000000000000',
          totalGradidoDecayed: '-1062639.13634129622923372197',
          totalGradidoAvailable: '2513565.869444365732411569',
          totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
        },
      },
      global: {
        stubs: {
          BTableSimple,
          BThead,
          BTbody,
          BTr,
          BTh,
          BTd,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.statistic-table').exists()).toBe(true)
  })

  it('renders the table with correct structure', () => {
    expect(wrapper.findAll('thead > tr > th')).toHaveLength(3)
    expect(wrapper.findAll('tbody > tr')).toHaveLength(7)
  })

  it('displays correct column headers', () => {
    const headers = wrapper.findAll('th')
    expect(headers[1].text()).toBe('statistic.count')
    expect(headers[2].text()).toBe('statistic.details')
  })

  it('displays total users correctly', () => {
    const row = wrapper.findAll('tbody > tr')[0]
    expect(row.findAll('td')[0].text()).toBe('statistic.totalUsers')
    expect(row.findAll('td')[1].text()).toBe('3113')
  })

  it('displays active users correctly', () => {
    const row = wrapper.findAll('tbody > tr')[1]
    expect(row.findAll('td')[0].text()).toBe('statistic.activeUsers')
    expect(row.findAll('td')[1].text()).toBe('1057')
  })

  it('displays deleted users correctly', () => {
    const row = wrapper.findAll('tbody > tr')[2]
    expect(row.findAll('td')[0].text()).toBe('statistic.deletedUsers')
    expect(row.findAll('td')[1].text()).toBe('35')
  })

  it('displays total Gradido created correctly', () => {
    const row = wrapper.findAll('tbody > tr')[3]
    expect(row.findAll('td')[0].text()).toBe('statistic.totalGradidoCreated')
    expect(row.findAll('td')[1].text()).toContain('4083774.05')
    expect(row.findAll('td')[2].text()).toBe('4083774.05000000000000000000')
  })

  it('displays total Gradido decayed correctly', () => {
    const row = wrapper.findAll('tbody > tr')[4]
    expect(row.findAll('td')[0].text()).toBe('statistic.totalGradidoDecayed')
    expect(row.findAll('td')[1].text()).toContain('-1062639.14')
    expect(row.findAll('td')[1].text()).toContain('GDD')
    expect(row.findAll('td')[2].text()).toBe('-1062639.13634129622923372197')
  })

  it('displays total Gradido available correctly', () => {
    const row = wrapper.findAll('tbody > tr')[5]
    expect(row.findAll('td')[0].text()).toBe('statistic.totalGradidoAvailable')
    expect(row.findAll('td')[1].text()).toContain('2513565.87')
    expect(row.findAll('td')[1].text()).toContain('GDD')
    expect(row.findAll('td')[2].text()).toBe('2513565.869444365732411569')
  })

  it('displays total Gradido unbooked decayed correctly', () => {
    const row = wrapper.findAll('tbody > tr')[6]
    expect(row.findAll('td')[0].text()).toBe('statistic.totalGradidoUnbookedDecayed')
    expect(row.findAll('td')[1].text()).toContain('-500474.67')
    expect(row.findAll('td')[1].text()).toContain('GDD')
    expect(row.findAll('td')[2].text()).toBe('-500474.6738366222166261272')
  })
})
