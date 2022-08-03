import { defineConfig } from "cypress";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import browserify from "@badeball/cypress-cucumber-preprocessor/browserify";

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    browserify(config, {
      typescript: require.resolve("typescript"),
    })
  );

  on('after:run', (results) => {
    if (results) {
      // results will be undefined in interactive mode
      console.log(results.status)
    }
  });

  return config;
}

export default defineConfig({
  e2e: {
    specPattern: "**/*.feature",
    excludeSpecPattern: "*.js",
    baseUrl: 'http://localhost:3000',
    chromeWebSecurity: false,
    supportFile: false,
    viewportHeight: 720,
    viewportWidth: 1280,
    retries: {
      runMode: 2,
      openMode: 0
    },
    setupNodeEvents
  }
})
