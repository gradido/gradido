# babel-plugin-transform-require-context

A [Babel](http://babeljs.io) plugin that transforms [webpack](https://webpack.js.org/)-specific `require.context()`
into dummy function calls so that the code can run safely outside of the webpack environment, e.g. in Node.
It doesn't perform any file lookup or dynamic require, but should not break the code otherwise.

## Installation

```sh
$ npm install babel-plugin-transform-require-context
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```javascript
{
  "plugins": ["transform-require-context"]
}
```

### Via CLI

```sh
$ babel --plugins transform-require-context script.js
```

### Via Node API

```javascript
require("@babel/core").transform("code", {
  plugins: ["transform-require-context"]
});
```