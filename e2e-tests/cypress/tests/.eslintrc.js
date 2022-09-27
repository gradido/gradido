module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["cypress", "prettier", "@typescript-eslint"],
  extends: [
    "standard",
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "no-console": ["error"],
    "no-debugger": "error",
    "prettier/prettier": [
      "error",
      {
        htmlWhitespaceSensitivity: "ignore",
      },
    ],
  },
};
