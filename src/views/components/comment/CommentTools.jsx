import React from 'react';

import CommentDropdownContent from './CommentDropdownContent';
import DropdownController from '../dropdown/DropdownController';

const T = React.PropTypes;

function scoreText(score, scoreHidden) {
  if (scoreHidden) {
    return '–';
  } else if (score < 1000) {
    return `${score}`;
  } else if (score < 1100) {
    return '1k';
  }
  
  return `${(score/1000).toFixed(1)}k`;
}

export default class CommentTools extends React.Component {
  static propTypes = {
    score: T.number.isRequired,
    app: T.object.isRequired,
    commentAuthor: T.string.isRequired,
    username: T.string, // The user's name
    scoreHidden: T.bool,
    voteDirection: T.number,
    saved: T.bool,
    permalinkUrl: T.string,
    onToggleReplyForm: T.func,
    onUpvote: T.func,
    onDownvote: T.func,
    onEditComment: T.func,
    onDeleteComment: T.func,
    onGildComment: T.func,
    onShareComment: T.func,
    onSaveComment: T.func,
    onGotoUserProfile: T.func,
    onReportComment: T.func,
  };
  
  static defaultProps = {
    voteDirection: 0,
    scoreHidden: false,
    saved: false,
    permalinkUrl: '',
    onToggleReplyForm: () => {},
    onUpvote: () => {},
    onDownvote: () => {},
    onEditComment: () => {},
    onDeleteComment: () => {},
    onGildComment: () => {},
    onShareComment: () => {},
    onSaveComment: () => {},
    onGotoUserProfile: () => {},
    onReportComment: () => {},
  };
  
  constructor(props) {
    super(props);
    
    this.state = {
      dropdownTarget: null,
    };
    
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.handleEditClicked = this.handleEditClicked.bind(this);
    this.handleDeleteClicked = this.handleDeleteClicked.bind(this);
    this.handleGildClicked = this.handleGildClicked.bind(this);
    this.handleShareClicked = this.handleShareClicked.bind(this);
    this.handleSaveClicked = this.handleSaveClicked.bind(this);
    this.handleProfileClicked = this.handleProfileClicked.bind(this);
    this.handleReportClicked = this.handleReportClicked.bind(this);
  }
  
  toggleDropdown(e) {
    this.setState({
      dropdownTarget: this.state.dropdownTarget ? null : e.target,
    });
  }
  
  handleEditClicked() {
    this.setState({dropdownTarget: null});
    this.props.onEditComment();
  }
  
  handleDeleteClicked() {
    this.setState({dropdownTarget: null});
    this.props.onDeleteComment();
  }
  
  handleGildClicked() {
    this.setState({dropdownTarget: null});
    this.props.onGildComment();
  }
  
  handleShareClicked() {
    this.setState({dropdownTarget: null});
    this.props.onShareComment();
  }
  
  handleSaveClicked() {
    this.setState({dropdownTarget: null});
    this.props.onSaveComment();
  }
  
  handleProfileClicked() {
    this.setState({dropdownTarget: null});
    this.props.onGotoUserProfile();
  }
  
  handleReportClicked(reportReason) {
    this.setState({dropdownTarget: null});
    this.props.onReportComment(reportReason);
  }
  
  render() {
    const { dropdownTarget } = this.state;
    
    return (
      <div className='CommentTools'>
        { this.renderReply() }
        { this.renderSeashells() }
        { this.renderDivider() }
        { this.renderScore() }
        { this.renderUpvote() }
        { this.renderDownvote() }
        { dropdownTarget ? this.renderDropdown() : null }
      </div>
    );
  }
  
  renderReply() {
    return (
      <div
        className='CommentTools__reply icon-reply2'
        onClick={ this.props.onToggleReplyForm }
      />
    );
  }
  
  renderSeashells() {
    return (
      <div
        className='CommentTools__more icon-seashells'
        onClick={ this.toggleDropdown }
      />
    );
  }
  
  renderDivider() {
    return <div className='CommentTools__divider' />;
  }
  
  renderScore() {
    const { score, scoreHidden } = this.props;
    
    return <div className='CommentTools__score'>{ scoreText(score, scoreHidden) }</div>;
  }
  
  renderUpvote() {
    const { voteDirection } = this.props;
    
    let cls = 'CommentTools__upvote icon-upvote';
    if (voteDirection === 1) { cls += ' m-selected'; }
    
    return <div className={ cls } onClick={ this.props.onUpvote } />;
  }
  
  renderDownvote() {
    const { voteDirection } = this.props;
    
    let cls = 'CommentTools__downvote icon-downvote';
    if (voteDirection === -1) { cls += ' m-selected'; }
    
    return <div className={ cls } onClick={ this.props.onDownvote } />;
  }
  
  renderDropdown() {
    const { commentAuthor, username, app, saved, permalinkUrl } = this.props;
    const { dropdownTarget } = this.state;
    
    return (
      <DropdownController
        target={ dropdownTarget }
        onClose={ this.toggleDropdown }
        app={ app }
        offset={ 8 }
      >
        <CommentDropdownContent
          username={ commentAuthor }
          userOwned={ username === commentAuthor }
          userLoggedIn={ !!username }
          saved={ saved }
          permalinkUrl={ permalinkUrl }
          onEditClicked={ this.handleEditClicked }
          onDeleteClicked={ this.handleDeleteClicked }
          onGoldClicked={ this.handleGildClicked }
          onShareClicked={ this.handleShareClicked }
          onSaveClicked={ this.handleSaveClicked }
          onProfileClicked={ this.handleProfileClicked }
          onReportClicked={ this.handleReportClicked }
        />
      </DropdownController>
    );
  }
}
