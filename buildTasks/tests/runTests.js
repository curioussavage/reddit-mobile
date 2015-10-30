var exec = require('child_process');


module.exports = function buildJS(gulp, options) {
  gulp.task('run-tests', function(done) {
    startTests(options, true, done);
  });
}

function startTests(options, singleRun, done) {
    var child;
    var fork = require('child_process').fork;
    var karma = require('karma').server;
    var excludeFiles = [];
    var serverSpecs = config.serverIntegrationSpecs;

    if (options.runIntegrationTests) {
        console.log('Starting server');
        var savedEnv = process.env;
        savedEnv.NODE_ENV = 'dev';
        savedEnv.PORT = 8888;
        child = fork(config.nodeServer);
    } else {
        if (serverSpecs && serverSpecs.length) {
            excludeFiles = serverSpecs;
        }
    }

    karma.start({
        configFile: __dirname + '/karma.conf.js',
        exclude: excludeFiles,
        singleRun: !!singleRun
    }, karmaCompleted);

    function karmaCompleted(karmaResult) {
        console.log('Karma completed!');
        if (child) {
            console.log('Shutting down the child process');
            child.kill();
        }
        if (karmaResult === 1) {
            done('karma: tests failed with code ' + karmaResult);
        } else {
            done();
        }
    }
}
  
