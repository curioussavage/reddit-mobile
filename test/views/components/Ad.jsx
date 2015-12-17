import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import shallowHelpers from 'react-shallow-renderer-helpers';
import renderWithProps from '../../helpers/renderWithProps';

import { Ad, Listing } from '../../helpers/components';

var expect = chai.expect;
chai.use(sinonChai);

describe('Ad', () => {
  var ctx;

  beforeEach('render and find element', () => {
    ctx = renderWithProps({compact: true, afterLoad: () =>{}}, Ad);
  });

  it('should render null when there is no ad', () => {
    expect(ctx.result).to.equal(null);
  });

  describe('Ad is loaded', () => {
    beforeEach(() => {
      console.log(ctx.instance.setState);
      ctx.instance.setState({
        loaded: true,
        ad: {_type: 'link'},
      });
      ctx.result = ctx.renderer.getRenderOutput();
    });

    it('renders a Listing component', () => {
      console.log('reuslt is  \n\n\n',ctx.result);
      expect(ctx.result.type).to.equal(Listing);
    });
  });

});
