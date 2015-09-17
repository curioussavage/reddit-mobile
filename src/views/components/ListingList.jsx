import React from 'react';
import constants from '../../constants';
import propTypes from '../../propTypes';
import uniq from 'lodash/array/uniq';

import Ad from '../components/Ad';
import BaseComponent from './BaseComponent';
import CommentPreview from '../components/CommentPreview';
import Listing from '../components/Listing';
import InfiniteScroller from 'react-variable-height-infinite-scroller';

const _AD_LOCATION = 11;

class ListingList extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      adLocation: Math.min(_AD_LOCATION, props.listings.length),
      compact: this.props.compact,
    };
  }

  componentDidMount() {
    this._onCompactToggle = this._onCompactToggle.bind(this);
    this.props.app.on(constants.COMPACT_TOGGLE, this._onCompactToggle);
  }

  componentWillUnmount() {
    this.props.app.off(constants.COMPACT_TOGGLE, this._onCompactToggle);
  }

  _getLoadedDistance () {
    return window.innerHeight * 2;
  }

  _checkAdPos() {
    var loadedDistance = this._getLoadedDistance();

    if (!this.refs.ad) {
      return false;
    }

    return this.refs.ad.checkPos(loadedDistance);
  }

  _hasAd() {
    return this.props.showAds && this.refs.ad;
  }

  _isIndexOfAd(index) {
    return this._hasAd() && index === this.state.adLocation;
  }

  buildAd() {
    var srnames = uniq(this.props.listings.map(function(l) {
      return l.subreddit;
    }));

    return (
      <Ad
        loid={this.props.loid}
        key='ad'
        ref='ad'
        {...this.props}
        srnames={srnames}
        afterLoad={this._checkAdPos.bind(this)}
        compact={ this.state.compact }
        />
    );
  }

  render() {
    var props = this.props;
    var page = props.firstPage || 0;
    var length = props.listings.length;
    var compact = this.state.compact;

    /*
    // If ads are enabled, splice an ad into the listings.
    if (props.showAds && listings.length) {
      listings.splice(this.state.adLocation, 0, this.buildAd());
    }
    */

    if (global.innerHeight) {
      // rough, but close enough.
      var height = global.innerHeight;

      return (
        <InfiniteScroller
          averageElementHeight={this.state.compact ? 100 : 300}
          containerHeight={height}
          renderRow={this.renderRow.bind(this)}
          totalNumberOfRows={this.props.listings.length}
        />
      );
    } else {
      var els = this.props.listings.map(function(l, i) {
        return this.renderRow(i);
      }.bind(this));

      return (
        <div>{els}</div>
      );
    }
  }

  renderRow (rowNumber) {
    var listingEl;
    var listing = this.props.listings[rowNumber];

    var index = ((this.props.firstPage || 0) * 25) + rowNumber;

    if (listing._type === 'Comment') {
      listingEl = (
        <CommentPreview
          comment={listing}
          key={'page-comment-' + index}
          page={page}
          ref={'listing' + rowNumber}
        />
      );
    } else {
      if (this.props.showHidden || !listing.hidden) {
        listingEl = (
          <Listing
            index={index}
            key={'page-listing-' + index}
            listing={listing}
            ref={'listing' + rowNumber}
            z={this.props.listings.length - rowNumber}
            {...this.props}
            compact={ this.state.compact }
          />
        );
      }
    }

    return listingEl;
  }

  componentWillReceiveProps(nextProps) {
    var compact = nextProps.compact;
    if (compact !== 'undefined' && compact !==this.state.compact) {
      this.setState({compact: compact});
    }
  }

  _onCompactToggle(compact) {
    this.setState({ compact });
  }
}

ListingList.propTypes = {
  compact: React.PropTypes.bool,
  firstPage: React.PropTypes.number,
  listings: React.PropTypes.arrayOf(React.PropTypes.oneOfType([
    propTypes.comment,
    propTypes.listing,
  ])).isRequired,
  showAds: React.PropTypes.bool,
  showHidden: React.PropTypes.bool,
};

export default ListingList;
