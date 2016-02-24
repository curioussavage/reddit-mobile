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

  renderMenuItem(path) {
    return (curr) => {
      const linkPath = curr.link === 'all' ? '' : curr.link;
      const link = `${path}/${linkPath}`;
      return (
        <li>
          <a href={ link } data-no-route='true'>{ curr.text || curr.link } </a>
        </li>
      );
    };
  }

  render() {
    const props = this.props;

    const list = props.inboxType === 'moderator' ? BASE_MENU : INBOX_MENU;
    const items = list.map(this.renderMenuItem(props.ctx.path));

    return (
      <div className='messageSidenav'>
        <p className='messageSidenav__label'>Filters</p>
        <ul className='messageSidenav__nav-list'>
          { items }
        </ul>
      </div>
    );
  }
}

export default MessageSideNav;
