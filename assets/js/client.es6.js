import 'babel/polyfill';

import '../../src/lib/dnt';

import errorLog from '../../src/lib/errorLog';


function onError(message, url, line, column) {
  errorLog({
    userAgent: window.navigator.userAgent,
    message,
    url,
    line,
    column,
    requestUrl: window.location.toString()
  }, {
    hivemind: window.bootstrap && window.bootstrap.config ? window.bootstrap.config.statsURL : undefined,
  });
}

// Register as early as possible
window.onerror = onError;

import React from 'react';
import ReactDOM from 'react-dom';
import throttle from 'lodash/function/throttle';
import forOwn from 'lodash/object/forOwn';

import ClientReactApp from 'horse-react/src/client';
import attachFastClick from 'fastclick';
import mixin from '../../src/app-mixin';
import querystring from 'querystring';
import superagent from 'superagent';

var App = mixin(ClientReactApp);

import defaultConfig from '../../src/config';
import constants from '../../src/constants';
import cookies from 'cookies-js';
import getTimes from '../../src/lib/timing';
import setLoggedOutCookies from '../../src/lib/loid';
import routes from '../../src/routes';

import trackingEvents from './trackingEvents';

import EUCountries from '../../src/EUCountries';

const isSafari = window.navigator.userAgent.indexOf('Safari') > -1;

let _lastWinWidth = 0;
let winWidth = window.innerWidth;

var beginRender = 0;

var $body = document.body || document.getElementsByTagName('body')[0];
var $head = document.head || document.getElementsByTagName('head')[0];

var config = defaultConfig();

function loadShim() {
  var shimScript = document.createElement('script');
  shimScript.type = 'text\/javascript';
  shimScript.onload = function() {
    initialize(false);
  }

  $head.appendChild(shimScript, document.currentScript);

  shimScript.src = window.bootstrap.config.assetPath + '/js/es5-shims.js';
}

function onLoad(fn) {
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    window.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

function redirect(status, path) {
  if ((typeof status === 'string') && !path) {
    path = status;
  }

  if (path.indexOf('/login') > -1 || path.indexOf('/register') > -1 ) {
    window.location = path;
  } else {
    this.redirect(path);
  }
}

// A few es5 sanity checks
if (!Object.create || !Array.prototype.map || !Object.freeze) {
  onLoad(loadShim);
} else {
  onLoad(function() {
    initialize(true);
  });
}

var referrer;

function modifyContext (ctx) {
  let baseCtx = this.getState('ctx');
  let app = this;

  const EUCookie = parseInt(cookies.get('EUCookieNotice')) || 0;
  const isEUCountry = EUCountries.indexOf(this.getState('country')) !== -1;

  ctx = Object.assign({}, baseCtx, ctx, {
    dataCache: app.getState('dataCache') || {},
    compact: (cookies.get('compact') || '').toString() === 'true',
    showOver18Interstitial: (cookies.get('over18') || 'false').toString() === 'false',
    showEUCookieMessage: (EUCookie < constants.EU_COOKIE_HIDE_AFTER_VIEWS) && isEUCountry,
    showGlobalMessage: cookies.get((app.config.globalMessage || {}).key) === undefined,
    redirect: redirect.bind(app),
    env: 'CLIENT',
    winWidth: window.innerWidth,
  });


  if (!ctx.token) {
    ctx.loid = cookies.get('loid');
    ctx.loidcreated = cookies.get('loidcreated');
  }

  ctx.headers.referer = referrer;

  return ctx;
}

function setTitle(props={}) {
  let $title = document.getElementsByTagName('title')[0];
  if (props.title) {
    if ($title.textContent) {
      $title.textContent = props.title;
    } else if ($title.innerText) {
      $title.innerText = props.title;
    }
  }
}

function refreshToken (app) {
  app.setState('refreshingToken', true);

  return new Promise(function(resolve, reject) {
    superagent
      .get('/oauth2/refresh')
      .end(function(err, res) {
        if (err) {
          reject(err);
        }

        var token = res.body;

        var now = new Date();
        var expires = new Date(token.tokenExpires);

        Object.assign(app.getState('ctx'), {
          token: token.token,
          tokenExpires: token.tokenExpires
        });

        app.setState('refreshingToken', false);
        app.emit('token:refresh', token);

        window.setTimeout(function() {
          refreshToken(app).then(function(){
            Object.assign(app.getState('ctx'), {
              token: token.token,
              tokenExpires: token.tokenExpires
            });

            app.setState('refreshingToken', false);
            app.emit('token:refresh', token);
          });
        }, (expires - now) * .9);
      });
  })
}

function findLinkParent(el) {
  if (el.parentNode) {
    if (el.parentNode.tagName === 'A') {
      return el.parentNode;
    }

    return findLinkParent(el.parentNode);
  }
}

function elementInDropdown(el) {
  if (el.classList && el.classList.contains(constants.DROPDOWN_CSS_CLASS)) {
    return true;
  } else if (el.parentNode) {
    return elementInDropdown(el.parentNode);
  } else {
    return false;
  }
}

function sendTimings() {
  // Send the timings during the next cycle.
  if (window.bootstrap.actionName) {
    if (Math.random() < .1) { // 10% of requests
      var timings = Object.assign({
        actionName: 'm.server.' + window.bootstrap.actionName,
      }, getTimes());

      timings.mountTiming = (Date.now() - beginRender) / 1000;

      superagent
        .post('/timings')
        .timeout(constants.DEFAULT_API_TIMEOUT)
        .send({
          rum: timings,
        })
        .end(function(){});
    }
  }
}

function render (app, ...args) {
  return new Promise(function(resolve, reject) {
    if (app.getState('refreshingToken')) {

      ReactDOM.render(app.loadingpage(), app.config.mountPoint);

      app.on('token:refresh', function() {
        app.render(...args).then(resolve, reject);
      });
    } else {
      app.render(...args).then(resolve, reject);
    }
  });
}

function initialize(bindLinks) {
  const dataCache = window.bootstrap.dataCache;
  var plugin;
  var p;

  referrer = document.referrer;

  config.mountPoint = document.getElementById('app-container');

  forOwn(config, function(val, key) {
    if (window.bootstrap.config[key]) {
      config[key] = window.bootstrap.config[key];
    }
  });

  config.seed = window.bootstrap.seed || Math.random();

  var app = new App(config);
  routes(app);

  app.setState('userSubscriptions', dataCache.userSubscriptions);

  if (dataCache.user) {
    app.setState('user', dataCache.user);
    app.setState('preferences', dataCache.preferences);

    cookies.set('over18', dataCache.preferences.body.over_18);
  }

  app.emitter.setMaxListeners(30);

  if (app.getState('token')) {
    var now = new Date();
    var expires = new Date(app.getState('tokenExpires'));

    var refreshMS = (expires - now);

    // refresh a little before it expires, to be safe
    refreshMS *= .90;

    // if it's within a minute, refresh now
    refreshMS = Math.max(refreshMS - (1000 * 60), 0);

    window.setTimeout(function() {
      refreshToken(app).then(function(){});
    }, refreshMS);
  } else if (!cookies.get('loid')) {
    setLoggedOutCookies(cookies, app);
  }

  app.router.get('/oauth2/login', function * () {
    window.location = '/oauth2/login';
  });

  // env comes from bootstrap from the server, update now that the client is loading
  app.state.ctx.env = 'CLIENT';
  modifyContext = modifyContext.bind(app);
  app.modifyContext = modifyContext;

  var history = window.history || window.location.history;
  app.pushState = (data, title, url) => {
    if (history) {
      history.pushState(data, title, url);
    }
  };

  app.redirect = function(url) {
    app.pushState(null, null, url);

    // Set to the browser's interpretation of the current name (to make
    // relative paths easier), and send in the old url.
    render(app, app.fullPathName(), false, modifyContext).then(function(props) {
      setTitle(props);
    });
  }

  app.forceRender = function (view, props) {
    ReactDOM.render(view(props), app.config.mountPoint);
  }

  var scrollCache = {};

  var initialUrl = app.fullPathName();

  function postRender(href) {
    return function(props) {
      if(scrollCache[href]) {
        $body.scrollTop = scrollCache[href];
      } else {
        $body.scrollTop = 0;
      }

      setTitle(props);

      if (!props.data.get('subreddit')) {
        setMetaColor(constants.DEFAULT_KEY_COLOR);
      }
    }
  }

  function logMissingHref($link) {
    const $linkClone = $link.cloneNode(true);
    const $tmpWrapper = document.createElement('div');
    $tmpWrapper.appendChild($linkClone);
    const linkStringified = $tmpWrapper.innerHTML;

    const error = {
      message: 'A tag missing HREF',
      linkStringified,
    };

    const options = {
      redirect: false,
      replaceBody: false,
    };

    app.error(error, app.getState('ctx'), app, options);
  }

  function attachEvents() {
    attachFastClick(document.body);

    if (history && bindLinks) {
      $body.addEventListener('click', function(e) {
        let $link = e.target;

        if ($link.tagName !== 'A') {
          $link = findLinkParent($link);

          if (!$link) {
            return;
          }
        }

        const href = $link.getAttribute('href');
        if (!href) {
          logMissingHref($link);
          return;
        }

        const currentUrl = app.fullPathName();

        // If it has a target=_blank, or an 'external' data attribute, or it's
        // an absolute url, let the browser route rather than forcing a capture.
        if (
          ($link.target === '_blank' || $link.dataset.noRoute === 'true') ||
          href.indexOf('//') > -1
        ) {
          return;
        }

        // If the href contains script ignore it
        if (/^javascript:/.test(href)) {
          return;
        }

        e.preventDefault();

        scrollCache[currentUrl] = window.scrollY;

        if (href.indexOf('#') === 0) {
          return;
        }

        initialUrl = href;

        // Update the referrer before navigation
        const a = document.createElement('a');
        a.href = currentUrl;
        referrer = a.href;

        app.pushState(null, null, href);

        // Set to the browser's interpretation of the current name (to make
        // relative paths easier), and send in the old url.
        render(app, app.fullPathName(), false, modifyContext).then(postRender(href));
      });

      window.addEventListener('popstate', function(e) {
        var href = app.fullPathName();
        scrollCache[initialUrl] = window.scrollY;

        render(app, href, false, modifyContext).then(postRender(href));

        initialUrl = href;
      });
    }
  }

  // Don't re-render tracking pixel on first load. App reads from state
  // (bootstrap) on first load, so override state, and then set the proper
  // config value after render.
  beginRender = Date.now();

  // If we're using an old render cache from a restore, nuke it
  if ((beginRender - window.bootstrap.render) > 1000 * 60 * 5) {
    app.setState('dataCache');
  }

  render(app, app.fullPathName(), true, modifyContext).then(function() {
    app.setState('dataCache');

    attachEvents();
    referrer = document.location.href;
    sendTimings();
  });

  app.on('route:desktop', function(route) {
    let options = {};

    let date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    options.expires = date;

    if (window.location.host.indexOf('localhost') === -1) {
      var domain = '.' + window.bootstrap.config.reddit.match(/https?:\/\/(.+)/)[1].split('.').splice(1,2).join('.');
      options.domain = domain;
    }

    cookies.set('__cf_mob_redir', '0', options);

    if (route.indexOf('?') === -1) {
      route += '?ref_source=mweb';
    } else {
      route += '&ref_source=mweb';
    }

    window.location = `https://www.reddit.com${route}`;
  });

  app.on(constants.COMPACT_TOGGLE, function(compact) {
    app.setState('compact', compact);
  });

  app.on(constants.TOGGLE_OVER_18, function(val) {
    cookies.set('over18', val);
  });

  app.on(constants.HIDE_GLOBAL_MESSAGE, function(message) {
    let options = {
      expires: new Date(message.expires),
    };
    cookies.set(message.key, 'globalMessageSeen', options);
  });

  const elementCanScroll = function elementCanScroll(el) {
    const top = el.scrollTop;

    if (top <= 0) {
      el.scrollTop = 1;
      return false;
    }

    const totalScroll = top + el.offsetHeight;
    if (totalScroll === el.scrollHeight) {
      el.scrollTop = top - 1;
      return false;
    }

    return true;
  };

  const stopScroll = throttle(function stopScroll(e) {
    let touchMoveAllowed = false;
    let target = e.target;

    while (target !== null) {
      if (target.classList && target.classList.contains(constants.OVERLAY_MENU_CSS_CLASS)) {
        if (elementCanScroll(target)) {
          touchMoveAllowed = true;
        }
        break;
      }

      target = target.parentNode;
    }

    if (!touchMoveAllowed) {
      e.preventDefault();
    }
  }, 50);

  app.on(constants.OVERLAY_MENU_OPEN, function(open) {
    if (!$body.classList) {
      return;
    }

    // Scrolling on Safari is weird, possibly iOS 9. Overflow hidden doesn't
    // prevent the page background from scrolling as you'd expect.
    // When we're on Safari we do a fancy check to stop touchmove events
    // from scrolling the background.
    // We don't use position: fixed becuase the repaint from changing position
    // is slow in safari. Plus there's extra bookkeeping for preserving the
    // scroll position.
    if (open) {
      if ($body.classList.contains(constants.OVERLAY_MENU_VISIBLE_CSS_CLASS)) {
        return;
      }

      $body.classList.add(constants.OVERLAY_MENU_VISIBLE_CSS_CLASS);
      if (isSafari) {
        $body.addEventListener('touchmove', stopScroll);
      }
    } else {
      $body.classList.remove(constants.OVERLAY_MENU_VISIBLE_CSS_CLASS);
      if (isSafari) {
        $body.removeEventListener('touchmove', stopScroll);
      }
    }
  });

  function closeDropdowns() {
    // close any opened dropdown by faking another dropdown opening
    app.emit(constants.DROPDOWN_OPEN);
  }

  window.addEventListener('click', function(e) {
    if (!elementInDropdown(e.target)) {
      closeDropdowns();
    }
  });

  window.addEventListener('scroll', throttle(function(e) {
      app.emit(constants.SCROLL);
    }.bind(app), 100));

  window.addEventListener('resize', throttle(function(e) {
    // Prevent resize from firing when chrome shows/hides nav bar
    if (winWidth !== _lastWinWidth) {
      _lastWinWidth = winWidth;
      app.emit(constants.RESIZE);
    }
  }.bind(app), 100));

  function setMetaColor (color) {
    const metas = Array.prototype.slice.call(document.getElementsByTagName('meta'));

    const tag = metas.find(function(m) {
      return m.getAttribute('name') === 'theme-color';
    });

    tag.content = color;
  }

  app.on(constants.SET_META_COLOR, setMetaColor);

  if (window.bootstrap.config.googleAnalyticsId) {
    trackingEvents(app);
  }
}

module.exports = initialize;
