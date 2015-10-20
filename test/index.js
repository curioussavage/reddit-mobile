require('babel/register')({
  ignore: false,
  only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
  extensions: ['.js', '.es6.js', '.jsx' ],
  sourceMap: true,
  stage: 0
});

var sinon = require('sinon');

beforeEach(function() {
  this.sinon = sinon.sandbox.create();
});

afterEach(function(){
  this.sinon.restore();
});

// lib
require('./lib/titleCase');
require('./lib/formatDifference');

// Even with shallow rendering react currently looks for document when setState is used.
// see https://github.com/facebook/react/issues/4019
global.document = {};

// components
require('./views/components/Modal');
require('./views/components/Ad');


//Layouts
require('./views/layouts/BodyLayout');

// pages
require('./views/pages/Index');
require('./views/pages/userSaved');
