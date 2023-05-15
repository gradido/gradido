import { defineConfig } from 'cypress'
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor'
import browserify from '@badeball/cypress-cucumber-preprocessor/browserify'

let emailLink: string

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  await addCucumberPreprocessorPlugin(on, config)

  on(
    'file:preprocessor',
    browserify(config, {
      typescript: require.resolve('typescript'),
    })
  )

  on('task', {
    setEmailLink: (link: string) => {
      return (emailLink = link)
    },
    getEmailLink: () => {
      return emailLink
    },
  })

  on('after:run', (results) => {
    if (results) {
      // results will be undefined in interactive mode
      // eslint-disable-next-line no-console
      console.log(results.status)
    }
  })

  return config
}

export default defineConfig({
  e2e: {
    specPattern: '**/*.feature',
    excludeSpecPattern: '*.js',
    experimentalSessionAndOrigin: true,
    baseUrl: 'http://localhost:3000',
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    supportFile: 'cypress/support/index.ts',
    viewportHeight: 720,
    viewportWidth: 1280,
    video: false,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      backendURL: 'http://localhost:4000',
      mailserverURL: 'http://localhost:1080',
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
          isAdmin
          hideAmountGDD
          hideAmountGDT
          __typename
        }
      }`,
    },
    setupNodeEvents,
  },
})
