import React from 'react';

const T = React.propTypes;

import BasePage from './BasePage';
import ListingContainer from '../components/ListingContainer';
import Loading from '../components/Loading';

class ModPage extends BasePage {
  static propTypes = {

  };

  render() {
    const props = this.props;
    const { compact, ctx, subreddit } = props;

    const page = props.page || 0;
    const { user, modqueue } = this.state.data;

    if (!modqueue) {
      return (
        <Loading />
      );
    }

    let pagingPrefix;
    if (props.subredditName) {
      pagingPrefix = `/r/${props.subredditName}`;
    }

    return (
      <div>
        <ListingContainer
          { ...props }
          user={ user }
          showAds={ false }
          listings={ modqueue || [] }
          firstPage={ page }
          page={ page }
          hideSubredditLabel={ false }
          subredditTitle={ subreddit }
          subredditIsNSFW={ false }
          winWidth={ ctx.winWidth }
          compact={ compact }
          pagingPrefix={ pagingPrefix }
        />
      </div>
    );
  }
}

export default ModPage;


