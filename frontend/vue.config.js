const path = require('path')
const dotenv = require('dotenv-webpack')

process.env.VUE_APP_BUILD_COMMIT = process.env.BUILD_COMMIT || '00000000'

// vue.config.js
module.exports = {
  devServer: {
    port: process.env.PORT || 3000,
  },
  pluginOptions: {
    i18n: {
      locale: 'de',
      fallbackLocale: 'de',
      localeDir: 'locales',
      enableInSFC: false,
    },
  },
  lintOnSave: true,
  publicPath: '/vue',
  configureWebpack: {
    // Set up all the aliases we use in our app.
    resolve: {
      alias: {
        assets: path.join(__dirname, 'src/assets'),
      },
    },
    // eslint-disable-next-line new-cap
    plugins: [new dotenv()],
  },
  css: {
    // Enable CSS source maps.
    sourceMap: process.env.NODE_ENV !== 'production',
  },
  outputDir: path.resolve(__dirname, './dist'),
}
