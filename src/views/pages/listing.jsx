import React from 'react';
import remove from 'lodash/array/remove';
import { models } from 'snoode';

import BasePage from './BasePage';
import Comment from '../components/Comment';
import CommentBox from '../components/CommentBox';
import GoogleCarouselMetadata from '../components/GoogleCarouselMetadata';
import Listing from '../components/Listing';
import Loading from '../components/Loading';
import TopSubnav from '../components/TopSubnav';

class ListingPage extends BasePage {
  constructor(props) {
    super(props);

    this.state.editing = false;
    this.state.loadingMoreComments = false;

    this.onNewComment = this.onNewComment.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.saveUpdatedText = this.saveUpdatedText.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.loadMore = this.loadMore.bind(this);
  }

  get track () {
    return 'comments';
  }

  onNewComment (comment) {
    // make a shallow copy so we can append to it
    var comments = this.state.data.comments.slice();
    comments.splice(0, 0, comment);

    this.setState({
      data: Object.assign({}, this.state.data, { comments }),
    });
  }

  saveUpdatedText(newText) {
    const {app, apiOptions} = this.props;
    let listing = this.state.data.listing;

    if (newText === listing.selftext) {
      return;
    }

    let link = new models.Link(listing);
    let options = app.api.buildOptions(apiOptions);

    options = Object.assign(options, {
      model: link,
      changeSet: newText,
    });

    app.api.links.patch(options).then((newListing) => {
      if (newListing) {
        var data = Object.assign({}, this.state.data);
        data.listing = newListing;

        this.setState({
          editing: false,
          data,
        });

        app.emit('post:edit');
      }
    }).catch((err) => {
      this.setState({ linkEditError: err });
    });
  }

  onDelete(id) {
    var {app, subredditName, apiOptions} = this.props;
    var options = app.api.buildOptions(apiOptions);

    options = Object.assign(options, {
      id,
    });

    // nothing returned for this endpoint
    // so we assume success :/
    app.api.links.delete(options).then(() => {
      var data = this.state.data.listing;
      remove(data, {name: id});

      app.setState({
        data,
      });

      app.redirect('/r/' + subredditName);
    });
  }

  toggleEdit() {
    this.setState({
      editing: !this.state.editing,
    });
  }

  _getLocalStorageKeys() {
    var keys = [];
    if (global.localStorage) {
      for (var key in localStorage) {
        keys.push(key);
      }
    }
    return keys;
  }

  async loadMore(e) {
    e.preventDefault();
    const { app, apiOptions, sort } = this.props;
    const { data } = this.state;

    const index = e.currentTarget.dataset.index;
    const comment = data.comments[index];

    let options = app.api.buildOptions(apiOptions);
    options = Object.assign(options, {
      query: {
        ids: comment.children,
      },
      linkId: data.listing.name,
      sort: sort || 'best',
    });

    this.setState({loadingMoreComments: true});

    try {
      let res = await app.api.comments.get(options);
      let newData = Object.assign({}, data);
      newData.comments = data.comments
        .slice(0, data.comments.length - 1)
        .concat(res.body);

      this.setState({
        data,
        loadingMoreComments: false,
      });
    } catch (e) {
      app.error(e, this, app, { redirect: false, replaceBody: false });
      this.setState({loadingMoreComments: false});
    }
  }

  render() {
    let { data, editing, loadingMoreComments, linkEditError } = this.state;
    let { app, apiOptions, commentId, ctx, token, sort, subredditName,
         isGoogleCrawler, origin } = this.props;

    sort = sort || 'best';

    if (!data || !data.listing) {
      return (<Loading />);
    }

    let user = data.user,
      listing = data.listing,
      comments = data.comments,
      author = listing.author,
      permalink = listing.cleanPermalink;


    let singleComment;
    if (commentId) {
      singleComment = (
        <div className='alert alert-warning vertical-spacing vertical-spacing-top'>
          <p>
            <span>You are viewing a single comment's thread. </span>
            <a href={ permalink }>View the rest of the comments</a>
          </p>
        </div>
      );
    }


    let commentsList;
    if (comments) {
      commentsList = comments.map((comment, i) => {
        var key = `comment-${i}`;

        if (comment && comment.bodyHtml !== undefined) {
          return (
            <Comment
              key={ key }
              ctx={ ctx }
              app={ app }
              subredditName={ subredditName }
              permalinkBase={ permalink }
              highlight={ commentId }
              comment={ comment }
              index={ i }
              nestingLevel={ 0 }
              op={ author }
              user={ user }
              token={ token }
              apiOptions={ apiOptions }
              sort={ sort }
            />
          );
        } else {
          let numChildren = comment.children.length;
          let word = numChildren > 1 ? 'replies' : 'reply';
          let permalink = permalink + comment.parent_id.substring(3) + '?context=0';
          let text = loadingMoreComments ? 'Loading...' :
                                           `load more comments (${numChildren} ${word})`;
          return (
            <a
              key={ key }
              href={ permalink }
              data-no-route='true'
              data-index={ i }
              onClick={ this.loadMore }
            >{ text }</a>
          );
        }
      });
    } else {
      commentsList = (
        <div className='Loading-Container'>
          <Loading />
        </div>
      );
    }

    return (
      <div className='listing-main'>
        <GoogleCarouselMetadata
          origin={ origin }
          show={ isGoogleCrawler }
          listing={ listing }
          comments={ comments }
        />
        <TopSubnav
          { ...this.props }
          user={ user }
          sort={ sort }
          list='comments'
        />
        <div className='container listing-content' key='container'>
          <Listing
            app={ app }
            ctx={ ctx }
            apiOptions={ apiOptions }
            editError={ linkEditError }
            editing={ editing }
            listing={ listing }
            onDelete={ this.onDelete }
            user={ user }
            token={ token }
            saveUpdatedText={ this.saveUpdatedText }
            single={ true }
            winWidth={ this.props.ctx.winWidth }
            toggleEdit={ this.toggleEdit }
          />
          <CommentBox
            apiOptions={ apiOptions }
            thingId={ listing.name }
            user={ user }
            token={ token }
            app={ app }
            ctx={ ctx }
            onSubmit={ this.onNewComment }
          />
          { singleComment }
          { commentsList }
        </div>
      </div>
    );
  }
}

ListingPage.propTypes = {
  commentId: React.PropTypes.string,
  data: React.PropTypes.object,
  isGoogleCrawler: React.PropTypes.bool,
  listingId: React.PropTypes.string.isRequired,
  sort: React.PropTypes.string,
  subredditName: React.PropTypes.string,
};

export default ListingPage;
