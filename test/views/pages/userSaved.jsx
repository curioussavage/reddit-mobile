import chai from 'chai';
import sinonChai from 'sinon-chai';

import shallowHelpers from 'react-shallow-renderer-helpers';
import renderWithProps from '../../helpers/renderWithProps';

import { UserSavedPage, Loading, ListingContainer } from '../../helpers/components';

const expect = chai.expect;
chai.use(sinonChai);

describe('UserSaved page', () => {
  let ctx;

  beforeEach('render and find element', () => {
    const extraProps = {
      actionName: 'saved',
      userName: 'test',
    };
    ctx = renderWithProps(extraProps, UserSavedPage);
  });

  it('displays loading component when activities is not defined', () => {
    expect(ctx.result.type).to.equal(Loading);
  });

  describe('When data is resolved but there are no saved items', () => {

    beforeEach(() => {
      ctx.instance.setState({
        data: {
          activities: [],
        },
        loaded: true,
      });
      ctx.result = ctx.renderer.getRenderOutput();
    });

    it('should render only a message', () => {
      expect(ctx.result.props.className).to.equal('alert alert-info vertical-spacing-top');
    });
  });

  describe('When data is resolved with activities', () => {

    beforeEach(() => {

      ctx.instance.setState({
        data: {
          activities: [{title: 'hello world'}],
        },
        loaded: true,
      });
      ctx.result = ctx.renderer.getRenderOutput();
    });

    it('should render ListingList', () => {
      const listingContainer = shallowHelpers.findType(ctx.result, ListingContainer);
      expect(listingContainer).to.not.equal(undefined);
    });
  });
});
