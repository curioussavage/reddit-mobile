import merge from 'platform/merge';
import * as platformActions from 'platform/actions';
import * as replyActions from 'app/actions/reply';
import * as commentActions from 'app/actions/comment';
import * as modActions from 'app/actions/modTools';
import * as toasterActions from 'app/actions/toaster';
import * as postActions from 'app/actions/posts';
import * as postingActions from 'app/actions/posting';
import * as reportingActions from 'app/actions/reporting';
import * as mailActions from 'app/actions/mail';
import * as modToolsActions from 'app/actions/modTools';
import * as votingActions from 'app/actions/vote';
import * as optOuts from 'app/actions/optOuts';

const DEFAULT = {
  isOpen: false,
  type: null,
  message: null,
};

export const GENERIC_ERROR = 'Something went wrong.';

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case replyActions.FAILURE:
    case commentActions.FAILED_UPDATE_BODY:
    case mailActions.FAILED_MESSAGE:
    case modActions.MODTOOLS_DISTINGUISH_ERROR:
    case modToolsActions.MODTOOLS_TOGGLE_LOCK_FAILURE:
    case modToolsActions.MODTOOLS_TOGGLE_NSFW_FAILURE:
    case modToolsActions.MODTOOLS_TOGGLE_SPOILER_FAILURE:
    case modActions.MODTOOLS_SET_STICKY_POST_ERROR:
    case modActions.MODTOOLS_SET_STICKY_COMMENT_ERROR:
    case postActions.FAILED_UPDATE_SELF_TEXT:
    case postingActions.FAILURE:
    case postingActions.VALIDATION_FAILURE:
    case reportingActions.FAILURE:
    case toasterActions.TYPES.ERROR:
    case votingActions.FAILURE: {
      return merge(state, {
        isOpen: true,
        type: toasterActions.TYPES.ERROR,
        message: action.message || GENERIC_ERROR,
      });
    }

    case toasterActions.TYPES.SUCCESS:
    case reportingActions.SUCCESS: {
      return merge(state, {
        isOpen: true,
        type: toasterActions.TYPES.REPORT_SUCCESS,
        message: action.message,
      });
    }

    case optOuts.OPTOUT_SET:
    case toasterActions.TYPES.REPORT_SUCCESS:
    case replyActions.SUCCESS: {
      return merge(state, {
        isOpen: true,
        type: toasterActions.TYPES.SUCCESS,
        message: action.message,
      });
    }

    case platformActions.SET_PAGE:
    case toasterActions.CLOSE: {
      return merge(state, {
        isOpen: false,
        type: null,
        message: null,
      });
    }

    default:
      return state;
  }
}
