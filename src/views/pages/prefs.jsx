import React from 'react';

import { models } from 'snoode';

import BasePage from './BasePage';
import Loading from '../components/Loading';
import BaseComponent from '../components/BaseComponent';

import userOptions, { goldOptions } from '../../userPreferencesFields';

class Toggle extends BaseComponent {
  constructor(props) {
    super(props);

    this.state.status = props.status;
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    const { onChange, formKey } = this.props;
    const val = !this.state.status;
    if (onChange) {
      onChange(null, val, formKey);
    }
    this.setState({status: val});
  }

  render() {

    let toggleClass;
    if (this.state.status) {
      toggleClass = 'selected';
    }

    return (
      <div className={ `prefs-toggle-bar ${toggleClass}` } onClick={ this.onClick } >
        <div className='prefs-toggle-circle'/>
      </div>
    );
  }
}

class PrefsPage extends BasePage {
  constructor(props) {
    super(props);

    this.state.changes = {};

    this.addChange = this.addChange.bind(this);
    this.updatePrefs = this.updatePrefs.bind(this);
  }

  async updatePrefs () {
    var { app, apiOptions } = this.props;
    let options = app.api.buildOptions(apiOptions);

    const changes = {...this.state.changes};
    options = Object.assign(options, {
      model: new models.Preferences(changes),
      changeSet: Object.keys(changes),
    });

    try {
      let res = await app.api.preferences.patch(options);

      if (res._type === 'Preferences') {
        this.setState({changes: {}});
        app.redirect('/prefs');
      }
    } catch (e) {
      app.error(e, this, app, { redirect: false, replaceBody: false });
    }
  }

  addChange(e, val, key) {
    if (e) {
      val = e.currentTarget.value.trim();
      key = e.currentTarget.dataset.key;
    }

    let oldChanges = {...this.state.changes};
    oldChanges[key] = val;
    this.setState({ changes: oldChanges });
  }

  makeBoolField(preferences, pref) {
    let info;
    if (pref.description) {
      info = <p>{ pref.description }</p>;
    }

    return (
      <div className='' key={ pref.key } style={ {padding: '10px'} }>
        <label className='' htmlFor={ pref.key } >{ pref.key.replace('_', ' ') }</label>
        <Toggle
          status={ preferences[pref.key] }
          onChange={ this.addChange }
          formKey={ pref.key }
        />

        { info }
      </div>
    );
  }

  makeSelect(preferences, pref) {
    const selected = preferences[pref.key];
    const options = pref.options.map((option) => {
      const text = typeof option === 'string' ||
                   typeof option === 'number' ? option : option.key;

      return (
        <option value={ text } >{ text }</option>
      );
    });

    return (
      <div className='prefs-select-wrap'>
        <label> { pref.description } </label>
        <select
          className='form-control'
          onChange={ this.addChange }
          data-key={ pref.key }
          defaultValue={ selected }
        >
          { options }
        </select>
      </div>
    );
  }

  makeRange(preferences, pref) {
    return (
      <div className='prefs-number-wrap'>
        <label> { pref.description } </label>
        <input
          data-key={ pref.key }
          onChange={ this.addChange }
          className='form-control'
          type='number'
          defaultValue={ preferences[pref.key] }
          min={ pref.min }
          max={ pref.max }
        />
      </div>
    );
  }

  makeHeading(title) {
    return (
      <h3>{ title }</h3>
    );
  }

  buildField(pref, preferences) {
    const key = pref.key;
    const val = pref.type || typeof preferences[key];

    if (pref.depends && !preferences[pref.depends]) {
      return null;
    }

    switch (val) {
      case 'section_title':
        return this.makeHeading(pref.title);
      case 'boolean':
        return this.makeBoolField(preferences, pref);
      case 'select':
        return this.makeSelect(preferences, pref);
      case 'range':
        return this.makeRange(preferences, pref);
    }
  }

  buildForm() {
    const { preferences, user } = this.state.data;
    // check if user has gold for gold options
    let options = userOptions.slice();
    if (user.is_gold) {
      options.push(goldOptions);
    }

    const fields = options.map((pref) => {
      return this.buildField(pref, preferences);
    });

    return (
      <div>
        { fields }
      </div>
    );
  }

  render() {
    const { data } = this.state;
    if (!data || !data.preferences || !data.user) {
      return <Loading />;
    }

    const form = this.buildForm();
    return (
      <div className='container'>
        <div className='row'>
          <div className='col-xs-12 col-sm-12 prefs-form-wrap'>
              { form }
              <button
                className="btn btn-primary pull-right"
                onClick={ this.updatePrefs }
              >Save</button>
          </div>
        </div>
      </div>
    );
  }
}

export default PrefsPage;
