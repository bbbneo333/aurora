module.exports = {
  rules: {
    '@typescript-eslint/object-curly-spacing': ['error', 'never'],
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
    'react/jsx-tag-spacing': [
      'error',
      {
        closingSlash: 'never',
        beforeSelfClosing: 'never',
        afterOpening: 'never',
        beforeClosing: 'never',
      },
    ],
    'react/jsx-props-no-spreading': ['error', {
      html: 'ignore',
    }],
    'react/require-default-props': 'off',
  },
};
