import React from 'react';

import BasePage from './BasePage';
import MessageNav from '../components/MessageNav';
import Inbox from '../components/Inbox';
import Loading from '../components/Loading';
import MessageSideNav from '../components/messageSideNav';

import includes from 'lodash/collection/includes';

class MessagesPage extends BasePage {
  constructor(props) {
    super(props);

    this.makeSubTabs = this.makeSubTabs.bind(this);
  }
  static propTypes = {
    data: React.PropTypes.object,
    view: React.PropTypes.string.isRequired,
  };

  get track () {
    return 'messages';
  }

  makeSubTabs(sub) {
    const active = this.props.subreddit === sub.display_name ?
      'active' : '';
    return (
      <div className={ `tabs__tab ${active}` }>
        <a href={ `/r/${sub.display_name}/message/moderator` }>{ sub.display_name }</a>
      </div>
    );
  }

  render() {
    let content;
    let view;
    let sideNav;
    let tabs;

    const { subreddit } = this.props;

    if (!this.state.loaded || !this.state.data.messages) {
      content = (
        <Loading />
      );
    } else {
      const messages = this.state.data.messages;
      view = this.props.view.toLowerCase();

      const viewType = includes(view, 'moderator') ? 'moderator' : 'user';
      sideNav = (
        <MessageSideNav
          { ...this.props }
          subreddit= { this.props.subreddit }
          inboxType={ viewType }
        />
      );

      if (viewType === 'moderator') {
        const subs = this.state.data.subreddit || [];
        const subTabs = subs.map(this.makeSubTabs);
        tabs = (
          <div className='tabs__wrapper' >
            <div className={ `tabs__tab ${subreddit ? '' : 'active'}` }>
              <a href='/message/moderator'>All</a>
            </div>
            { subTabs }
          </div>
        );
      }

      content = (
        <div className='message__wrapper' >
          <Inbox
            showSubject={ true }
            view={ this.props.view }
            app={ this.props.app }
            messages={ messages }
            key={ `mesages-${view}` }
            user={ this.state.data.user }
            token={ this.props.token }
            apiOptions={ this.props.apiOptions }
          />
        </div>
      );
    }

    return (
      <div className={ `message-page message-${view}` }>
        <div>
          <MessageNav {...this.props} user={ this.state.data.user } />
          { tabs }
          { sideNav }
          { content }
        </div>
      </div>
    );
  }
}

export default MessagesPage;
