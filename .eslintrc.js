module.exports = {
  extends: [
    'airbnb-typescript',
    'plugin:react-hooks/recommended',
  ],
  plugins: [
    'promise',
  ],
  settings: {
    'import/resolver': {
      // @see - https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./configs/webpack.config.eslint.js'),
      },
    },
  },
  rules: {
    'object-curly-spacing': ['error', 'never'],
    'max-len': ['error', 200],
    'arrow-parens': [2, 'as-needed', {
      requireForBlockBody: true,
    }],
    'react/jsx-props-no-spreading': ['error', {
      html: 'ignore',
    }],
  },
};
