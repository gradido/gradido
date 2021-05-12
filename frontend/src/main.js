import Vue from 'vue'
import DashboardPlugin from './plugins/dashboard-plugin'
import App from './App.vue'
import i18n from './i18n.js'
import { configure, extend } from 'vee-validate'
// eslint-disable-next-line camelcase
import { required, email, min, between, double, is_not } from 'vee-validate/dist/rules'

// store
import { store } from './store/store'

// router setup
import router from './routes/router'

// plugin setup
Vue.use(DashboardPlugin)
Vue.config.productionTip = false

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !store.state.sessionId) {
    next({ path: '/login' })
  } else {
    next()
  }
})

configure({
  defaultMessage: (field, values) => {
    values._field_ = i18n.t(`fields.${field}`)
    return i18n.t(`validations.messages.${values._rule_}`, values)
  },
})

extend('email', {
  ...email,
  message: (_, values) => i18n.t('validations.messages.email', values),
})

extend('required', {
  ...required,
  message: (_, values) => i18n.t('validations.messages.required', values),
})

extend('min', {
  ...min,
  message: (_, values) => i18n.t('validations.messages.min', values),
})

extend('double', {
  ...double,
  message: (_, values) => i18n.t('form.validation.double', values),
})

extend('between', {
  ...between,
  message: (_, values) => i18n.t('validations.messages.between', values),
})

// eslint-disable-next-line camelcase
extend('is_not', {
  // eslint-disable-next-line camelcase
  ...is_not,
  message: (_, values) => i18n.t('form.validation.is-not', values),
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: (h) => h(App),
})
