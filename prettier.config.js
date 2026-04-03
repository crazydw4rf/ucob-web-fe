const config = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: 120,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  overrides: [
    {
      files: '*.md',
      options: {
        tabWidth: 2,
      },
    },
  ],
};

module.exports = config;
