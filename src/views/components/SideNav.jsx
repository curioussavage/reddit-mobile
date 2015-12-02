import React from 'react';
import cookies from 'cookies-js';

import constants from '../../constants';
import propTypes from '../../propTypes';
import querystring from 'querystring';
import { aboutItems, userItems } from '../../sideNavMenuItems'
import titleCase from '../../lib/titleCase';

import BaseComponent from './BaseComponent';

const icons = {
  snooIcon: (<span className='icon-snoo-circled icon-large'>{' '}</span>),
  settingsIcon: (<span className='icon-settings-circled icon-large'>{' '}</span>),
  saveIcon: (<span className='icon-save-circled icon-large'>{' '}</span>),
  mailIcon: (<span className='icon-mail-circled icon-large'>{' '}</span>),
}

class SideNav extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      opened: false,
      selected: '',
      compact: props.compact,
    };

    this._onListClick = this._onListClick.bind(this);
    this._toggle = this._toggle.bind(this);
    this._onViewClick = this._onViewClick.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._desktopSite = this._desktopSite.bind(this);
    this._goto = this._goto.bind(this);
    this._close = this._close.bind(this);
    this.makeSubbredditList = this.makeSubbredditList.bind(this);
    this.makeAboutButtons = this.makeAboutButtons.bind(this);
  }

  componentDidMount() {
    this.props.app.on(constants.TOP_NAV_HAMBURGER_CLICK, this._toggle);
    this.props.app.on('route:start', this._close);
  }

  componentWillUnmount() {
    this.props.app.off(constants.TOP_NAV_HAMBURGER_CLICK, this._toggle);
    this.props.app.off('route:start', this._close);
  }

  _close() {
    if (this.state.opened) {
      window.removeEventListener('scroll', this._onScroll);
      this.props.app.emit(constants.SIDE_NAV_TOGGLE, false);
      this.setState({opened: false});
    }
  }

  _desktopSite(e) {
    e.preventDefault();

    const { url, query } = this.props.ctx;
    let queryString;

    if (Object.keys(this.props.ctx.query).length > 0) {
      queryString = '?' + querystring.stringify(query || {});
    }

    this.props.app.emit('route:desktop', `${url}${query}`);
  }

  _goto(e) {
    e.preventDefault();

    const location = this.refs.location.value.trim();
    const query = querystring.stringify({ location });
    const url = `/goto?${query}`;

    this.props.app.redirect(url);
  }

  makeSubbredditList(selected, subscriptions) {
    let subredditButtons;
    if (selected === 'subreddits') {
      const subredditNodeList = subscriptions.map((d) => {
        if(d.icon) {
          var icon = <figure className='SideNav-icon' style={{backgroundImage: 'url(' + d.icon + ')'}}/>;
        } else {
          icon = icons.snooIcon;
        }
        return (
          <li className='SideNav-li' key={`SideNav-li-${d.url}`}>
            <a className='MobileButton SideNav-button' href={ d.url }>
              { icon }
              <span className='SideNav-text'>{d.display_name}</span>
            </a>
          </li>
        );
      });

      subredditButtons = (
        <ul key='subreddits' className='SideNav-ul list-unstyled'>
          { subredditNodeList }
        </ul>
      );
    }

    return (
      <li className='SideNav-dropdown SideNav-li'>
        <button type='button' className='MobileButton SideNav-button' onClick={ this._onListClick.bind(this, 'subreddits') }>
          <span className={ selected === 'subreddits' ? 'twirlyIcon-open' : 'twirlyIcon-closed'}>
            <span className='icon-twirly-circled icon-large'>{' '}</span>
          </span>
          <span className='SideNav-text'>My Subreddits</span>
        </button>
        { subredditButtons }
      </li>
    );
  }

  makeAboutButtons(selected, config) {
    let aboutList;
    if (selected === 'about') {
      aboutList = (
        <ul key='about' className='SideNav-ul list-unstyled'>
          {aboutItems.map((i) => {
            return (
              <li className='SideNav-li' key={ i.title }>
                <a className='SideNav-button' href={`${config.reddit}${i.url}`}>
                  { icons.snooIcon }
                  <span className='SideNav-text'>{titleCase(i.title)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <li className='SideNav-dropdown SideNav-li'>
        <button type='button' className='SideNav-button' onClick={ this._onListClick.bind(this, 'about') }>
          <span className={ selected === 'about' ? 'twirlyIcon-open' : 'twirlyIcon-closed'}>
            <span className='icon-twirly-circled icon-large'>{' '}</span>
          </span>
          <span className='SideNav-text'>About reddit</span>
        </button>
        { aboutList }
      </li>
    );
  }

  makeLoggedInLoginLink(selected, user) {
    let userButtons;
    if (selected === 'user') {
      userButtons = userItems.map((item) => {
        let url;
        let noRoute = false;
        if (!item.external) {
          url = `/u/${user.name}${item.url}`;
        } else {
          url = item.url;
          noRoute = true;
        }

        return (
          <li key={item.title}>
            <a className='SideNav-button' href={ url } data-no-route={noRoute}>
              { icons[item.icon] }
              <span className='SideNav-text'>{ item.title }</span>
            </a>
          </li>
        );
      });
    }

    return (
      <li className='SideNav-dropdown SideNav-li'>
        <button type='button' className='MobileButton SideNav-button' onClick={this._onListClick.bind(this, 'user')}>
          <span className={ selected === 'user' ? 'twirlyIcon-open' : 'twirlyIcon-closed'}>
            <span className='icon-twirly-circled icon-large'>{' '}</span>
          </span>
          <span className='SideNav-text'>{ user.name }</span>
        </button>
        <ul key='user' className='SideNav-ul list-unstyled'>
          { userButtons }
        </ul>
      </li>
    );
  }

  makeLoginLink(user, selected, config) {
    if (user) {
      return this.makeLoggedInLoginLink(selected, user);
    } else {
      return (
        <li className='SideNav-li'>
          <a className='MobileButton SideNav-button' href={ config.loginPath } data-no-route={ true }>
            { icons.snooIcon }
            <span className='SideNav-text'>Login / Register</span>
          </a>
        </li>
      );
    }
  }

  makeInboxLink(user) {
    if (user) {
      const inboxCount = user.inbox_count;
      let newMail;
      let newClass;

      if (inboxCount > 0) {
        newMail = (<strong>{` (${inboxCount})`}</strong>);
        newClass = 'text-orangered';
      }
      return (
        <li className='SideNav-li'>
          <a className={`MobileButton SideNav-button ${newClass}`} href='/message/inbox/'>
            { icons.mailIcon }
            <span className='SideNav-text'>Inbox{ newMail }</span>
          </a>
        </li>
      );
    } else {
      return null;
    }
  }

  render() {
    if (this.state.opened) {
      const { user, subscriptions, config } = this.props;
      const { compact, selected } = this.state;

      const loginLink = this.makeLoginLink(user, selected, config);
      const inboxLink = this.makeInboxLink(user);
      const subredditLinks = this.makeSubbredditList(selected, subscriptions);
      const aboutRedditLink = this.makeAboutButtons(selected, config);

      return (
        <nav key='root' className='SideNav tween shadow'>
          <ul className='list-unstyled'>
            <li className='SideNav-li '>
              <form method='GET' action='/goto' onSubmit={ this._goto } className='form-sm'>
                <div className='input-group'>
                  <input
                    type='text'
                    className='form-control form-control-sm'
                    placeholder='r/...'
                    name='location'
                    ref='location' />
                  <span className='input-group-btn'>
                    <button type='submit' className='btn btn-default go-btn'>Go</button>
                  </span>
                </div>
              </form>
            </li>
            { loginLink }
            { inboxLink }
            <li className='SideNav-li'>
              <button type='button' className='SideNav-button' onClick={ this._onViewClick }>
                { icons.settingsIcon }
                <span className='SideNav-text'>Switch to { compact ? 'list' : 'compact' } view</span>
              </button>
            </li>
            { subredditLinks }
            { aboutRedditLink }
            <li className='SideNav-li'>
              <a className='SideNav-button' href={`https://www.reddit.com${this.props.ctx.url}`} onClick={ this._desktopSite }>
                { icons.snooIcon }
                <span className='SideNav-text'>View Desktop Site</span>
              </a>
            </li>
          </ul>
        </nav>
      );
    }

    return (<div />);
  }

  _toggle() {
    const opened = this.state.opened;
    this.props.app.emit(constants.SIDE_NAV_TOGGLE, !opened);
    if(!opened) {
      this._top = document.body.scrollTop;
      window.addEventListener('scroll', this._onScroll);
    } else {
      window.removeEventListener('scroll', this._onScroll);
    }
    this.setState({opened: !opened});
  }

  _onScroll(evt) {
    document.body.scrollTop = this._top;
  }

  _onListClick(str) {
    this.setState({selected: this.state.selected === str ? '' : str});
  }

  _onViewClick() {
    const { app, config } = this.props;
    const compact = this.state.compact;

    let date = new Date();
    date.setFullYear(date.getFullYear() + 2);

    if (compact) {
      cookies.expire('compact');
    } else {
      cookies.set('compact', 'true', {
        expires: date,
        secure: config.https || config.httpsProxy,
      });
    }

    const newCompact = !compact;
    app.emit(constants.COMPACT_TOGGLE, newCompact);

    this._toggle();
    this.setState({
      compact: newCompact,
    });
  }
}

SideNav.propTypes = {
  subscriptions: propTypes.subscriptions,
  user: propTypes.user,
};

export default SideNav;
