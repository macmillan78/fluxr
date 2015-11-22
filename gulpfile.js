var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var devConfig = require('./webpack.config');
var distConfig = require('./webpack.dist.config');
var examplesConfig = require('./webpack.examples.config');
var KarmaServer = require('karma').Server;

function createWebpack(config, callback) {
  webpack(config, function(err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
    callback();
  });
}

gulp.task('build:dev', function (callback) {
  createWebpack(devConfig, callback);
});

gulp.task('build', function (callback) {
  createWebpack(distConfig, callback);
});

gulp.task('build:examples', function (callback) {
  createWebpack(examplesConfig, callback);
});

gulp.task('test', function (done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('test:server', function (done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('server', function (callback) {
  var compiler = webpack(config);

  new WebpackDevServer(compiler, {
    contentBase: 'web/'
  }).listen(8080, "localhost", function(err) {
      if(err) throw new gutil.PluginError("webpack-dev-server", err);
      // Server listening
      gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");

      // keep the server alive or continue?
      callback();
    });
});

