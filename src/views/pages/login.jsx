import React from 'react';
import querystring from 'querystring';
import has from 'lodash/object/has';
import includes from 'lodash/collection/includes';
import superagent from 'superagent';

const T = React.PropTypes;

import constants from '../../constants';

import BasePage from './BasePage';
import SnooIconHeader from '../components/snooiconheader';
import Modal from '../components/Modal';
import ForgotPassword from '../components/forgotpassword';

import MinimalInput from '../components/formElements/minimalinput';
import SquareButton from '../components/formElements/SquareButton';

const ERROR_MESSAGES = {
  504: 'Sorry, it took too long for the server to respond',
  500: 'Sorry, something has gone wrong with the server',
  WRONG_PASSWORD: 'Sorry, that’s not the right password',
  DEFAULT: 'Sorry, Something has gone wrong and we\'re not sure what',
};

const PASS_FIELD_TYPES = {
  password: 'password',
  text: 'text',
};

const PLACEHOLDER_TXT = {
  REGISTER: {
    USERNAME: 'Choose a unique username',
    PASSWORD: 'Choose a unique password',
    EMAIL: 'Your email',
  },
  LOGIN: {
    USERNAME: 'Username',
    PASSWORD: 'Password',
  },
};

const EMAIL_ERRORS = [
  'BAD_EMAIL',
];

const PASS_ERRORS = [
  'PASSWORD_MATCH',
  'WRONG_PASSWORD',
  'SHORT_PASSWORD',
  'BAD_PASSWORD',
  'BAD_PASSWORD_MATCH',
];

const USER_ERRORS = [
  'USER_DOESNT_EXIST',
  'USERNAME_TAKEN',
  'USERNAME_INVALID_CHARACTERS',
  'USERNAME_TOO_SHORT',
  'USERNAME_TAKEN_DEL',
];

const ERROR_TYPES = [
  ...EMAIL_ERRORS,
  ...USER_ERRORS,
  ...PASS_ERRORS,
];

const terms = (
  <a
    href='/help/useragreement'
    className='text-link'
    target='_blank'
  >
    { 'Terms ' }
  </a>
);
const privacy = (
  <a
    href='/help/privacypolicy'
    className='text-link'
    target='_blank'
  >
    { 'Privacy Policy ' }
  </a>
);
const content = (
  <a
    href='/help/contentpolicy/'
    className='text-link'
    target='_blank'
  >
    { 'Content Policy' }
  </a>
);

class LoginPage extends BasePage {
  static propTypes = {
    error: T.string,
    message: T.string,
    originalUrl: T.string,
    mode: T.string.isRequired,
    app: T.object.isRequired,
  };

  defaultProps = {
    originalUrl: '/',
  };

  static modes = {
    register: 'REGISTER',
    login: 'LOGIN',
  };

  constructor(props) {
    super(props);
    const { error,
            message,
            username,
            password,
            email } = props;

    this.state = {
      ...this.state,
      showForgot: false,
      passwordFieldType: PASS_FIELD_TYPES.password,
      errorMessage: error ? message ||
                    ERROR_MESSAGES[error] ||
                    ERROR_MESSAGES.DEFAULT : '',
      username: username || '',
      password: password || '',
      email: email || '',
      error: this.parseError(error),
    };

    this.goBack = this.goBack.bind(this);
    this.toggleShowForgot = this.toggleShowForgot.bind(this);
    this.updateUsername = this.updateField.bind(this, 'username');
    this.updatePassword = this.updateField.bind(this, 'password');
    this.updateEmail = this.updateField.bind(this, 'email');
    this.clearPassword = this.clearField.bind(this, 'password');
    this.clearUsername = this.clearField.bind(this, 'username');
    this.clearEmail = this.clearField.bind(this, 'email');
    this.toggleType = this.toggleType.bind(this);
    this.doAction = this.doAction.bind(this);
    this.renderClear = this.renderClear.bind(this);
    this.handleErrors = this.handleErrors.bind(this);
  }

  parseError(error) {
    const err = {
      username: includes(USER_ERRORS, error),
      password: includes(PASS_ERRORS, error),
      email: includes(EMAIL_ERRORS, error),
    };

    if (!includes(err, true)) {
      err.global = true;
    }

    return err;
  }

  goBack() {
    this.props.app.redirect(this.props.originalUrl);
  }

  updateField(name, e) {
    const newState = {
      [name]: e.target.value,
    };

    if (this.state.error[name]) {
      newState.error = {
        ...this.state.error,
        [name]: false,
      };
    }

    this.setState(newState);
  }

  clearField(name, e) {
    e.preventDefault();
    const newState = {
      [name]: '',
    };

    if (this.state.error[name]) {
      newState.error = {
        ...this.state.error,
        [name]: false,
      };
    }

    this.setState(newState);
  }

  toggleShowForgot(e) {
    if (e) { e.preventDefault(); }
    this.setState({showForgot: !this.state.showForgot});
  }

  toggleType(e) {
    e.preventDefault();
    const { passwordFieldType } = this.state;
    this.setState({
      passwordFieldType: passwordFieldType === PASS_FIELD_TYPES.password ?
        PASS_FIELD_TYPES.text : PASS_FIELD_TYPES.password,
    });
  }

  async doAction(e) {
    e.preventDefault();
    const { app, originalUrl, mode } = this.props;
    const action = mode.toLowerCase();
    const uri = `/${action}`;

    const { username, password, email } = this.state;

    const data = {
      username,
      password,
    };

    if (email) {
      data.email = email;
    }

    try {
      const res = await this.makeRequest(uri, data);

      // do some redirection here.
      if (res && res.body) {
        const { token } = res.body.token;

        app.setState('ctx', {
          ...app.getState('ctx'),
          token: token.access_token,
          tokenExpires: token.expires_at,
        });

        app.setTokenRefresh(app, token.expires_at);

        const loginFlag = `loginAction=${action}`;
        if (originalUrl) {
          const success = includes(originalUrl, '?') ?
            `&${loginFlag}` : `?${loginFlag}`;
          return app.redirect(`${originalUrl}${success}`);
        }
        app.redirect(`/?loginAction=success`);
      }
    } catch (e) {
      // Timeout just gives us a stupid error object
      // with name/message properties we don't care about.
      if (e.timeout) {
        e.error = 504;
        delete e.message;
      }
      this.handleErrors(e);

      const eventProps = {
        ...this.props,
        name: username,
        process_notes: includes(ERROR_TYPES, e.error) ? e.error : null,
        successful: false,
      };

      if (email) {
        eventProps.email = email;
      }

      app.emit(`${action}:attempt`, eventProps);
    }
  }

  handleErrors(e) {
    const newError = this.parseError(e.error || e.name);


    // TODO: once we have toasts use that instead.
    // if (newError.global) {
    //   // set global error
    // }

    const message = e.message || ERROR_MESSAGES[e.error];
    this.setState({ error: newError, errorMessage: message });
  }

  makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      superagent
        .post(endpoint)
        .type('json')
        .send(data)
        .timeout(constants.DEFAULT_API_TIMEOUT)
        .end((err, res) => {
          if (err) {
            if (has(res, 'body.error')) {
              return reject(res.body);
            }
            return reject(err);
          }
          return resolve(res);
        });
    });
  }

  renderLoginRegisterLink(mode, originalUrl) {
    const linkDest = originalUrl ?
      `/?${querystring.stringify({originalUrl})}` : '';

    let text = 'New user? Sign up!';
    let url = '/register';
    if (mode === LoginPage.modes.register) {
      text = 'Already have an account? Log in!';
      url = '/login';
    }

    return (
      <p className='login__register-link'>
        <a
          href={ url + linkDest }
        >{ text }</a>
      </p>
    );
  }

  renderTerms(terms, privacy, content) {
    return (
      <div className='login__terms'>
        By signing up, you agree to our { terms }
        and that you have read our { privacy }
        and { content }.
      </div>
    );
  }

  renderShowForgot(toggle) {
    return (
      <a
        href='#'
        className='pull-right login__forgot-link'
        onClick={ toggle }
      >
        Forgot?
      </a>
    );
  }

  renderRegisterStuff(text, update, err, message) {
    return (
        <MinimalInput
          name='email'
          type='text'
          placeholder={ PLACEHOLDER_TXT.REGISTER.EMAIL }
          onChange={ update }
          value={ text }
          error={ err.email ? message : '' }
        >
          { err.email ? this.renderClear('clearEmail'): null }
        </MinimalInput>
    );
  }

  renderClear(methodName) {
    return (
      <button
        type='button'
        className='login__input-action-btn'
        onClick={ this[methodName] }
      >
        <span className='icon-x' />
      </button>
    );
  }

  renderEye(blue, toggle) {
    return (
      <button
        type='button'
        className={ `login__input-action-btn ${blue}` }
        onClick={ toggle }
      >
        <span className='icon-eye' />
      </button>
    );
  }

  render () {
    const { originalUrl, ctx, app, mode } = this.props;
    const { passwordFieldType, showForgot, errorMessage,
            password, username, email, error } = this.state;
    const registerMode = (mode === LoginPage.modes.register);

    const action = registerMode ? 'Sign Up' : 'Log in';
    const formUri = registerMode ? '/register' : '/login' ;
    const blue = passwordFieldType === 'text' ? 'blue' : '';

    let forgotPassword;
    if (showForgot) {
      forgotPassword = (
        <Modal open={ true } close={ this.toggleShowForgot }>
          <ForgotPassword app={ app } close={ this.toggleShowForgot }/>
        </Modal>
      );
    }

    const globalError = error.global ?
      (<p className='inputMinimal__error-text'>{ errorMessage }</p>) : null;

    return (
      <div className='login__wrapper'>
        <SnooIconHeader title={ action } close={ this.goBack } />
        <div className='container'>
          <div className='row'>
            <div className='col-xs-12 col-sm-6 login'>
              { this.renderLoginRegisterLink(mode, originalUrl) }
              { globalError }
              <form
                action={ formUri }
                method='POST'
                onSubmit={ this.doAction }
              >
                <MinimalInput
                  name='username'
                  type='text'
                  placeholder={ PLACEHOLDER_TXT[mode].USERNAME }
                  showTopBorder={ true }
                  onChange={ this.updateUsername }
                  value={ username }
                  error={ error.username ? errorMessage : '' }
                >
                  { error.username ? this.renderClear('clearUsername'): null }
                </MinimalInput>
                <MinimalInput
                  name='password'
                  type={ passwordFieldType }
                  placeholder={ PLACEHOLDER_TXT[mode].PASSWORD }
                  showTopBorder={ false }
                  error={ error.password ? errorMessage : '' }
                  onChange={ this.updatePassword }
                  value={ password }
                >
                  { error.password ? this.renderClear('clearPassword') :
                                     this.renderEye(blue, this.toggleType) }
                </MinimalInput>
                <input
                  type='text'
                  name='password2'
                  value={ password }
                  className='hidden'
                />
                { registerMode ? this.renderRegisterStuff(email,
                                                          this.updateEmail,
                                                          error,
                                                          errorMessage) : null }
                <input
                  name='_csrf'
                  type='hidden'
                  value={ ctx.csrf }
                />
                <input
                  name='originalUrl'
                  type='hidden'
                  value={ originalUrl || '/' }
                />
                { !registerMode ?
                    this.renderShowForgot(this.toggleShowForgot) : null }
                <div className='login__submit-btn'>
                  <SquareButton text={ action.toUpperCase() } type='submit'/>
                </div>
              </form>
            </div>
          </div>
          { registerMode ? this.renderTerms(terms, privacy, content): null }
        </div>
        { forgotPassword }
      </div>
    );
  }
}

export default LoginPage;
