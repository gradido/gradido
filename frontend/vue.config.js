const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')

process.env.VUE_APP_BUILD_COMMIT = process.env.BUILD_COMMIT

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
    plugins: [
      new Dotenv(),
      new webpack.DefinePlugin({
        // Those are Environment Variables transmitted via Docker
        // 'process.env.DOCKER_WORKDIR': JSON.stringify(process.env.DOCKER_WORKDIR),
        // 'process.env.BUILD_DATE': JSON.stringify(process.env.BUILD_DATE),
        // 'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION),
        'process.env.BUILD_COMMIT': JSON.stringify(process.env.BUILD_COMMIT),
        // 'process.env.PORT': JSON.stringify(process.env.PORT),
      }),
    ],
  },
  css: {
    // Enable CSS source maps.
    sourceMap: process.env.NODE_ENV !== 'production',
  },
  outputDir: path.resolve(__dirname, './dist'),
}
