import {object, string, date } from 'yup'

export const createContributionFormValidation = (t) => {
  return object({
    // The date field is required and needs to be a valid date
    // contribution date
    date: 
      date()
      .required(t('contribution.noDateSelected'))
      .min((new Date(new Date().setMonth(new Date().getMonth() - 1, 1))).toISOString().slice(0,10)) // min date is first day of last month
      .max(new Date().toISOString().slice(0,10))
      .default(''), // date cannot be in the future
    memo: string().required(t('')).min(5).max(255)
  })
}
