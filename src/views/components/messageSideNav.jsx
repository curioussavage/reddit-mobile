import React from 'react';

import BaseComponent from './BaseComponent';

const BASE_MENU = [
  { link: 'all'},
  { link: 'unread'},
];

const USER_MENU = [
  { link: 'messages' },
  { link: 'comments', title: 'comment replies' },
  { link: 'selfreply', title: 'post replies'},
  { link: 'mentions', title: 'username mentions' },
];

const INBOX_MENU = BASE_MENU.concat(USER_MENU); 

class MessageSideNav extends BaseComponent {
  static propTypes = {

  };

  renderMenuItem(sub) {
    const subPath = sub ? `/${sub}` : '';
    return (curr, index) => {
      const path = curr.link === 'all' ? '' : curr.link;
      const link = `${subPath}/messages/${curr.link}`;
      return (
        <li>
          <a href={ link } data-no-route='true'>{ curr.text || curr.link } </a>
        </li>
      );
    }
  }

  render() {
    const props = this.props;

    const items = props.inboxType === 'moderator' ? 
      BASE_MENU.map(this.renderMenuItem(props.subreddit)) : INBOX_MENU.map(this.renderMenuItem(props.subreddit));

    return (
      <div className='messageSidenav'>
        <ul>
          { items }
        </ul>
      </div>
    );
  }
}

export default MessageSideNav;
