var child_process = require('child_process');
var configs = require('@r/build/lib/configs');
var webpack = require('webpack');

function generateReleaseVersion() {
  try {
    return child_process
      .execSync('git rev-parse --short HEAD')
      .toString().trim();
  } catch (e) {
    return Math.random().toString(36).slice(2);
  }
}

module.exports = function(isProduction) {
  var release = generateReleaseVersion();
  var clientConfig = configs.getClientConfig(isProduction, {
    sentryProject: 'mobile-web',
    sentryOrg: 'mobile-web',
    release: release,
  });
  var serverConfig = configs.getServerConfig(isProduction);

  // Copy static files for deploying / serving. We also use these in debug
  // to more closely mimic production.
  serverConfig.webpack.plugins = serverConfig.webpack.plugins.concat([
    {
      generator: 'copy-static-files',
      staticPaths: [
        ['assets/favicon', 'build/favicon'],
        ['assets/fonts', 'build/fonts'],
        ['assets/img', 'build/img'],
      ],
    },
    new webpack.DefinePlugin({
      '__GLOBALS__': {
        release: JSON.stringify(release),
      },
    }),
  ]);

  clientConfig.webpack.plugins = clientConfig.webpack.plugins.concat([
    {
      generator: 'set-node-env',
      'process.env': {
        BRANCH_KEY: JSON.stringify(process.env.BRANCH_KEY),
        GOOGLE_TAG_MANAGER_ID: JSON.stringify(process.env.GOOGLE_TAG_MANAGER_ID),
        MEDIA_DOMAIN: JSON.stringify(process.env.MEDIA_DOMAIN),
        REDDIT: JSON.stringify(process.env.REDDIT),
        STATIC_BASE: JSON.stringify(process.env.STATIC_BASE),
        STATS_URL: JSON.stringify(process.env.STATS_URL),
        TRACKER_CLIENT_NAME: JSON.stringify(process.env.TRACKER_CLIENT_NAME),
        TRACKER_ENDPOINT: JSON.stringify(process.env.TRACKER_ENDPOINT),
        TRACKER_KEY: JSON.stringify(process.env.TRACKER_KEY),
        TRACKER_SECRET: JSON.stringify(process.env.TRACKER_SECRET),
        SENTRY_ERROR_ENDPOINT: JSON.stringify(process.env.SENTRY_ERROR_ENDPOINT),
      },
      '__GLOBALS__': {
        release: JSON.stringify(release),
      },
    },
  ]);

  return [ clientConfig, serverConfig ];
};
