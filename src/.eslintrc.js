module.exports = {
  rules: {
    '@typescript-eslint/lines-between-class-members': [
      'error',
      'always',
      {
        exceptAfterSingleLine: true,
      },
    ],
    'arrow-parens': [2, 'as-needed', {
      requireForBlockBody: true,
    }],
    'class-methods-use-this': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'max-len': ['error', 200],
    'max-classes-per-file': 'off',
    'react/jsx-tag-spacing': [
      'error',
      {
        closingSlash: 'never',
        beforeSelfClosing: 'never',
        afterOpening: 'never',
        beforeClosing: 'never',
      },
    ],
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'react/prop-types': 'off',
  },
};
