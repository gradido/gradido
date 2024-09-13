const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const StatsPlugin = require('stats-webpack-plugin')
// const HtmlWebpackPlugin = require('vue-html-webpack-plugin')
const CONFIG = require('./src/config')

// vue.config.js
module.exports = {
  devServer: {
    port: CONFIG.PORT,
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
  publicPath: '/',
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
        // 'import.meta.env.DOCKER_WORKDIR': JSON.stringify(import.meta.env.DOCKER_WORKDIR),
        // 'import.meta.env.BUILD_DATE': JSON.stringify(import.meta.env.BUILD_DATE),
        // 'import.meta.env.BUILD_VERSION': JSON.stringify(import.meta.env.BUILD_VERSION),
        'import.meta.env.BUILD_COMMIT': JSON.stringify(CONFIG.BUILD_COMMIT),
        // 'import.meta.env.PORT': JSON.stringify(import.meta.env.PORT),
      }),
      // generate webpack stats to allow analysis of the bundlesize
      new StatsPlugin('webpack.stats.json'),
      // new HtmlWebpackPlugin({
      //   vue: true,
      //   template: 'public/index.html',
      //   meta: {
      //     title_de: CONFIG.META_TITLE_DE,
      //     title_en: CONFIG.META_TITLE_EN,
      //     description_de: CONFIG.META_DESCRIPTION_DE,
      //     description_en: CONFIG.META_DESCRIPTION_EN,
      //     keywords_de: CONFIG.META_KEYWORDS_DE,
      //     keywords_en: CONFIG.META_KEYWORDS_EN,
      //     author: CONFIG.META_AUTHOR,
      //     url: CONFIG.META_URL,
      //   },
      // }),
    ],
    infrastructureLogging: {
      level: 'warn', // 'none' | 'error' | 'warn' | 'info' | 'log' | 'verbose'
    },
  },
  css: {
    // Enable CSS source maps.
    sourceMap: CONFIG.NODE_ENV !== 'production',
  },
  outputDir: path.resolve(__dirname, './build'),
}
