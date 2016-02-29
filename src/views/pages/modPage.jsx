import React from 'react';
import moment from 'moment';

const T = React.propTypes;

import mobilify from '../../lib/mobilify';

import BasePage from './BasePage';
import Loading from '../components/Loading';

const ACTIONS = [
  'approve',
  'remove',
  'ignoreReports',
  'unignoreReports',
  'spam',
];

class ModPage extends BasePage {
  static propTypes = {

  };

  constructor(props) {
    super(props);

    this.state.modSelected = [];

    this.renderModWrapper = this.renderModWrapper.bind(this);
    this.renderList = this.renderList.bind(this);
    this.addOrRemoveAction = this.addOrRemoveAction.bind(this);
    this.approve = this.doAction.bind(this, 'approve');
    this.remove = this.doAction.bind(this, 'remove');
    this.ignoreReports = this.doAction.bind(this, 'ignoreReports');
    this.unignoreReports = this.doAction.bind(this, 'unignoreReports');
    this.spam = this.doAction.bind(this, 'spam');
    this.actionRequest = this.actionRequest.bind(this);
  }

  getIds(indexes, list) {
    return indexes.map((index) => {
      return list[index].name;
    });
  }

  doAction(actionType) {
    const indexes = this.state.modSelected.slice();

    this.actionRequest(actionType, this.getIds(indexes, this.state.data.modqueue));
  }

  actionRequest(actionType, items) {
    const { app, apiOptions } = this.props;

    const options = {
      ...app.api.buildOptions(apiOptions),
      action: actionType,
      ids: items,
    };

    try {
      const resp = app.api.modActions.post(options);

      console.log(resp);
    } catch (e) {
      console.log(e);
    }
  }

  renderLink(link) {
    const {
      author,
      created_utc,
      title,
      score,
      is_self,
      selftext,
      mod_reports,
      preview,
      media,
    } = link;

    return (
      <div className='modPage__link'>
        <div>
          <span>{ title.substr(0, 100) } </span>
          <span className='modPage__thing-date'>Score: { score } - { moment(created_utc * 1000).fromNow() }</span>
          <p>Author: { author }</p>
        </div>
        <div>
          <div className='modPage__link-content'/>
          { this.renderReportReasons(mod_reports) }
        </div>
      </div>
    );
  }

  renderComment(comment) {
    const {
      author,
      created_utc,
      edited,
      score,
      mod_reports,
      link_title,
      body_html,
    } = comment;

    const bodyText = mobilify(body_html);

    return (
      <div className='modPage__comment'>
        <div>
          <span
            children={ `Parent Link: ${link_title} ` }
          />
          <span
            className='modPage__thing-date'
            children={ `Score: ${score} - ${moment(created_utc * 1000).fromNow()}` }
          />
          <p>Author: { author }</p>
        </div>
        <div>
          <div className='modPage__link-content'>
            <div
              dangerouslySetInnerHTML={ { __html: bodyText } }
            />
          </div>
          { this.renderReportReasons(mod_reports) }
        </div>
      </div>
    );
  }

  renderReportReasons(reasons) {
    return (
      <div className='modPage__report-reasons'>
        <div className='modPage__report-title'>
          { reasons.length } report(s)
        </div>
        <div className=''>
          <ul className='modPage__report-list'>
            { reasons.map((r) => {
              return <li>{ r[0] } - { r[1] }</li>;
            }) }
          </ul>
        </div>
      </div>
    );
  }

  renderList(modqueue) {
    return modqueue.map((thing, i) => {
      if (thing._type === 'Link') {
        return this.renderModWrapper(this.renderLink(thing), i);
      }

      return this.renderModWrapper(this.renderComment(thing), i);
    });
  }

  renderModWrapper(child, index) {
    const { modSelected } = this.state;

    const selectedClass = modSelected.includes(index) ?
      'selected' : '';

    return (
      <div className='thing-wrapper'>
        <div className='thing-wrapper__input-wrap'>
          <div
            data-index={ index }
            className={ `thing-wrapper__input ${selectedClass}` }
            onClick={ this.addOrRemoveAction }
          />
        </div>
        <div className='thing-wrapper__thing-wrap'>
          { child }
        </div>
      </div>
    );
  }

  addOrRemoveAction(e) {
    const index = parseInt(e.target.dataset.index);
    const selected = this.state.modSelected.slice();

    if (selected.includes(index)) {
      this.setState({ modSelected:  selected.filter((i) => i !== index)});
    } else {
      selected.push(index);
      this.setState({ modSelected: selected });
    }
  }

  renderActions() {
    const actionList = ACTIONS.map((action, i) => {
      return (
        <button
          key={ `action${i}` }
          className='modPage__action-btn'
          onClick={ this[action] }
          children={ action }
        />
      );
    });

    return (
      <div className='modPage__actions-wrapper'>
        { actionList }
      </div>
    );
  }

  render() {
    const props = this.props;
    // const { compact, ctx, subreddit } = props;

    const { modqueue } = this.state.data;

    if (!modqueue) {
      return (
        <Loading />
      );
    }

    const list = this.renderList(modqueue);

    return (
      <div className='container'>
        <div>
          { this.renderActions() }
        </div>
        { list }
      </div>
    );
  }
}

export default ModPage;
