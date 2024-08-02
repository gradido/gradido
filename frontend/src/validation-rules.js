// import { configure, defineRule } from 'vee-validate'
// // eslint-disable-next-line camelcase
// import { email, min, max, is_not, required } from '@vee-validate/rules'
// import { checkUsername } from '@/graphql/queries'
// import { validate as validateUuid, version as versionUuid } from 'uuid'
// import * as yup from 'yup'
//
// // taken from vee-validate
// // eslint-disable-next-line no-useless-escape
// const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
//
// const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/
//
// export const loadAllRules = (i18nCallback, apollo) => {
//   console.log('loadAllRules')
//   console.log(i18nCallback)
//   configure({
//     defaultMessage: (field, values) => {
//       // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
//       values._field_ = i18nCallback.t(`fields.${field}`)
//       // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
//       return i18nCallback.t(`validations.messages.${values._rule_}`, values)
//     },
//     classes: {
//       valid: 'is-valid',
//       invalid: 'is-invalid',
//       dirty: ['is-dirty', 'is-dirty'], // multiple classes per flag!
//     },
//   })
//
//   defineRule('email', (value) => {
//     const isValid = email(value)
//     if (!isValid) {
//       return i18nCallback.t('validations.messages.email', value)
//     }
//     return true
//   })
//
//   defineRule('required', (value) => {
//     const valueExists = required(value)
//     if (!valueExists) {
//       return i18nCallback.t('validations.messages.required', value)
//     }
//     return true
//   })
//
//   defineRule('min', (value, limit) => {
//     return min(value, limit) ? true : i18nCallback.t('validations.messages.min', value)
//   })
//
//   defineRule('max', (value, limit) => {
//     return max(value, limit) ? true : i18nCallback.t('validations.messages.max', value)
//   })
//   //
//   // defineRule('gddSendAmount', {
//   //   validate(value, { min, max }) {
//   //     value = value.replace(',', '.')
//   //     return value.match(/^[0-9]+(\.[0-9]{0,2})?$/) && Number(value) >= min && Number(value) <= max
//   //   },
//   //   params: ['min', 'max'],
//   //   message: (_, values) => {
//   //     values.min = i18nCallback.n(values.min, 'ungroupedDecimal')
//   //     values.max = i18nCallback.n(values.max, 'ungroupedDecimal')
//   //     return i18nCallback.t('form.validation.gddSendAmount', values)
//   //   },
//   // })
//   //
//   // defineRule('gddCreationTime', {
//   //   validate(value, { min, max }) {
//   //     return value >= min && value <= max
//   //   },
//   //   params: ['min', 'max'],
//   //   message: (_, values) => {
//   //     // values.min = values.min
//   //     // values.max = values.max
//   //     return i18nCallback.t('form.validation.gddCreationTime', values)
//   //   },
//   // })
//   //
//   // // eslint-disable-next-line camelcase
//   // defineRule('is_not', {
//   //   // eslint-disable-next-line camelcase
//   //   ...is_not,
//   //   message: (_, values) => i18nCallback.t('form.validation.is-not', values),
//   // })
//   //
//   // // Password validation
//   //
//   defineRule('containsLowercaseCharacter', (value) => {
//     const valid = !!value.match(/[a-z]+/)
//     if (!valid) {
//       return i18nCallback.t('site.signup.lowercase', { value })
//     }
//     return true
//   })
//
//   defineRule('containsUppercaseCharacter', (value) => {
//     const isValid = !!value.match(/[A-Z]+/)
//     if (!isValid) {
//       i18nCallback.t('site.signup.uppercase', { value })
//     }
//   })
//
//   // defineRule('containsNumericCharacter', {
//   //   validate(value) {
//   //     return !!value.match(/[0-9]+/)
//   //   },
//   //   message: (_, values) => i18nCallback.t('site.signup.one_number', values),
//   // })
//   //
//   // defineRule('atLeastEightCharacters', {
//   //   validate(value) {
//   //     return !!value.match(/.{8,}/)
//   //   },
//   //   message: (_, values) => i18nCallback.t('site.signup.minimum', values),
//   // })
//   //
//   // defineRule('atLeastOneSpecialCharater', {
//   //   validate(value) {
//   //     return !!value.match(/[^a-zA-Z0-9 \t\n\r]/)
//   //   },
//   //   message: (_, values) => i18nCallback.t('site.signup.special-char', values),
//   // })
//   //
//   // defineRule('noWhitespaceCharacters', {
//   //   validate(value) {
//   //     return !value.match(/[ \t\n\r]+/)
//   //   },
//   //   message: (_, values) => i18nCallback.t('site.signup.no-whitespace', values),
//   // })
//   //
//   // defineRule('samePassword', {
//   //   validate(value, [pwd]) {
//   //     return value === pwd
//   //   },
//   //   message: (_, values) => i18nCallback.t('site.signup.dont_match', values),
//   // })
//   //
//   // defineRule('usernameAllowedChars', {
//   //   validate(value) {
//   //     return !!value.match(/^[a-zA-Z0-9_-]+$/)
//   //   },
//   //   message: (_, values) => i18nCallback.t('form.validation.username-allowed-chars', values),
//   // })
//   //
//   // defineRule('usernameHyphens', {
//   //   validate(value) {
//   //     return !!value.match(/^[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/)
//   //   },
//   //   message: (_, values) => i18nCallback.t('form.validation.username-hyphens', values),
//   // })
//   //
//   // defineRule('usernameUnique', {
//   //   validate(value) {
//   //     if (!value.match(USERNAME_REGEX)) return true
//   //     return apollo
//   //       .query({
//   //         query: checkUsername,
//   //         variables: { username: value },
//   //       })
//   //       .then(({ data }) => {
//   //         return {
//   //           valid: data.checkUsername,
//   //         }
//   //       })
//   //   },
//   //   message: (_, values) => i18nCallback.t('form.validation.username-unique', values),
//   // })
//   //
//   // defineRule('validIdentifier', {
//   //   validate(value) {
//   //     const isEmail = !!EMAIL_REGEX.test(value)
//   //     const isUsername = !!value.match(USERNAME_REGEX)
//   //     const isGradidoId = validateUuid(value) && versionUuid(value) === 4
//   //     return isEmail || isUsername || isGradidoId
//   //   },
//   //   message: (_, values) => i18nCallback.t('form.validation.valid-identifier', values),
//   // })
// }

import { configure, defineRule } from 'vee-validate'
import { required, email, min, max } from '@vee-validate/rules'
import { checkUsername } from '@/graphql/queries'
import { validate as validateUuid, version as versionUuid } from 'uuid'
import { localize } from '@vee-validate/i18n'
import en from '@vee-validate/i18n/dist/locale/en.json'
import de from '@vee-validate/i18n/dist/locale/de.json'
import es from '@vee-validate/i18n/dist/locale/es.json'
import fr from '@vee-validate/i18n/dist/locale/fr.json'
import nl from '@vee-validate/i18n/dist/locale/nl.json'
import tr from '@vee-validate/i18n/dist/locale/tr.json'

// Email and username regex patterns remain the same
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

export const loadAllRules = (i18nCallback, apollo) => {
  configure({
    generateMessage: localize({
      en,
      de,
      es,
      fr,
      nl,
      tr,
    }),
    validateOnBlur: true,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
  })

  // Define built-in rules
  defineRule('required', required)
  defineRule('email', email)
  defineRule('min', min)
  defineRule('max', max)

  // ------ Custom rules ------
  defineRule('gddSendAmount', (value, { min, max }) => {
    value = value.replace(',', '.')
    return value.match(/^[0-9]+(\.[0-9]{0,2})?$/) && Number(value) >= min && Number(value) <= max
      ? true
      : i18nCallback.t('form.validation.gddSendAmount', {
          min: i18nCallback.n(min, 'ungroupedDecimal'),
          max: i18nCallback.n(max, 'ungroupedDecimal'),
        })
  })

  defineRule('gddCreationTime', (value, { min, max }) => {
    return value >= min && value <= max
      ? true
      : i18nCallback.t('form.validation.gddCreationTime', { min, max })
  })

  defineRule('is_not', (value, [otherValue]) => {
    return value !== otherValue
      ? true
      : i18nCallback.t('form.validation.is-not', { other: otherValue })
  })

  defineRule('containsLowercaseCharacter', (value) => {
    return !!value.match(/[a-z]+/) || i18nCallback.t('site.signup.lowercase')
  })

  defineRule('containsUppercaseCharacter', (value) => {
    return !!value.match(/[A-Z]+/) || i18nCallback.t('site.signup.uppercase')
  })

  defineRule('containsNumericCharacter', (value) => {
    return !!value.match(/[0-9]+/) || i18nCallback.t('site.signup.one_number')
  })

  defineRule('atLeastEightCharacters', (value) => {
    return !!value.match(/.{8,}/) || i18nCallback.t('site.signup.minimum')
  })

  defineRule('atLeastOneSpecialCharater', (value) => {
    return !!value.match(/[^a-zA-Z0-9 \t\n\r]/) || i18nCallback.t('site.signup.special-char')
  })

  defineRule('noWhitespaceCharacters', (value) => {
    return !value.match(/[ \t\n\r]+/) || i18nCallback.t('site.signup.no-whitespace')
  })

  defineRule('samePassword', (value, [pwd]) => {
    return value === pwd || i18nCallback.t('site.signup.dont_match')
  })

  defineRule('usernameAllowedChars', (value) => {
    return (
      !!value.match(/^[a-zA-Z0-9_-]+$/) || i18nCallback.t('form.validation.username-allowed-chars')
    )
  })

  defineRule('usernameHyphens', (value) => {
    return (
      !!value.match(/^[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/) ||
      i18nCallback.t('form.validation.username-hyphens')
    )
  })

  defineRule('usernameUnique', async (value) => {
    if (!value.match(USERNAME_REGEX)) return true
    const { data } = await apollo.query({
      query: checkUsername,
      variables: { username: value },
    })
    return data.checkUsername || i18nCallback.t('form.validation.username-unique')
  })

  defineRule('validIdentifier', (value) => {
    const isEmail = !!EMAIL_REGEX.test(value)
    const isUsername = !!value.match(USERNAME_REGEX)
    const isGradidoId = validateUuid(value) && versionUuid(value) === 4
    return (
      isEmail || isUsername || isGradidoId || i18nCallback.t('form.validation.valid-identifier')
    )
  })
}
