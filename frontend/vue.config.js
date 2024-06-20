const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const StatsPlugin = require('stats-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CONFIG = require('./src/config')

// vue.config.js
module.exports = {
  chainWebpack: (config) => {
    config.resolve.alias.set('vue', '@vue/compat')

    config.module
      .rule('vue')
      .use('vue-loader')
      .tap((options) => {
        return {
          ...options,
          compilerOptions: {
            compatConfig: {
              MODE: 2
            }
          }
        }
      })

    // Remove existing HtmlWebpackPlugin
    config.plugins.delete('html')

    // Add a new HtmlWebpackPlugin with the desired configuration
    config.plugin('html').use(require('html-webpack-plugin'), [{
      template: 'public/index.html',
      meta: {
        title_de: CONFIG.META_TITLE_DE,
        title_en: CONFIG.META_TITLE_EN,
        description_de: CONFIG.META_DESCRIPTION_DE,
        description_en: CONFIG.META_DESCRIPTION_EN,
        keywords_de: CONFIG.META_KEYWORDS_DE,
        keywords_en: CONFIG.META_KEYWORDS_EN,
        author: CONFIG.META_AUTHOR,
        url: CONFIG.META_URL,
      },
    }])
  },
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
        '@': path.resolve(__dirname, 'src'),
        vue$: '@vue/compat',
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
  outputDir: path.resolve(__dirname, './build'),
}
