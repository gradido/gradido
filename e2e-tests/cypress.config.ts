import { defineConfig } from 'cypress'
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor'
import browserify from '@badeball/cypress-cucumber-preprocessor/browserify'

let emailLink: string

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Promise<Cypress.PluginConfigOptions> {
  await addCucumberPreprocessorPlugin(on, config)

  on(
    'file:preprocessor',
    browserify(config, {
      typescript: require.resolve('typescript'),
    }),
  )

  on('task', {
    setEmailLink: (link: string) => {
      return (emailLink = link)
    },
    getEmailLink: () => {
      return emailLink
    },
  })

  return config
}

export default defineConfig({
  e2e: {
    specPattern: '**/*.feature',
    excludeSpecPattern: '*.js',
    baseUrl: 'http://127.0.0.1:3000',
    chromeWebSecurity: false,
    defaultCommandTimeout: 50000,
    pageLoadTimeout: 32000,
    supportFile: 'cypress/support/index.ts',
    viewportHeight: 720,
    viewportWidth: 1280,
    video: true,
    retries: 0,
    env: {
      backendURL: 'http://127.0.0.1:4000',
      mailserverURL: 'http://127.0.0.1:1080',
      loginQuery: `mutation ($email: String!, $password: String!, $publisherId: Int) {
        login(email: $email, password: $password, publisherId: $publisherId) {
          id
          firstName
          lastName
          language
          klickTipp {
            newsletterState
            __typename
          }
          hasElopage
          publisherId
          roles
          hideAmountGDD
          hideAmountGDT
          __typename
        }
      }`,
    },
    setupNodeEvents,
  },
})
