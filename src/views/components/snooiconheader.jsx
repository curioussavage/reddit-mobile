import React from 'react';

const T = React.PropTypes;

function SnooIconHeader(props) {
  return (
    <div className='SnooIconHeader-wrapper'>
      <button className='SnooIconHeader-button' onClick={ props.close }>&times;</button>
      <div className='SnooIconHeader-icon-box'>
        <span className='icon-snoo-circled orangered icon-xxl' />
        <p className='SnooIconHeader-title'>{ props.title }</p>
      </div>
    </div>
  );
}

SnooIconHeader.propTypes = {
  close: T.func.isRequired,
  title: T.string.isRequired,
};

export default SnooIconHeader;
