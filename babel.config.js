/* eslint global-require: off, import/no-extraneous-dependencies: off */

const developmentEnvironments = ['development', 'test'];

const developmentPlugins = [require('@babel/plugin-transform-runtime')];

const productionPlugins = [
  require('babel-plugin-dev-expression'),

  // babel-preset-react-optimize
  require('@babel/plugin-transform-react-constant-elements'),
  require('@babel/plugin-transform-react-inline-elements'),
  require('babel-plugin-transform-react-remove-prop-types'),
];

module.exports = (api) => {
  // @see - https://babeljs.io/docs/en/config-files#apicache

  const development = api.env(developmentEnvironments);

  return {
    presets: [
      // @babel/preset-env will automatically target our browserslist targets
      require('@babel/preset-env'),
      require('@babel/preset-typescript'),
      [require('@babel/preset-react'), { development }],
    ],
    plugins: [
      // stage - 0
      require('@babel/plugin-proposal-function-bind'),

      // stage - 1
      require('@babel/plugin-proposal-export-default-from'),
      require('@babel/plugin-proposal-logical-assignment-operators'),
      [require('@babel/plugin-proposal-optional-chaining'), { loose: false }],
      [require('@babel/plugin-proposal-pipeline-operator'), { proposal: 'minimal' }],
      [require('@babel/plugin-proposal-nullish-coalescing-operator'), { loose: false }],
      require('@babel/plugin-proposal-do-expressions'),

      // stage - 2
      [require('@babel/plugin-proposal-decorators'), { legacy: true }],
      require('@babel/plugin-proposal-function-sent'),
      require('@babel/plugin-proposal-export-namespace-from'),
      require('@babel/plugin-proposal-numeric-separator'),
      require('@babel/plugin-proposal-throw-expressions'),

      // stage - 3
      require('@babel/plugin-syntax-dynamic-import'),
      require('@babel/plugin-syntax-import-meta'),

      // in the original implementation, following plugin had been registered with loose: true
      // But in order to turn off the warnings, that option was removed
      [require('@babel/plugin-proposal-class-properties')],

      require('@babel/plugin-proposal-json-strings'),

      ...(development ? developmentPlugins : productionPlugins),
    ],
  };
};
