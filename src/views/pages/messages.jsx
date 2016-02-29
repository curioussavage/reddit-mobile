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
    this.goToModmailSub = this.goToModmailSub.bind(this);
  }
  static propTypes = {
    data: React.PropTypes.object,
    view: React.PropTypes.string.isRequired,
  };

  get track () {
    return 'messages';
  }

  makeSubTabs(sub) {
    const { subreddit } = this.props;
    const selected = (subreddit && subreddit === sub.display_name) ||
                     (!subreddit && sub.display_name === 'All') ? true : false;
    const subPath = sub.display_name !== 'All' ? `/r/${sub.display_name}` : '';
    return (
      <option selected={ selected }>
        <a href={ `${subPath}/message/moderator` }>{ sub.display_name }</a>
      </option>
    );
  }

  goToModmailSub(e) {
    const sub = e.currentTarget.value;
    this.props.app.redirect(`/r/${sub}/message/moderator`);
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
          subreddit= { subreddit }
          inboxType={ viewType }
        />
      );

      if (viewType === 'moderator') {
        const subs = (this.state.data.subreddit || []).slice();

        subs.unshift({ display_name: 'All'});

        const subTabs = subs.map(this.makeSubTabs);
        tabs = (
          <div className='tabs__wrapper' >
            <span>Subreddit</span>
            <select onChange={ this.goToModmailSub }>
              { subTabs }
            </select>
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
        <MessageNav {...this.props} user={ this.state.data.user } />
        <div className='container'>
          { tabs }
          { sideNav }
          { content }
        </div>
      </div>
    );
  }
}

export default MessagesPage;
