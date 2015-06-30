import React from 'react';

import { models } from 'snoode';

import q from 'q';
import querystring from 'querystring';
import commentsMap from '../../lib/commentsMap';
import constants from '../../constants';

import Loading from '../components/Loading';
import TrackingPixel from '../components/TrackingPixel';
import Listing from '../components/Listing';
import CommentBox from '../components/CommentBox';
import Comment from '../components/Comment';
import TopSubnav from '../components/TopSubnav';

import GoogleCarouselMetadata from '../components/GoogleCarouselMetadata';

class ListingPage extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      data: props.data || {},
      linkComment: '',
      editing: false,
      linkEditError: null,
    };

    this.state.loaded = this.state.data && this.state.data.data;
  }

  componentDidMount() {
    ListingPage.populateData(this.props.api, this.props, true).done((function(data) {
      var name = data.data.listing.name;
      var linkComment = '';
      if (localStorage.getItem(name)) {
        linkComment = window.localStorage.getItem(name);
      }

      this.setState({
        data: data,
        loaded: true,
        linkComment: linkComment,
      });
    }).bind(this));

    if (this.props.subredditName) {
      this.props.app.emit(constants.TOP_NAV_SUBREDDIT_CHANGE, 'r/' + this.props.subredditName);
    } else {
      this.props.app.emit(constants.TOP_NAV_SUBREDDIT_CHANGE);
    }
  }

  componentDidUpdate() {
    this.props.app.emit('page:update', this.props);
  }

  onNewComment (comment) {
    this.state.data.data.comments.splice(0, 0, comment);

    this.setState({
      data: this.state.data,
    });
  }

  saveUpdatedText(newText) {
    var props = this.props;
    var listing = this.state.data.data.listing;
    if (newText === listing.selftext) {
      return;
    }

    var link = new models.Link(listing);
    var options = props.api.buildOptions(props.apiOptions);

    options = Object.assign(options, {
      model: link,
      changeSet: newText,
    });

    props.api.links.patch(options).then(function(res) {
      if (res) {
        var data = this.state.data;
        var listing = data.data.listing;
        var newListing = res.data;
        listing.selftext = newListing.selftext;
        listing.expandContent = newListing.expandContent;

        this.setState({
          editing: false,
          data: data,
        })

        this.props.app.emit('post:edit');
      }
    }.bind(this), function(err) {
      this.setState({linkEditError: err});
    }.bind(this))
  }

  toggleEdit() {
    this.setState({editing: !this.state.editing});
  }

  render() {
    var loading;
    var tracking;
    var props = this.props;

    if (!this.state.loaded) {
      loading = (
        <Loading />
      );
    }

    var data = this.state.data.data;
    var editing = this.state.editing;

    var listing = data ? data.listing : {};
    var comments = data ? data.comments : [];

    var api = props.api;
    var user = props.user;
    var token = props.token;
    var author = listing.author;
    var sort = props.sort || 'best';
    var app = props.app;

    var listingElement;
    var commentBoxElement;

    var loginPath = props.loginPath + '/?' + querystring.stringify({
      originalUrl: props.url,
    });
    var apiOptions = props.apiOptions;
    var singleComment;
    var permalink;

    if (listing) {
      permalink = listing.cleanPermalink;
    }

    var keys = [];
    if (global.localStorage) {
      for (var key in localStorage) {
        keys.push(key);
      }
    }
    var savedCommentKeys = keys;
    var savedReply = this.state.linkComment;
    if (!loading) {
      listingElement = (
        <Listing
          https={ props.https }
          httpsProxy={ props.httpsProxy }
          apiOptions={ apiOptions }
          app={ app }
          listing={ listing }
          single={ true }
          user={ user }
          token={ token }
          api={ api }
          loginPath={ loginPath }
          saveUpdatedText={ this.saveUpdatedText.bind(this) }
          editing={ editing }
          toggleEdit={ this.toggleEdit.bind(this) }
          editError={ this.state.linkEditError }
          />
      );

      commentBoxElement = (
        <CommentBox
          app={ app }
          apiOptions={ apiOptions }
          thingId={ listing.name }
          user={ user }
          token={ token }
          api={ api }
          csrf={ props.csrf }
          onSubmit={ this.onNewComment.bind(this) }
          loginPath={ loginPath }
          savedReply={ savedReply }
        />
      );

      if (props.commentId) {
        singleComment = (
          <div className='alert alert-warning vertical-spacing vertical-spacing-top'>
            <p>
              <span>You are viewing a single comment's thread. </span>
              <a href={permalink}>View the rest of the comments</a>
            </p>
          </div>
        );
      }
    }

    if (this.state.data.meta) {
      tracking = (
        <TrackingPixel
          url={ this.state.data.meta.tracking }
          loid={ props.loid }
          loidcreated={ props.loidcreated }
          user={ props.user }
          compact={ props.compact }
          experiments={ props.experiments }
        />);
    }

    return (
      <div className='listing-main'>
        { loading }

        <GoogleCarouselMetadata
          app={ props.app }
          url={ props.url }
          origin={ props.origin }
          show={ props.isGoogleCrawler }
          listing={listing}
          comments={comments}
        />

        <TopSubnav
          app={ app }
          user={ user }
          sort={ sort }
          list='comments'
          baseUrl={ props.url }
          loginPath={ loginPath }
        />
        <div className='container' key='container'>
          { listingElement }
          { commentBoxElement }
          { singleComment }
          {
            comments.map(function(comment, i) {
              if (comment) {
                comment = commentsMap(comment, null, author, 4, 0, 0, false, savedCommentKeys);
                return (
                  <Comment
                    subredditName={ props.subredditName }
                    permalinkBase={ permalink }
                    highlight={ props.commentId }
                    app={app}
                    comment={comment}
                    index={i}
                    key={`page-comment-${comment.name}`}
                    nestingLevel={ 0 }
                    op={ author }
                    user={ user }
                    token={ token }
                    api={api}
                    loginPath={loginPath}
                    apiOptions={apiOptions}
                  />
                );
              }
            })
          }
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

    function mapComment(comment) {
      if (comment && comment.body) {
        comment.body_html = comment.body_html;

        if (comment.replies) {
          comment.replies = comment.replies.map(mapComment) || [];
        }

        return comment;
      }
    }

    options.linkId = props.listingId;

    if (props.commentId) {
      options.query.comment = props.commentId;
      options.query.context = props.query.context || 1;
    }

    options.sort = props.sort || 'confidence';

    // Initialized with data already.
    if (props.data && typeof props.data.data !== 'undefined') {
      api.hydrate('comments', options, props.data);

      defer.resolve(props.data);
      return defer.promise;
    }

    api.comments.get(options).then(function(data){
      data.data.comments = data.data.comments.map(function(comment){
        return mapComment(comment);
      });

      defer.resolve(data);
    }, function(error) {
      defer.reject(error);
    });

    return defer.promise;
  }
}

export default ListingPage;
