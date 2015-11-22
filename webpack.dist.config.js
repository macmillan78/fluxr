var path = require('path');
var webpack = require('webpack');
var node_modules_dir = path.resolve(__dirname, 'node_modules');

module.exports = {
  entry: __dirname + '/src/fluxr.ts',

  output: {
    path: __dirname + '/dist',
    publicPath: __dirname + '/dist',
    filename: 'fluxr.js',
    chunkFilename: "[id].[hash].bundle.js"
  },

  // Currently we need to add '.ts' to resolve.extensions array.
  resolve: {
    modulesDirectories: ['src', 'node_modules'],
    extensions: ['', '.ts']
  },

  // Source maps support (or 'inline-source-map' also works)
  devtool: 'source-map',

  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ],

  ts: {
    compilerOptions: {
      declaration: true
    }
  },

  // Add loader for .ts files.
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: [node_modules_dir]
      }
    ]
  }
};