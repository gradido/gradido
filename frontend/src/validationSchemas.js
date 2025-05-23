import { string } from 'yup'

// TODO: only needed for grace period, before all inputs updated for using veeValidate + yup
export const isLanguageKey = (str) =>
  str.match(/^(?!\.)[a-z][a-zA-Z0-9-]*([.][a-z][a-zA-Z0-9-]*)*(?<!\.)$/)

export const translateYupErrorString = (error, t) => {
  const type = typeof error
  if (type === 'object' && error.key && typeof error.key === 'string') {
    return t(error.key, error.values)
  } else if (type === 'string' && error.length > 0 && isLanguageKey(error)) {
    return t(error)
  } else {
    return error
  }
}

export const memo = string()
  .required('contribution.yourActivity')
  .min(5, ({ min }) => ({ key: 'form.validation.memo.min', values: { min } }))
  .max(255, ({ max }) => ({ key: 'form.validation.memo.max', values: { max } }))
