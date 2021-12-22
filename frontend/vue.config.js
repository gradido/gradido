const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const StatsPlugin = require('stats-webpack-plugin')

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
      // .env and Environment Variables
      new Dotenv(),
      new webpack.DefinePlugin({
        // Those are Environment Variables transmitted via Docker and are only available when defined here aswell
        // 'process.env.DOCKER_WORKDIR': JSON.stringify(process.env.DOCKER_WORKDIR),
        // 'process.env.BUILD_DATE': JSON.stringify(process.env.BUILD_DATE),
        // 'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION),
        'process.env.BUILD_COMMIT': JSON.stringify(process.env.BUILD_COMMIT),
        // 'process.env.PORT': JSON.stringify(process.env.PORT),
      }),
      // generate webpack stats to allow analysis of the bundlesize
      new StatsPlugin('webpack.stats.json'),
    ],
    infrastructureLogging: {
      level: 'warn', // 'none' | 'error' | 'warn' | 'info' | 'log' | 'verbose'
    },
  },
  css: {
    // Enable CSS source maps.
    sourceMap: process.env.NODE_ENV !== 'production',
  },
  outputDir: path.resolve(__dirname, './dist'),
}
