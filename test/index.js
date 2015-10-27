const mocha = require('mocha');

mocha.test();

// lib
require('./lib/titleCase');
require('./lib/formatDifference');

// Even with shallow rendering react currently looks for document when setState is used.
// see https://github.com/facebook/react/issues/4019
global.document = {};

// components
require('./views/components/Modal');


//Layouts
require('./views/layouts/BodyLayout');

// pages
require('./views/pages/Index');
