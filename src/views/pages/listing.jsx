import React from 'react';
import remove from 'lodash/array/remove';
import { models } from 'snoode';

import BasePage from './BasePage';
import LinkTools from '../components/LinkTools';
import Comment from '../components/comment/Comment';
import GoogleCarouselMetadata from '../components/GoogleCarouselMetadata';
import Listing from '../components/Listing';
import Loading from '../components/Loading';
import TopSubnav from '../components/TopSubnav';

class ListingPage extends BasePage {
  static propTypes = {
    commentId: React.PropTypes.string,
    data: React.PropTypes.object,
    listingId: React.PropTypes.string.isRequired,
    sort: React.PropTypes.string,
    subredditName: React.PropTypes.string,
  };

  constructor(props) {
    super(props);
    
    this.state = {
      ...this.state,
      editing: false,
      loadingMoreComments: false,
    };

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
    const comments = this.state.data.comments.slice();
    comments.splice(0, 0, comment);

    this.setState({
      data: Object.assign({}, this.state.data, { comments }),
    });
  }

  saveUpdatedText(newText) {
    const {app, apiOptions} = this.props;
    const listing = this.state.data.listing;

    if (newText === listing.selftext) {
      return;
    }

    const link = new models.Link(listing);
    let options = app.api.buildOptions(apiOptions);

    options = Object.assign(options, {
      model: link,
      changeSet: newText,
    });

    app.api.links.patch(options).then((newListing) => {
      if (newListing) {
        const data = Object.assign({}, this.state.data);
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
    const { app, subredditName, apiOptions } = this.props;
    let options = app.api.buildOptions(apiOptions);

    options = Object.assign(options, {
      id,
    });

    // nothing returned for this endpoint
    // so we assume success :/
    app.api.links.delete(options).then(() => {
      const data = this.state.data.listing;
      remove(data, {name: id});

      app.setState({
        data,
      });

      app.redirect(`/r/${subredditName}`);
    });
  }

  toggleEdit() {
    this.setState({
      editing: !this.state.editing,
    });
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

    this.setState({ loadingMoreComments: true });

    try {
      const res = await app.api.comments.get(options);
      const newData = Object.assign({}, data);
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
    const { data, editing, loadingMoreComments, linkEditError } = this.state;

    const {
      app,
      apiOptions,
      commentId,
      ctx,
      token,
      subredditName,
    } = this.props;

    const sort = this.props.sort || 'best';

    const { origin } = this.props.config;
    const { url, env } = ctx;

    if (!data || !data.listing) {
      return (<Loading />);
    }

    const { user, listing, comments } = data;
    const { author, permalink } = listing;

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
    let googleCarousel;

    if (comments) {
      commentsList = comments.map((comment, i) => {
        const key = `comment-${i}`;

        if (comment && comment.bodyHtml !== undefined) {
          return (
            <div className='listing-comment' key={ comment.id } >
              <Comment
                ctx={ ctx }
                app={ app }
                subredditName={ subredditName }
                permalinkBase={ permalink }
                highlightedComment={ commentId }
                comment={ comment }
                index={ i }
                nestingLevel={ 0 }
                op={ author }
                user={ user }
                token={ token }
                apiOptions={ apiOptions }
                sort={ sort }
                repliesLocked={ listing.locked }
              />
            </div>
          );
        }

        const numChildren = comment.children.length;
        const word = numChildren > 1 ? 'replies' : 'reply';
        const permalink = `${permalink}${comment.parent_id.substring(3)}?context=0`;
        const text = loadingMoreComments ? 'Loading...' :
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
      });

      // Show google crawler metadata when the server renders
      if (env === 'SERVER') {
        googleCarousel = (
          <GoogleCarouselMetadata
            url={ url }
            app={ app }
            origin={ origin }
            listing={ listing }
            comments={ comments }
          />
        );
      }
    } else {
      commentsList = (
        <div className='Loading-Container'>
          <Loading />
        </div>
      );
    }

    return (
      <div className='listing-main'>
        <TopSubnav
          { ...this.props }
          user={ user }
          sort={ sort }
          list='comments'
        />
        <div className='container listing-content' key='container'>
          { googleCarousel }
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
          <div className="listing-content__tools">
            <LinkTools
              app={ app }
              apiOptions={ apiOptions }
              token={ token }
              linkId={ listing.name }
              onNewComment={ this.onNewComment }
              isLocked={ listing.locked }
            />
          </div>
          { singleComment }
          { commentsList }
        </div>
      </div>
    );
  }
}

export default ListingPage;
