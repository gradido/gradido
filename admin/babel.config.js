module.exports = function (api) {
  api.cache(true)

  const presets = ['@babel/preset-env']
  const plugins = []

  if (import.meta.env.NODE_ENV === 'test') {
    plugins.push('transform-require-context')
  }

  return {
    presets,
    plugins,
  }
}
