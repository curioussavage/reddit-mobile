'use strict';

require('babel/register')({
  ignore: false,
  only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
  extensions: ['.js', '.es6.js', '.jsx' ],
  sourceMap: true,
});

var glob = require('glob');
var gulp = require('gulp');
var sequence = require('gulp-sequence').use(gulp);


// Check node version
require('./version');

var options = {
  debug: true,
  watch: false,
  paths: {
    build: './build',
    js: 'js',
    css: 'css',
  },
};

gulp.task('load-tasks', function() {
  glob.sync('./buildTasks/*.js').forEach(function(file) {
    try {
      var task = require(file);
      console.log(`loading task: ${file}`);
      task(gulp, options);
    } catch (e) {
      console.log(`unable to require task: ${file} \n\n ${e}`);
    }
  });
});

gulp.task('set-watch', function() {
  options.watch = true;
});

gulp.task('set-prod', function() {
  options.debug = false;
});

gulp.task('load-prod', sequence('set-prod', 'load-tasks'));
gulp.task('load-dev', sequence('load-tasks'));
gulp.task('load-watch', sequence('set-watch', 'load-tasks', 'watcher'));
gulp.task('build', sequence('clean', 'assets', ['js', 'less']));

gulp.task('default', sequence('load-prod', 'build'));
gulp.task('dev', sequence('load-dev', 'build'));
gulp.task('watch', sequence('load-watch', 'build'));
gulp.task('icon-fonts', sequence('set-prod', 'load-tasks', 'icons'));

// gulp seems to hang after finishing in some environments
gulp.on('stop', function() {
  if (!options.watch) {
    process.nextTick(function() {
      process.exit(0);
    });
  }
});
