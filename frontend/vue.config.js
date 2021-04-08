const path = require('path')
const dotenv = require('dotenv-webpack')
process.env.VUE_APP_VERSION = require('./package.json').version


function resolveSrc(_path) {
  return path.join(__dirname, _path)
}

let vue_path = process.env.VUE_PATH
if (vue_path == undefined) {
  vue_path = '/vue'
}

// vue.config.js
module.exports = {
  pluginOptions: {
    i18n: {
      locale: 'de',
      fallbackLocale: 'de',
      localeDir: 'locales',
      enableInSFC: false,
    },
  },
  lintOnSave: true,
  publicPath: vue_path + '/',
  configureWebpack: {
    // Set up all the aliases we use in our app.
    resolve: {
      alias: {
        assets: resolveSrc('src/assets'),
      },
    },
    plugins: [new dotenv()],
  },
  css: {
    // Enable CSS source maps.
    sourceMap: process.env.NODE_ENV !== 'production',
  },
  outputDir: path.resolve(__dirname, './dist' + vue_path),
}
