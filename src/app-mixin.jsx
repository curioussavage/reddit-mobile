import React from 'react';

import randomBySeed from './lib/randomBySeed';

// The base routes
import redirects from './redirects';

// Import the api instance; we're going to share an instance between the
// plugins.
import { v1 as V1Api } from 'snoode';

import BodyLayout from './views/layouts/BodyLayout';
import ErrorPage from './views/pages/error';
import Loading from './views/components/Loading';

import errorLog from './lib/errorLog';
import constants from './constants';

function logError(err, ctx, config) {
  var userAgent;
  var url;
  var line;

  if (err.stack) {
    url = err.stack.split('\n')[1];
  }

  if (ctx && ctx.env === 'SERVER' || process) {
    userAgent = 'SERVER';

    if (ctx && ctx.headers && ctx.headers['user-agent']) {
      userAgent += '-' + ctx.headers['user-agent'];
    }
  } else if (ctx && ctx.headers) {
    userAgent = ctx.headers['user-agent'];
  }

  errorLog({
    line,
    url,
    userAgent,
    error: err,
    message: err.message,
    requestUrl: ctx ? ctx.path : null,
  }, {
    hivemind: config.statsURL,
  }, {
    level: config.debugLevel || 'error',
  });
}

const errorMsgMap = {
  '404': 'Sorry, that page doesn\'t seem to exist.',
  '403': 'Sorry, you don\'t have access to this.',
  '503': 'Sorry, we are having trouble communicating with reddit\'s servers.',
  'default': 'Oops, looks like something went wrong.',
};


function mixin (App) {
  class MixedInApp extends App {
    constructor (config={}) {
      super(config);

      let app = this;
      // Set up two APIs (until we get non-authed oauth working).
      this.api = new V1Api({
        timeout: constants.DEFAULT_API_TIMEOUT,
        defaultHeaders: config.apiHeaders,
        debugLevel: config.debugLevel,
        log: app.logRequests.bind(app),
      });

      this.randomBySeed = randomBySeed(config.seed);

      redirects(this);
    }

    logRequests () {
      this.emit('log:request', ...arguments);
    }

    error (e, ctx, app, options={}) {
      // API error
      if (e.status) {
        // Don't redirect if abort === false
        if (!ctx.token && e.status === 403 && options.redirect !== false) {
          // Missing authorization
          return ctx.redirect(app.config.loginPath);
        }
      }

      if (!e.status || (e.status !== 429 && e.status !== 504)) {
        logError(e, ctx, app.config);
      }

      if (options.replaceBody !== false) {
        ctx.body = this.errorPage(ctx, e.status);
      }
    }

    safeStringify (obj) {
      return JSON.stringify(obj)
        .replace(/&/g, '\\u0026')
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E');
    }

    errorPage(ctx, statusCode) {
      var statusMsg = errorMsgMap[statusCode] || errorMsgMap['default'];

      if (!isNaN(parseInt(statusCode))) {
        ctx.status = parseInt(statusCode);
      } else {
        ctx.status = 503;
      }

      Object.assign({}, ctx.props || {}, {
        title: statusMsg,
        status: ctx.status,
        originalUrl: ctx.originalUrl || '/',
      });

      return function(props) {
        return (
          <BodyLayout {...props} key='error'>
            <ErrorPage {...props}/>
          </BodyLayout>
        );
      };
    }

    loadingpage () {
      return (
        <Loading />
      );
    }
  }

  return MixedInApp;
}

export default mixin;
