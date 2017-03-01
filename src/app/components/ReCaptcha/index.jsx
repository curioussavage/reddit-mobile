import React from 'react';
import './styles.less';

const T = React.PropTypes;
const gRecaptchaUrl =
  'https://www.google.com/recaptcha/api.js?onload=grecaptchaOnLoad&render=explicit';

// A promise to serve as a barrier to ensure that we've loaded google's bits
const grecaptchaLoaded = new Promise(resolve => {
  // Safeguard against server rendering
  if (typeof window !== 'undefined') {
    window.grecaptchaOnLoad = resolve;
  }
});

class ReCaptcha extends React.Component {
  static propTypes = {
    elementId: T.string,
    sitekey: T.string.isRequired,
    reloadComparisonKey: T.string.isRequired,
    theme: T.oneOf(['light', 'dark']),
    type: T.oneOf(['image', 'audio']),
    size: T.oneOf(['normal', 'compact']),
    tabindex: T.number,
    onSuccess: T.func,
    onExpiration: T.func,
  };

  static defaultProps = {
    elementId: 'g-recaptcha',
    theme: 'light',
    type: 'image',
    size: 'normal',
    tabindex: 0,
  };

  async componentDidMount() {
    // _isMounted workaround is for when the promise in this func
    // completes after it is unmounted.
    this._isMounted = true;

    const {
      elementId,
      sitekey,
      theme,
      type,
      size,
      tabindex,
      onSuccess,
      onExpiration,
    } = this.props;

    if (!window.grecaptcha) {
      // If it's not loaded yet, let's do that...
      // Add the script to the DOM, causing it to load...
      const script = document.createElement('script');
      script.src = gRecaptchaUrl;
      document.body.appendChild(script);

      // ... wait for the promise to get resolved
      await grecaptchaLoaded;
    }

    if (this._isMounted) {
      window.grecaptcha.render(elementId, {
        sitekey,
        theme,
        type,
        size,
        tabindex,
        callback: onSuccess,
        'expired-callback': onExpiration,
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.reloadComparisonKey !== this.props.reloadComparisonKey) {
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    }
  }

  render() {
    const { elementId } = this.props;

    return (
      <div className='ReCaptcha' id={ elementId } />
    );
  }
}

export default ReCaptcha;
