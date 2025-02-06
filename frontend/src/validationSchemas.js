import { string } from 'yup'

// TODO: only needed for grace period, before all inputs updated for using veeValidate + yup
export const isLanguageKey = (str) => str.match(/^(?!\.)[a-z][a-zA-Z0-9]*([.][a-z][a-zA-Z0-9]*)*(?<!\.)$/)

export const memo = string()
  .required('contribution.yourActivity')
  .min(5, ({min}) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(255, ({max}) => ({ key: 'form.validation.memo.max', values: { max } }))

