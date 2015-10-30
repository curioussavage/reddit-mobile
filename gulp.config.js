module.exports = function() {
  return {
    debug: true,
    watch: false,
    paths: {
      entryFile: './assets/js/client.es6.js',
      build: './build',
      js: 'js',
      css: 'css',
    },
    nodeServer: './src/server/app.js'
  };
}