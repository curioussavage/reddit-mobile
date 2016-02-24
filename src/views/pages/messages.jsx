import React from 'react';

import BasePage from './BasePage';
import MessageNav from '../components/MessageNav';
import Inbox from '../components/Inbox';
import Loading from '../components/Loading';
import MessageSideNav from '../components/messageSideNav';

import includes from 'lodash/collection/includes';

class MessagesPage extends BasePage {
  static propTypes = {
    data: React.PropTypes.object,
    view: React.PropTypes.string.isRequired,
  };

  get track () {
    return 'messages';
  }

  render() {
    let content;
    let view;
    let sideNav;

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
          props={ this.props }
          subreddit= { this.props.subreddit }
          inboxType={ viewType }
        />
      );

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
          { sideNav }
          { content }
        </div>
      </div>
    );
  }
}

export default MessagesPage;
