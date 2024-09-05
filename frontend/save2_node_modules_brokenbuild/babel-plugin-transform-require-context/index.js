'use strict';

const template  = require('@babel/template');

module.exports = ({types: t}) => {
  const contextTemplate = template.smart(
    `(function () {
      function req() {}
      req.keys = function () { return []; }
      req.resolve = function () {};
      return req;
    }())`);

  return {
    visitor: {
      MemberExpression(path) {
        const node = path.node;
        if (t.isCallExpression(path.parent) &&
          t.isIdentifier(node.object, { name: 'require' }) &&
          t.isIdentifier(node.property, { name: 'context' }) &&
          !path.scope.hasOwnBinding('require')) {
          path.parentPath.replaceWith(contextTemplate());
        }
      }
    }
  }
};