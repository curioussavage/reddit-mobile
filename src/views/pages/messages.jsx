import React from 'react';

import BasePage from './BasePage';
import MessageNav from '../components/MessageNav';
import Inbox from '../components/Inbox';
import Loading from '../components/Loading';
import MessageSideNav from '../components/messageSideNav';

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

      if (view === 'moderator') {
        sideNav = (
          <MessageSideNav props={ this.props } />
        );
      }

      content = (
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
