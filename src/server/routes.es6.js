import superagent from 'superagent';
import crypto from 'crypto';
import constants from '../constants';

import { models } from 'snoode';
// set up server-only routes
let serverRoutes = function(app) {
  const router = app.router;

  router.get('/robots.txt', function * () {
    this.body = `
      # 80legs
      User-agent: 008
      Disallow: /

      User-Agent: bender
      Disallow: /my_shiny_metal_ass

      User-Agent: Gort
      Disallow: /earth

      User-Agent: *
      Disallow: /*/comments/*?*sort=
      Disallow: /r/*/comments/*/*/c*
      Disallow: /comments/*/*/c*
      Disallow: /*after=
      Disallow: /*before=
      Disallow: /login
      Disallow: /search
      Disallow: /r/*/search
      Disallow: /u/*
      Allow: /
    `;
  });

  router.post('/timings', function * () {
    const statsURL = app.config.statsURL;
    let timings = this.request.body.rum;

    if (!app.config.actionNameSecret) {
      console.log('returning early, no secret');
      return;
    }

    const secret = (new Buffer(app.config.actionNameSecret, 'base64')).toString();
    const algorithm = 'sha1';
    let hash;

    let hmac = crypto.createHmac(algorithm, secret);
    hmac.setEncoding('hex');
    hmac.write(timings.actionName);
    hmac.end();

    hash = hmac.read();

    timings.verification = hash;

    superagent
        .post(statsURL)
        .type('json')
        .send({ rum: timings })
        .timeout(constants.DEFAULT_API_TIMEOUT)
        .end(function() { });
  });

  // Server-side only!
  router.post('vote', '/vote/:id',
    function * () {
      const endpoints = {
        '1': 'comment',
        '3': 'listing',
      };

      let id = this.params.id;

      let vote = new models.Vote({
        direction: parseInt(this.query.direction),
        id,
      });

      if (vote.get('direction') !== undefined && vote.get('id')) {
        let options = app.api.buildOptions(props.apiOptions);
        options.model = vote;
        app.api.votes.post(options).then(function() { });
      }
    });

  router.post('/comment', function * () {
    var ctx = this;

    let comment = new models.Comment({
      thingId: ctx.body.thingId,
      text: ctx.body.text,
    });

    if (!this.token) {
      return this.redirect(this.headers.referer || '/');
    }

    let options = app.api.buildOptions(props.apiOptions);
    options.model = comment;

    app.api.comments.post(options).then(function() {
      this.redirect(this.headers.referer || '/');
    });
  });

  router.get('/routes', function* () {
    this.body = app.router.stack.routes
      .filter(function(r) {
        return (
          r.methods.indexOf('GET') > -1 && // only map GET requests
          r.path !== '*' // ignore the 404 catch-all route
        );
      })
      .map(function(r) {
        return {
          regexp: r.regexp.toString(),
          path: r.path,
        };
      });
  });
};

export default serverRoutes;
