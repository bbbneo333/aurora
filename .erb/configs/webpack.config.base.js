/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';

import packageJson from '../../package.json';
import { dependencies as externals } from '../../src/package.json';

const { execSync } = require('child_process');

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

export default {
  externals: [...Object.keys(externals || {})],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },
  output: {
    path: path.join(__dirname, '../../src'),
    // @see - https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
  },
  // determine the array of extensions that should be used to resolve modules.
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, '../../src'), 'node_modules'],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      APP_VERSION: packageJson.version,
      BUILD_VERSION: commitHash,
    }),
  ],
};
