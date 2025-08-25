import { getFirstDayOfPreviousNMonth } from './utilities' // Adjust the path as necessary

describe('getFirstDayOfPreviousNMonth', () => {
  test('should calculate 3 months prior to March 31, 2024', () => {
    const startDate = new Date(2024, 2, 31) // March 31, 2024 (month is 0-indexed)
    const monthsAgo = 3
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2023, 11, 1)) // December 1, 2023
  })

  test('should handle end of month correctly, January 31, 2024', () => {
    const startDate = new Date(2024, 0, 31) // January 31, 2024
    const monthsAgo = 1
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2023, 11, 1)) // December 1, 2023
  })

  test('should handle leap year, March 1, 2024', () => {
    const startDate = new Date(2024, 2, 1) // March 1, 2024
    const monthsAgo = 1
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2024, 1, 1)) // February 1, 2024
  })

  test('should handle leap year, February 29, 2024', () => {
    const startDate = new Date(2024, 1, 29) // February 29, 2024 (leap year)
    const monthsAgo = 12
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2023, 1, 1)) // February 1, 2023
  })

  test('should handle end of year transition, January 1, 2024', () => {
    const startDate = new Date(2024, 0, 1) // January 1, 2024
    const monthsAgo = 1
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2023, 11, 1)) // December 1, 2023
  })

  test('should handle a large number of months ago, December 15, 2024', () => {
    const startDate = new Date(2024, 11, 15) // December 15, 2024
    const monthsAgo = 24
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2022, 11, 1)) // December 1, 2022
  })

  test('should handle start of month correctly, February 1, 2024', () => {
    const startDate = new Date(2024, 1, 1) // February 1, 2024
    const monthsAgo = 1
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2024, 0, 1)) // January 1, 2024
  })

  test('should handle middle of month correctly, February 14, 2024', () => {
    const startDate = new Date(2024, 1, 14) // February 14, 2024
    const monthsAgo = 3
    const result = getFirstDayOfPreviousNMonth(startDate, monthsAgo)
    expect(result).toEqual(new Date(2023, 10, 1)) // November 1, 2023
  })
})
