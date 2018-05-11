import { SHOW_CTA, HIDE_CTA, SET_LINK, DETECT_WEB_SHARE_CAPABILITY } from 'app/actions/sharing';

const DEFAULT = {
  visible: false,
  link: null,
  post: null,
  pending: false,
  hasWebShare: false,
};

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case DETECT_WEB_SHARE_CAPABILITY:
      return { ...state, hasWebShare: action.result };
    case SHOW_CTA:
      return { ...state, post: action.post, link: null, visible: true };
    case HIDE_CTA:
      return { ...state, post: null, visible: false };
    case SET_LINK:
      return { ...state, link: action.link };
    default:
      return state;
  }
}