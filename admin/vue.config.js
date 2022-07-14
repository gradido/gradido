const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const StatsPlugin = require('stats-webpack-plugin')
const CONFIG = require('./src/config')

// vue.config.js
module.exports = {
  devServer: {
    port: CONFIG.PORT,
    // public: 'myapp.test:80',
    // public: 'myapp.test:8080',
    public: 'myapp.test:80/admin/',
    // public: 'myapp.test:8080/admin/',
    // webpack v5
    // client: {
    //   // webSocketURL: 'ws://0.0.0.0:8080/ws',
    //   webSocketURL: 'ws://0.0.0.0:80/ws',
    // },
    // port: 80,
    // host: 'localhost:80',
  },
  pluginOptions: {
    i18n: {
      locale: 'de',
      fallbackLocale: 'de',
      localeDir: 'locales',
      enableInSFC: false,
      enableLegacy: false,
    },
  },
  lintOnSave: true,
  publicPath: '/admin',
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
        'process.env.BUILD_COMMIT': JSON.stringify(CONFIG.BUILD_COMMIT),
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
    sourceMap: CONFIG.NODE_ENV !== 'production',
  },
  outputDir: path.resolve(__dirname, './dist'),
}
