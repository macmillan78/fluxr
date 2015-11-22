var path = require('path')
var node_modules_dir = path.resolve(__dirname, 'node_modules')

module.exports = {
  entry: __dirname + '/src/app.tsx',

  output: {
    path: __dirname + '/js',
    publicPath: __dirname + '/js',
    filename: 'app.js',
    chunkFilename: "[id].[hash].bundle.js"
  },

  // Currently we need to add '.ts' to resolve.extensions array.
  resolve: {
    modulesDirectories: ['src', 'node_modules', '../../src'],
    extensions: ['', '.js', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },

  // Source maps support (or 'inline-source-map' also works)
  devtool: 'source-map',

  // Add loader for .ts files.
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: [node_modules_dir]
      },
      {
        test: /\.jsx$/,
        loader: 'babel-loader'
      }
    ]
  }
};