import React from 'react';
import constants from '../../constants';
import globals from '../../globals';
import q from 'q';
import querystring from 'querystring';

import BaseComponent from '../components/BaseComponent';
import Loading from '../components/Loading';
import TopSubnav from '../components/TopSubnav';
import TrackingPixel from '../components/TrackingPixel';
import UserProfile from '../components/UserProfile';

class UserProfilePage extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      data: props.data || {},
    };

    this.state.loaded = this.state.data && this.state.data.data;
  }

  componentDidMount() {
    UserProfilePage.populateData(globals().api, this.props, true).done((function(data) {
      this.setState({
        data: data || {},
        loaded: true,
      });
    }).bind(this));

    globals().app.emit(constants.TOP_NAV_SUBREDDIT_CHANGE, 'u/' + this.props.userName);
  }

  componentDidUpdate() {
    globals().app.emit('page:update', this.props);
  }

  render() {
    var loading;
    var profile;

    var userProfile = (this.state.data || {}).data || {};
    var name = this.props.userName;
    var tracking;

    var app = globals().app;
    var user = this.props.user;

    if (!this.state.loaded) {
      loading = (
        <Loading />
      );
    } else {
      profile = (
        <UserProfile
          userProfile={userProfile}
          key={'user-profile-' + name}
          user={this.props.user}
          token={this.props.token}
        />
      );
    }

    if (this.state.data.meta) {
      tracking = (
        <TrackingPixel
          referrer={ this.props.referrer }
          url={ this.state.data.meta.tracking }
          user={ this.props.user }
          loid={ props.loid }
          loidcreated={ props.loidcreated }
        />);
    }

    return (
      <div className="user-page user-profile">
        { loading }

        <TopSubnav
          user={ user }
          hideSort={ true }
        />

        <div>
          { profile }
        </div>

        { tracking }
      </div>
    );
  }

  static populateData(api, props, synchronous) {
    var defer = q.defer();

    // Only used for server-side rendering. Client-side, call when
    // componentedMounted instead.
    if (!synchronous) {
      defer.resolve(props.data);
      return defer.promise;
    }

    var options = api.buildOptions(props.apiOptions);

    if (props.userName) {
      options.user = props.userName;
    } else {
      defer.reject('No user name passed in');
    }

    // Initialized with data already.
    if ((props.data || {}).data) {
      api.hydrate('users', options, props.data);

      defer.resolve(props.data);
      return defer.promise;
    }

    api.users.get(options).then(function(data) {
      defer.resolve(data);
    }, function(error) {
      defer.reject(error);
    });

    return defer.promise;
  }
}

//TODO: someone more familiar with this component could eventually fill this out better
UserProfilePage.propTypes = {
  // apiOptions: React.PropTypes.object,
  data: React.PropTypes.object,
  userName: React.PropTypes.string.isRequired,
}

export default UserProfilePage;
