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
  js: {
    entryFile: './assets/js/client.es6.js',
  }
};

gulp.task('load-tasks', () => {
  glob.sync('./buildTasks/*.js').forEach((file) => {
    try {
      console.log(`loading task: ${file}`);
      var task = require(file);
      task(gulp, options);
    } catch (e) {
      console.log(`unable to require task: ${file} \n\n ${e}`);
    }
  });
});

gulp.task('set-watch', () => {
  options.watch = true;
});

gulp.task('set-prod', () => {
  options.debug = false;
});

gulp.task('set-tests', () => {
  options.paths.build = './test/build';
  options.js.entryFile = './test/index.js';
})

gulp.task('load-prod', sequence('set-prod', 'load-tasks'));
gulp.task('load-dev', sequence('load-tasks'));
gulp.task('load-watch', sequence('set-watch', 'load-tasks', 'watcher'));
gulp.task('build', sequence('clean', 'assets', ['js', 'less']));
gulp.task('load-test', sequence('set-tests', 'load-tasks'));
gulp.task('build-tests', sequence('js', 'test-html'));


gulp.task('default', sequence('load-prod', 'build'));
gulp.task('dev', sequence('load-dev', 'build'));
gulp.task('watch', sequence('load-watch', 'build'));
gulp.task('icon-fonts', sequence('set-prod', 'load-tasks', 'icons'));
gulp.task('test', sequence('load-test', 'build-tests'));

// gulp seems to hang after finishing in some environments
gulp.on('stop', function() {
  if (!options.watch) {
    process.nextTick(function() {
      process.exit(0);
    });
  }
});
