import crypto from 'crypto';
import scmp from 'scmp';
import superagent from 'superagent';
import uuid from 'uuid';
import url from 'url';
import has from 'lodash/object/has';

import constants from '../constants';

const SCOPES = 'history,identity,mysubreddits,read,subscribe,vote,submit,' +
               'save,edit,account,creddits,flair,livemanage,modconfig,' +
               'modcontributors,modflair,modlog,modothers,modposts,modself,' +
               'modwiki,privatemessages,report,wikiedit,wikiread';

function nukeTokens(ctx) {
  ctx.cookies.set('token');
  ctx.cookies.set('tokenExpires');
  ctx.cookies.set('refreshToken');
}

// set up oauth routes
const oauthRoutes = function(app) {
  app.nukeTokens = nukeTokens;

  const router = app.router;

  const cookieOptions = {
    secure: app.getConfig('https'),
    secureProxy: app.getConfig('httpsProxy'),
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
  };

  function getPassthroughHeaders(ctx, app) {
    if (app.getConfig('apiPassThroughHeaders')) {
      return app.getConfig('apiPassThroughHeaders').reduce(function(headers, key) {
        if (ctx.headers[key]) {
          headers[key] = ctx.headers[key];
        }
        return headers;
      }, {});
    }

    return {};
  }

  function assignPassThroughHeaders(obj, ctx, app) {
    return Object.assign(obj, getPassthroughHeaders(ctx, app));
  }

  if (app.getConfig('cookieDomain')) {
    cookieOptions.domain = app.getConfig('cookieDomain');
  }

  const longCookieOptions = Object.assign({}, cookieOptions, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  function setTokenCookie(ctx, token) {
    ctx.cookies.set('token', token.token.access_token, longCookieOptions);
    ctx.cookies.set('tokenExpires', token.token.expires_at.toString(), longCookieOptions);

    if (token.token.refresh_token) {
      ctx.cookies.set('refreshToken', token.token.refresh_token, longCookieOptions);
    }
  }

  app.setTokenCookie = setTokenCookie;

  function hmac (key, data) {
    const secret = new Buffer(key, 'base64').toString();
    const algorithm = 'sha1';

    const hmac = crypto.createHmac(algorithm, secret);
    hmac.setEncoding('hex');
    hmac.write(data);
    hmac.end();

    return hmac.read();
  }

  function getToken (ctx, code, redirect) {
    return new Promise(function(resolve) {
      OAuth2.authCode.getToken({
        code,
        redirect_uri: redirect,
      }, function(err, result) {
        if (err) {
          return ctx.redirect('/');
        }

        resolve(result);
      });
    });
  }

  function refreshToken (ctx, rToken) {
    return new Promise(function(resolve, reject) {
      const endpoint = `${app.config.nonAuthAPIOrigin}/api/v1/access_token`;
      let b;

      if (app.config.oauth.secretClientId) {
        b = new Buffer(
          `${app.config.oauth.secretClientId}:${app.config.oauth.secretSecret}`
        );
      } else {
        b = new Buffer(
          `${app.config.oauth.clientId}:${app.config.oauth.secret}`
        );
      }

      const s = b.toString('base64');

      const basicAuth = `Basic ${s}`;

      const data = {
        grant_type: 'refresh_token',
        refresh_token: rToken,
      };

      const headers = {
        'User-Agent': ctx.headers['user-agent'],
        'Authorization': basicAuth,
      };

      assignPassThroughHeaders(headers, ctx, app);

      Object.assign(headers, app.config.apiHeaders || {});

      superagent
        .post(endpoint)
        .set(headers)
        .type('form')
        .send(data)
        .timeout(constants.DEFAULT_API_TIMEOUT)
        .end((err, res) => {
          if (err || !res.ok) {
            if (err.timeout) { err.status = 504; }
            return reject(err || res);
          }

          /* temporary while api returns a `200` with an error in body */
          if (res.body.error) {
            return reject(401);
          }

          const token = OAuth2.accessToken.create(res.body);
          return resolve(token);
        });
    });
  }

  app.refreshToken = refreshToken;

  function convertSession(ctx) {
    return new Promise(function(resolve, reject) {
      const endpoint = `${app.config.nonAuthAPIOrigin}/api/me.json`;

      const cookie = ctx.headers.cookie.replace(/__cf_mob_redir=1/, '__cf_mob_redir=0');

      const headers = {
        'User-Agent': ctx.headers['user-agent'],
        cookie,
        'accept-encoding': ctx.headers['accept-encoding'],
        'accept-language': ctx.headers['accept-language'],
      };

      assignPassThroughHeaders(headers, ctx, app);

      Object.assign(headers, app.config.apiHeaders || {});

      superagent
        .get(endpoint)
        .set(headers)
        .timeout(constants.DEFAULT_API_TIMEOUT)
        .end((err, res) => {
          if (err || !res.ok) {
            if (err.timeout) { err.status = 504; }
            return reject(err || res);
          }

          if (res.body.error || !res.body.data) {
            app.error('Invalid modhash', this, app, { redirect: false, replaceBody: false });
            return reject(401);
          }

          const modhash = res.body.data.modhash;
          const endpoint = `${app.config.nonAuthAPIOrigin}/api/v1/authorize`;

          const redirect_uri = `${app.config.origin}/oauth2/token`;

          let clientId;
          let clientSecret;

          if (app.config.oauth.secretClientId) {
            clientId = app.config.oauth.secretClientId;
            clientSecret = app.config.oauth.secretSecret;
          } else {
            clientId = app.config.oauth.clientId;
            clientSecret = app.config.oauth.secret;
          }


          const postParams = {
            client_id: clientId,
            redirect_uri,
            scope: SCOPES,
            state: modhash,
            duration: 'permanent',
            authorize: 'yes',
          };

          headers['x-modhash'] = modhash;

          superagent
            .post(endpoint)
            .set(headers)
            .type('form')
            .send(postParams)
            .redirects(0)
            .end((err, res) => {
              if (res.status !== 302) {
                return resolve(res.status || 500);
              }

              if (res.body.error) {
                return resolve(401);
              }

              const location = url.parse(res.headers.location, true);
              const code = location.query.code;

              const endpoint = `${app.config.nonAuthAPIOrigin}/api/v1/access_token`;

              const postData = {
                grant_type: 'authorization_code',
                code,
                redirect_uri,
              };

              const b = new Buffer(
                `${clientId}:${clientSecret}`
              );

              const s = b.toString('base64');
              const basicAuth = `Basic ${s}`;

              const headers = {
                'User-Agent': ctx.headers['user-agent'],
                'Authorization': basicAuth,
              };

              assignPassThroughHeaders(headers, ctx, app);

              Object.assign(headers, app.config.apiHeaders || {});

              superagent
                .post(endpoint)
                .set(headers)
                .send(postData)
                .type('form')
                .timeout(constants.DEFAULT_API_TIMEOUT)
                .end(function(err, res) {
                  if (err || !res.ok) {
                    if (err.timeout) { err.status = 504; }
                    reject(err);
                  }

                  const token = OAuth2.accessToken.create(res.body);
                  return resolve(token);
                });
            });
        });
    });
  }

  app.convertSession = convertSession;

  const OAuth2 = require('simple-oauth2')({
    clientID: app.config.oauth.clientId,
    clientSecret: app.config.oauth.secret,
    site: app.config.nonAuthAPIOrigin,
    authorizationPath: '/api/v1/authorize.compact',
    tokenPath: '/api/v1/access_token',
  });

  const redirect = `${app.config.origin}/oauth2/token`;

  router.get('/oauth2/login', function * () {
    const configOrigin = app.getConfig('origin');
    const origin = `${configOrigin}/`;

    // referer spelled wrong according to spec.
    const referer = this.get('Referer') || '/';
    const key = app.getConfig('keys')[0];
    const state = hmac(key, referer);
    let redirectURI = referer;

    if ((!this.get('Referer')) || (this.get('Referer') &&
         this.get('Referer').slice(0, origin.length) === origin)) {
      redirectURI = OAuth2.authCode.authorizeURL({
        redirect_uri: redirect,
        scope: SCOPES,
        state: `${state}|${referer}`,
        duration: 'permanent',
      });

      this.redirect(redirectURI);
    } else {
      this.redirect('/403');
    }
  });

  router.get('/logout', function * () {
    nukeTokens(this);
    this.cookies.set('over18', false);
    this.cookies.set('reddit_session', undefined, {
      domain: '.reddit.com',
    });
    return this.redirect('/');
  });

  router.get('/oauth2/error', function *() {
    this.redirect('/');
  });

  router.get('/oauth2/refresh', function * () {
    const rToken = this.cookies.get('refreshToken');

    if (!this.cookies.get('token')) {
      this.body = undefined;
      return;
    }

    try {
      const result = yield refreshToken(this, rToken);
      setTokenCookie(this, result);

      this.body = {
        token: result.token.access_token,
        tokenExpires: result.token.expires_at.toString(),
      };
    } catch (e) {
      nukeTokens(this);
    }
  });

  router.get('/oauth2/token', function * () {
    const { code, error }= this.query;

    if (error) {
      return this.redirect(`/oauth2/error?message=${error}`);
    }

    const [state, referer] = this.query.state.split('|');
    const key = app.getConfig('keys')[0];

    if (!scmp(state, hmac(key, referer))) {
      return this.redirect('/403');
    }

    const result = yield getToken(this, code, redirect);

    const token = OAuth2.accessToken.create(result);

    setTokenCookie(this, token);

    this.redirect(referer || '/');
  });

  function login(username, password, ctx) {
    const id = uuid.v4();
    const endpoint = `${app.config.nonAuthAPIOrigin}/api/fp/1/auth/access_token`;

    const b = new Buffer(
      `${app.config.oauth.secretClientId}:${app.config.oauth.secretSecret}`
    );

    const s = b.toString('base64');

    const basicAuth = `Basic ${s}`;

    const data = {
      grant_type: 'password',
      username,
      password,
      device_id: id,
      duration: 'permanent',
    };

    return new Promise(function(resolve, reject) {
      const headers = {
        'User-Agent': ctx.headers['user-agent'],
        'Authorization': basicAuth,
      };

      assignPassThroughHeaders(headers, ctx, app);

      Object.assign(headers, app.config.apiHeaders || {});

      superagent
        .post(endpoint)
        .set(headers)
        .type('form')
        .send(data)
        .timeout(constants.DEFAULT_API_TIMEOUT)
        .end((err, res = {}) => {
          const obj = {};

          if (err || !res.ok) {
            obj.status = err.timeout ? 504 : res.status || 500;
            obj.errorType = obj.status === 400 ? 'WRONG_PASSWORD' : obj.status;
          }

          /* temporary while api returns a `200` with an error in body */
          if (has(res, 'body.json.errors.0')) {
            const errorTuple = res.body.json.errors[0];
            obj.errorType = errorTuple[0];
            obj.message = errorTuple[1];
            obj.status = 400;
          }

          if (!obj.status) {
            obj.status = 200;
            obj.token = OAuth2.accessToken.create(res.body);
            setTokenCookie(ctx, obj.token);
          }

          if (obj.status !== 200) {
            reject(obj);
          }

          resolve(obj);
        });
    });
  }

  async function getLoginRedirectOrRes(username, passwd, ctx) {
    try {
      const result = await login(username, passwd, ctx);
      const dest = ctx.body.originalUrl || '';

      if (result.status === 200) {
        if (ctx.isAjax) {
          ctx.body = { token: result.token };
          return;
        }

        if (dest) {
          return `${app.config.origin}${dest}`;
        }
        return '/';
      }
    } catch (e) {
      if (ctx.isAjax) {
        ctx.status = e.status;
        ctx.body = {
          error: e.errorType,
        };

        if (e.message) {
          ctx.body.message = e.message;
        }

        return;
      }

      const message = e.message ? `&message=${e.message}` : '';
      return `/login?error=${e.errorType}${message}${ctx.queryPath}`;
    }
  }

  function handleRegisterResponse(resolve, reject, data, ctx) {
    return async function (err, res = {}) {
      const obj = {};
      if (err || !res.ok) {
        obj.status = err.timeout ? 504 : res.status || 500;
        obj.errorType = obj.status;
      }

      /* temporary while api returns a `200` with an error in body */
      if (has(res, 'body.json.errors.0')) {
        const errorTuple = res.body.json.errors[0];
        obj.errorType = errorTuple[0];
        obj.message = errorTuple[1];
        obj.status = 400;
      }

      if (obj.errorType) {
        if (ctx.isAjax) {
          ctx.status = obj.status;
          ctx.body = {
            error: obj.errorType,
          };

          if (obj.message) {
            ctx.body.message = obj.message;
          }
          resolve();
        }

        const message = obj.message ? `&message=${obj.message}` : '';
        return reject(`/login?error=${obj.errorType}${message}${ctx.queryPath}`);
      }

      const redirectURIOrRes = await getLoginRedirectOrRes(data.user, data.passwd, ctx);
      resolve(redirectURIOrRes);
    };
  }

  /*
   * Only works with specific clients with specific trusted client IDs
   * (`mobile_auth_allowed_clients` in reddit config.) If you aren't that,
   * set the LOGIN_PATH env variable to nothing or '/oauth2/login' (default).
   */
  router.post('/login', function * () {
    const { username, password } = this.body;

    this.queryPath = getRedirectQueryParams(this);
    this.isAjax = this.req.headers['content-type'].includes('application/json');

    const urlOrRes = yield getLoginRedirectOrRes(username, password, this);

    return redirectOrReturn(this, urlOrRes);
  });

  function getRedirectQueryParams(ctx) {
    const { originalUrl, username } = ctx.body;
    const originalPath = originalUrl ? `&originalUrl=${originalUrl}` : '';
    const userPath = `&username=${username}`;

    return originalPath + userPath;
  }

  function redirectOrReturn(ctx, uri) {
    if (ctx.isAjax) { return; }

    ctx.redirect(uri);
  }

  router.post('/register', function * () {
    const origin = app.getConfig('nonAuthAPIOrigin');
    const endpoint = `${origin}/api/register`;
    const { password, username, email, newsletter } = this.body;

    this.isAjax = this.req.headers['content-type'].includes('application/json');

    this.queryPath = getRedirectQueryParams(this);

    const data = {
      user: username,
      passwd: password,
      passwd2: password,
      api_type: 'json',
    };

    if (email) {
      data.email = email;
    }

    if (newsletter) {
      data.newsletter_subscribe = true;

      if (!email) {
        if (this.isAjax) {
          this.body = { error: 'NEWSLETTER_NO_EMAIL'};
          this.status = 400;
          return;
        }
        return this.redirect(`/register?error=NEWSLETTER_NO_EMAIL${this.queryPath}`);
      }
    }

    try {
      const URI = yield new Promise((resolve, reject) => {
        const headers = Object.assign({
          'User-Agent': this.headers['user-agent'],
        }, app.config.apiHeaders || {});

        const b = new Buffer(
          `${app.config.oauth.secretClientId}:${app.config.oauth.secretSecret}`
        );

        const s = b.toString('base64');

        const basicAuth = `Basic ${s}`;

        headers.Authorization = basicAuth;

        assignPassThroughHeaders(headers, this, app);

        superagent
          .post(endpoint)
          .set(headers)
          .type('form')
          .send(data)
          .timeout(constants.DEFAULT_API_TIMEOUT)
          .end(handleRegisterResponse(resolve, reject, data, this));
      });

      return redirectOrReturn(this, URI);
    } catch (errorURI) {
      return redirectOrReturn(this, errorURI);
    }
  });
};

export default oauthRoutes;
