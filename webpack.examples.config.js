var path = require('path');
var node_modules_dir = path.resolve(__dirname, 'node_modules');

module.exports = {
  entry: __dirname + '/src/app.ts',

  output: {
    path: __dirname + '/web/js',
    publicPath: __dirname + '/web/js',
    filename: 'app.js',
    chunkFilename: "[id].[hash].bundle.js"
  },

  // Currently we need to add '.ts' to resolve.extensions array.
  resolve: {
    modulesDirectories: ['src', 'src/vendor', 'node_modules'],
    extensions: ['', '.js', '.webpack.js', '.web.js', '.ts', '.js']
  },

  // Source maps support (or 'inline-source-map' also works)
  devtool: 'source-map',

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