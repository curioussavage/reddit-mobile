import React from 'react';
import constants from '../../constants';
import globals from '../../globals';
import process from 'reddit-text-js';
import q from 'q';

import BaseComponent from '../components/BaseComponent';
import Loading from '../components/Loading';
import TopSubnav from '../components/TopSubnav';
import TrackingPixel from '../components/TrackingPixel';

class SubredditAboutPage extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      data: props.data || {}
    };

    this.state.loaded = !!this.state.data.data;
  }

  componentDidMount() {
    SubredditAboutPage.populateData(globals().api, this.props, true).done((function (data) {
      this.setState({
        data: data,
        loaded: true
      });
    }).bind(this));

    globals().app.emit(constants.TOP_NAV_SUBREDDIT_CHANGE, `r/${this.props.subredditName}/about`);
  }

  componentDidUpdate() {
    globals().app.emit('page:update', this.props);
  }

  render() {
    var loading;
    var tracking;

    if (!this.state.loaded) {
      loading = (
        <Loading />
      );
    }

    var props = this.props;
    var app = globals().app;
    var user = this.props.user;

    if (this.state.data.meta) {
      tracking = (
        <TrackingPixel
          referrer={ props.referrer }
          url={ this.state.data.meta.tracking }
          user={ props.user }
          loid={ props.loid }
          loidcreated={ props.loidcreated }
        />);
    }

    var htmlDump;
    if (!loading) {
      var data = this.state.data.data;

      htmlDump = [
        <ul className='subreddit-about-numbers' key='subreddit-about-numbers'>
          <li>{ `${data.subscribers} readers` }</li>
          <li>{ `${data.accounts_active} users here now` }</li>
        </ul>,
        <div className='subreddit-about-rules' key='subreddit-about-rules'
          dangerouslySetInnerHTML={{ __html: process(data.description) }}>
        </div>
      ];
    }

    return (
      <div className='subreddit-about-main'>
        { loading }

        <TopSubnav
          user={ user }
          hideSort={ true }
        />

        <div className='container' key='container'>
          { htmlDump }
        </div>

        { tracking }
      </div>
    );
  }

  static populateData(api, props, synchronous, useCache = true) {
    var defer = q.defer();

    // Only used for server-side rendering. Client-side, call when
    // componentedMounted instead.
    if (!synchronous) {
      defer.resolve(props.data);
      return defer.promise;
    }

    var options = api.buildOptions(props.apiOptions);
    options.query.subreddit = props.subredditName;
    options.useCache = useCache;

    // Initialized with data already.
    if (useCache && (props.data || {}).data) {
      api.hydrate('subreddits', options, props.data);

      defer.resolve(props.data);
      return defer.promise;
    }

    api.subreddits.get(options).then(function (data) {
      defer.resolve(data);
    }, function(error) {
      defer.reject(error);
    });

    return defer.promise;
  }
}

//TODO: someone more familiar with this component could eventually fill this out better
SubredditAboutPage.propTypes = {
  // apiOptions: React.PropTypes.object,
  data: React.PropTypes.object,
  subredditName: React.PropTypes.string.isRequired,
}

export default SubredditAboutPage;
