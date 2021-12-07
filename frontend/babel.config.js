module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    'transform-require-context',
    [
      'component',
      {
        styleLibraryName: 'theme-chalk',
      },
    ],
  ],
}
