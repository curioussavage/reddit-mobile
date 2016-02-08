import querystring from 'querystring';
import crypto from 'crypto';
import superagent from 'superagent';
import EventTracker from 'event-tracker';
import constants from '../../src/constants';
import url from 'url';
import gtm from './gtm';

// Build a regex which can pull the base36 out of a prefixed or unprefixed id.
const idRegex = /(?:t\d+_)?(.*)/;

function calculateHash (key, string) {
  const hmac = crypto.createHmac('sha256', key);
  hmac.setEncoding('hex');
  hmac.write(string);
  hmac.end();

  return hmac.read();
}

function postData(eventInfo) {
  const { url, data, query, headers } = eventInfo;

  superagent
    .post(url)
    .set(headers)
    .query(query)
    .timeout(constants.DEFAULT_API_TIMEOUT)
    .send(data)
    .end(function() {});
}

function trackingEvents(app) {
  let trackerSecret = app.config.trackerClientSecret || '';
  trackerSecret = new Buffer(trackerSecret, 'base64').toString();

  const tracker = new EventTracker(
    app.config.trackerKey,
    trackerSecret,
    postData,
    app.config.trackerEndpoint,
    app.config.trackerClientAppName,
    calculateHash
  );

  function eventSend(topic, type, payload) {
    if (tracker) {
      tracker.track(topic, type, payload);
    }
  }

  function gaSend () {
    if (global && global.ga) {
      global.ga.apply(null, [...arguments]);
    }
  }

  function convertId (id) {
    const unprefixedId = idRegex.exec(id)[1];
    return parseInt(unprefixedId, 36);
  }

  function isOtherListing(props) {
    return props.ctx.params.subreddit || props.ctx.params.multi ||
      props.ctx.path === '/';
  }

  function buildPageviewData (props) {
    const LINK_LIMIT = 25;


    const data = {
      language: 'en', // NOTE: update when there are translations
    };

    if (props.ctx.referrer) {
      data.referrer_url = props.ctx.referrer;
      data.referrer_domain = url.parse(props.ctx.referrer).host;
    }

    data.dnt = !!window.DO_NOT_TRACK;

    // If there is a logged-in user, add the user's data to the payload
    if (props.data.user) {
      data.user_name = props.data.user.name;
      data.user_id = convertId(props.data.user.id);
    } else {
      // Otherwise, send in logged-out ID
      data.loid = props.loid;
      data.loid_created = props.loidcreated;
    }

    // If we're looking at a subreddit, include the info in the payload
    if (props.data.subreddit) {
      data.sr_id = convertId(props.data.subreddit.name);
      data.sr_name = props.data.subreddit.id;
    }

    // If we're looking at a list of links or comments, include the sort order
    // (or a default). If it's just a list of links, not comments, also include
    // the page size.
    if (props.data.listings || props.data.search || props.data.activities || props.data.comments) {
      if (props.ctx.query.sort === 'top') {
        data.target_filter_time = props.ctx.query.time || 'all';
      }

      if (props.data.comments || props.data.activities) {
        data.target_sort = props.ctx.query.sort || 'confidence';
      } else {
        data.target_sort = props.ctx.query.sort || 'hot';
        data.target_count = LINK_LIMIT;

        const query = props.ctx.query;
        if (query.before) {
          data.target_before = query.before;
        }

        if (query.after) {
          data.target_after = query.after;
        }
      }
    }

    // Try looking at the data to determine what the subject of the page is.
    // In order of priority, it could be a user profile, a listing, or a
    // subreddit.
    const target = (
      props.data.userProfile ||
      props.data.listing ||
      props.data.subreddit
    );

    data.compact_view = props.compact;

    if (target) {
      // Subreddit ids/names are swapped
      if (props.ctx.params.commentId) {
        data.target_id = convertId(props.ctx.params.commentId);
        data.target_fullname = `t1_${props.ctx.params.commentId}`;
        data.target_type = 'comment';
      } else if (target._type === 'Subreddit') {
        data.target_id = convertId(target.name);
        data.target_fullname = `${target.name}`;
        data.target_type = 'listing';
        data.listing_name = target.id;
      } else if (target._type === 'Link') {
        data.target_id = convertId(target.id);
        data.target_fullname = `t3_${target.id}`;
        data.target_type = 'link';
        if (target.selftext) {
          data.target_type = 'self';
        }
      } else if (target._type === 'Account') {
        data.target_id = convertId(target.id);
        data.target_name = target.name;
        data.target_fullname = `t2_${target.id}`;
        data.target_type = 'account';
      }

      if (target._type === 'Link') {
        data.target_url = target.url;
        data.target_url_domain = target.domain;
      }
    } else if (isOtherListing(props)) {
      // Fake subreddit, mark it as a listing
      data.target_type = 'listing';

      // explicitly check that this is the frontpage
      if (props.ctx.path === '/') {
        data.listing_name = 'frontpage';
      } else if (props.ctx.params.subreddit) {
        const subreddit = props.ctx.params.subreddit;
        if (subreddit.indexOf('+') !== -1) {
          data.listing_name = 'multi';
        } else {
          data.listing_name = subreddit;
        }
      } else if (props.ctx.params.multi) {
        data.listing_name = 'multi';
      }
    }

    return data;
  }

  app.on('pageview', function(props) {
    const payload = buildPageviewData(props);
    eventSend('screenview_events', 'cs.screenview', payload);
    gtm.trigger('pageview', { subreddit: props.ctx.params.subreddit || '' });
  });

  app.on('route:start', function(ctx) {
    const query = querystring.stringify(ctx.query);
    let fullUrl = ctx.path;

    if (query) {
      fullUrl += `?${query}`;
    }

    gaSend('set', 'page', fullUrl);
    gaSend('send', 'pageview');

    const loggedIn = !!window.bootstrap.user;

    const compactCookieValue = document.cookie.match(/\bcompact=(\w+)\b/);
    const compact = !!(compactCookieValue &&
                    compactCookieValue.length > 1 &&
                    compactCookieValue[1] === 'true');

    const compactTestCookieValue = document.cookie.match(/\bcompactTest=(\w+)\b/);
    const compactTest = compactTestCookieValue ? compactTestCookieValue[1] : 'undefined';


    gaSend('set', 'dimension2', loggedIn.toString());
    gaSend('set', 'dimension3', compact.toString());
    gaSend('set', 'dimension4', compactTest.toString());
  });

  app.on('compactToggle', function (compact) {
    gaSend('send', 'event', 'compactToggle', compact.toString());
    gaSend('set', 'dimension3', compact.toString());
  });

  app.on('vote', function (vote) {
    gaSend('send', 'event', 'vote', vote.get('direction'));
  });

  app.on('comment', function (comment) {
    if (comment.text) {
      gaSend('send', 'event', 'comment', 'words', comment.text.match(/\S+/g).length);
    }
  });

  app.on('comment:edit', function() {
    gaSend('send', 'event', 'comment', 'edit');
  });

  app.on('search', function () {
    gaSend('send', 'event', 'search');
  });

  app.on('goto', function (query) {
    gaSend('send', 'event', 'goto', query);
  });

  app.on('report', function () {
    gaSend('send', 'event', 'report');
  });

  app.on('post:submit', function(subreddit) {
    gaSend('send', 'event', 'post', 'submit', subreddit);
  });

  app.on('post:edit', function() {
    gaSend('send', 'event', 'post', 'edit');
  });

  app.on('post:selectSubreddit', function(subreddit) {
    gaSend('send', 'event', 'post', 'selectSubreddit', subreddit);
  });

  app.on('post:error', function() {
    gaSend('send', 'event', 'post', 'captcha');
  });

  app.on('message:submit', function() {
    gaSend('send', 'event', 'messages', 'submit');
  });

  app.on('message:reply', function(message) {
    if (message.text) {
      gaSend('send', 'event', 'messages', 'reply', message.text.match(/\S+/g).length);
    }
  });
}

export default trackingEvents;
