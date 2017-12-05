'use strict'

const webpack = require('webpack')

module.exports = {
  entry: {
    raven: './src/index.ts',
    source: './src/source.ts',
    transfer: './src/transfer.ts'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/lib',
    library: '[name]',
    libraryTarget: 'this'
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  module: {
    rules: [
      // All files with a '.ts' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.ts?$/, loader: 'es3ify-loader!awesome-typescript-loader' },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ],
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        properties: false
      },
      mangle: true,
      beautify: false,
      output: {
        quote_keys: true
      }
    })
  ]
}
