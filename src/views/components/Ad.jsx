import React from 'react';

import constants from '../../constants';
import { models } from 'snoode';
import superagent from 'superagent';

import BaseComponent from './BaseComponent';
import Listing from './Listing';

class Ad extends BaseComponent {
  constructor (props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this._checkImpression = this._checkImpression.bind(this);

    this._removeListeners = this._removeListeners.bind(this);
  }

  checkPos() {
    if (!this.state.loaded) {
      return true;
    }

    let listing = this._listing;

    if (!listing) {
      return true;
    }

    return listing.checkPos.apply(listing, arguments);
  }

  async getAd() {
    let { srnames, subredditName, app, token, loid } = this.props;
    let { authAPIOrigin, nonAuthAPIOrigin, adsPath } = app.config;
    // If we're not on a sub/multi, we're on the front page, so get front page
    // ads
    if (!subredditName) {
      srnames = ' reddit.com';
    }

    let loggedIn = !!token;
    let origin = loggedIn ? authAPIOrigin : nonAuthAPIOrigin;
    let headers = {};
    let postData = {
      srnames: srnames,
      is_mobile_web: true,
      raw_json: '1',
    };

    // If user is not logged in, send the loid in the promo request
    if (loggedIn) {
      headers.authorization = 'bearer ' + token;
    } else {
      postData.loid = loid;
    }

    try {
      let res = await superagent.post(origin + adsPath)
        .set(headers)
        .type('form')
        .send(postData)
        .timeout(constants.DEFAULT_API_TIMEOUT)

      if (res && res.status === 200 && res.body) {
        var link = res.body.data;
        link.url = link.href_url;

        this.setState({
          loaded: true,
          ad: new models.Link(link).toJSON(),
        });
      } else {
        throw [['Unknown error', 'There was a problem']];
      }
    } catch (e) {
      if (this.props.config.debug) {
        console.log(e);
      }
    }
  }

  componentDidMount() {
    this.getAd();

    this.props.app.on(constants.SCROLL, this._checkImpression);
    this.props.app.on(constants.RESIZE, this._checkImpression);

    this._hasListeners = true;
    this._checkImpression();
  }

  componentDidUpdate (prevProps, prevState) {
    if (!prevState.loaded && this.state.loaded) {
      this.props.afterLoad();
      this._checkImpression();
    }
  }

  componentWillUnmount() {
    this._removeListeners();
  }

  _removeListeners() {
    if (this._hasListeners) {
      this.props.app.off(constants.SCROLL, this._checkImpression);
      this.props.app.off(constants.RESIZE, this._checkImpression);
      this._hasListeners = false;
    }
  }

  _checkImpression() {
    const adObject = this.state.ad;

    if (adObject) {
      const node = this.domNode;
      const winHeight = window.innerHeight;
      const rect = node.getBoundingClientRect();
      const top = rect.top;
      const height = rect.height;
      const bottom = top + height;
      const middle = (top + bottom) / 2;
      const middleIsAboveBottom = middle < winHeight;
      const middleIsBelowTop = bottom > constants.TOP_NAV_HEIGHT + height / 2;

      if(middleIsAboveBottom && middleIsBelowTop) {
        const srcs=['imp_pixel', 'adserver_imp_pixel'];

        for (var i = 0, iLen = srcs.length; i < iLen; i++) {
          let pixel = new Image();
          pixel.src = adObject[srcs[i]];
        }

        this._removeListeners();
      }
    }
  }

  render() {
    let props = this.props;
    let { loaded, ad } = this.state;
    if (!loaded) {
      return null;
    }

    return (
      <Listing
        ref={(c) => {
          if (!this._listing && c) {
            this._listing = c;
          }
        }}
        {...props}
        hideDomain={ true }
        hideSubredditLabel={ true }
        hideWhen={ true }
        listing={ ad } />
    );
  }
};

let { func, bool, string } = React.PropTypes;

Ad.propTypes = {
  afterLoad: func.isRequired,
  compact: bool.isRequired,
  token: string,
};

export default Ad;
