import React from 'react';
import { models } from 'snoode';

import MessageNav from '../components/MessageNav';
import BasePage from './BasePage';
import CaptchaBox from '../components/CaptchaBox';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

const emptyError = {
  type: '',
  message: '',
  fields: [],
};

class MessageComposePage extends BasePage {
  constructor(props) {
    super(props);

    Object.assign(this.state, {
      captchaIden: '',
      captchaAnswer: '',
      requiresCaptcha: false,
      captchaCount: 0,
      error: emptyError,
    });

    this.sendMessage = this.sendMessage.bind(this);
    this.updateCaptchaInfo = this.updateCaptchaInfo.bind(this);
  }

  async sendMessage (e) {
    e.preventDefault();
    const { requiresCaptcha, captchaIden,
         captchaAnswer, captchaCount } = this.state;
    const { app, apiOptions } = this.props;

    const fields = this.getFields();
    if (fields.from === 'user') {
      delete fields.from;
    }

    if (requiresCaptcha) {
      fields.iden = captchaIden;
      fields.captcha = captchaAnswer;
    }

    const message = new models.Message(fields);
    let options = app.api.buildOptions(apiOptions);

    options = Object.assign(options, {
      model: message,
    });

    const validatorResult = options.model.validate();

    if (validatorResult !== true) {
      this.setState({
        error: {
          type: 'Incomplete:',
          message: 'all fields must be filled out.',
          fields: validatorResult,
        },
      });
      return;
    }


    try {
      const res = await app.api.messages.post(options);

      if (res) {
        this.resetFields();
        this.setState({
          captchaIden: '',
          captchaAnswer: '',
          requiresCaptcha: false,
          captchaCount: 0,
          error: emptyError,
        });

        app.emit('message', message);
      }
    } catch (res) {
      const error = res.errors[0] || res;
      if (res.captcha) {

        const newState = {
          captchaIden: res.captcha,
          captchaAnswer: '',
          requiresCaptcha: true,
          captchaCount: captchaCount + 1,
          error: {
            type: error[0],
            message: error[1],
            fields: [],
          },
        };

        this.setState(newState);

      } else {
        this.setState({
          error: {
            type: error[0] || res,
            message: error[1] || '',
            fields: [],
          },
        });
      }
    }
  }

  renderForm () {
    const { data, error, captchaIden, captchaAnswer,
          captchaCount, requiresCaptcha } = this.state;
    const { app, apiOptions, config } = this.props;

    let captcha;
    const showCaptchaError = (captchaCount > 1 && error.type === 'BAD_CAPTCHA');

    if (requiresCaptcha) {
      captcha = (
        <Modal open={ true } >
          <div className='Submit-captcha-heading' >
            <span>Ok, one more thing. You're human right?</span>
          </div>
          <CaptchaBox
            api={ app.api }
            apiOptions={ apiOptions }
            config={ config }
            cb={ this.updateCaptchaInfo }
            iden={ captchaIden }
            answer={ captchaAnswer }
            action={ this.sendMessage }
            actionName={ 'Send' }
            error={ showCaptchaError }
          />
        </Modal>
      );
    }

    const classes = {
      to: '',
      subject: '',
      text: '',
    };
    let alertClass = 'visually-hidden';
    let alertText = '';

    if (error.type && error.type !== 'BAD_CAPTCHA') {
      switch (error.type) {
        // for errors on specfic fields
        case 'Incomplete:':
          error.fields.map((field) => {
            classes[field] = 'has-error';
          });
          break;
      }
      alertText = `${error.type} ${error.message}`;
      alertClass = 'alert alert-danger alert-bar Submit-alert-bar';
    }

    const options = data.subreddit.map(function(sub) {
      return (
        <option value={ sub.display_name }>{ sub.url.substring(0, sub.url.length - 1) }</option>
      );
    });
    options.unshift(<option value='user'>{ data.user.name }</option>);

    return (
      <form
        className='messageCompose'
        action='/message'
        method='POST'
      >
        { captcha }
        <div className={ alertClass } role='alert'>
          <div className='Submit-centered'>
            { alertText }
          </div>
        </div>
        <div className={ `messageCompose__input-wrapper ${classes.to}` } >
          <span className='messageCompose__label'>to:</span>
          <input
            ref='to'
            placeholder="username or /r/name for a subreddit's mods"
            className='messageCompose__input'
            type='text'
          />
        </div>
        <div className={ `messageCompose__input-wrapper ${classes.subject}` }>
          <span className='messageCompose__label'>subject:</span>
          <input
            ref='subject'
            className='messageCompose__input long'
            type='text'
          />
        </div>
        <div className={ `messageCompose__text-wrap ${classes.text}` }>
          <textarea
            ref='text'
            placeholder='Enter witty message here.'
            className='messageCompose__textarea'
          ></textarea>
        </div>
        <div>
          <div className='messageCompose__from-wrap' >
            <span>from: </span>
            <select
              className='messageCompose__select'
              ref='from'
            >
              { options }
            </select>
          </div>
          <button
            className='messageCompose__footer-btn'
            type='submit'
            onClick={ this.sendMessage }
          >Send</button>
        </div>
      </form>
    );
  }

  getFields() {
    const { refs } = this;
    return {
      text: refs.text.value.trim(),
      subject: refs.subject.value.trim(),
      to: refs.to.value.trim(),
      from: refs.from.value.trim(),
    };
  }

  resetFields() {
    const { refs } = this;
    refs.text.value = '';
    refs.subject.value = '';
    refs.to.value = '';
  }

  updateField (fieldName) {
    const newState = {};
    newState[fieldName] = this.refs[fieldName].getDOMNode().value;
    this.setState(newState);
  }

  updateCaptchaInfo (info) {
    this.setState({
      captchaIden: info.iden,
      captchaAnswer: info.answer,
    });
  }

  render () {
    const { data } = this.state;
    if (!data || !data.subreddit) {
      return (<Loading />);
    }

    const form = this.renderForm();

    return (
      <div>
        <MessageNav user={ data.user } view='compose' />
        { form }
      </div>
    );
  }
}

export default MessageComposePage;
