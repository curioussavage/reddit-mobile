import React from 'react';
import ReactServerDom from 'react-dom/server';
import { Provider } from 'react-redux';

import App from '../../app';
import manifest from '../../../build/manifest';
import config from 'config';
import { themeClass } from './themeClass';
import createCanonicalLinkFromState from 'lib/createCanonicalLinkFromState';
import createAmpHtmlLinkFromState from 'lib/createAmpHtmlLinkFromState';
import safeStringify from 'lib/safeStringify';

const env = process.env.NODE_ENV || 'production';
const CLIENT_NAME = env === 'production' ? 'ProductionClient' : 'Client';
const CSS_FILE = manifest[`${CLIENT_NAME}.css`];
const JS_FILE = manifest[`${CLIENT_NAME}.js`];
const { assetPath } = config;

export default function(data, store) {
  const state = store.getState();

  const canonicalLink = !state.platform.shell
    ? createCanonicalLinkFromState(state)
    : null;

  const ampLink = !state.platform.shell
    ? createAmpHtmlLinkFromState(state)
    : null;

  return ReactServerDom.renderToStaticMarkup(
    <html lang='en'>
      <head>
        <title>{ state.pageMetadata.title }</title>
        <meta charSet='utf8'/>
        <meta name='viewport' content='width=device-width, initial-scale=1'/>
        <meta name="apple-itunes-app" content="app-id=1064216828" />
        <link rel='stylesheet' href={ `${assetPath}/${CSS_FILE}` } />
        <link href={ `${assetPath}/favicon/64x64.png` } rel="icon shortcut" sizes="64x64" />
        <link href={ `${assetPath}/favicon/128x128.png` } rel="icon shortcut" sizes="128x128" />
        <link href={ `${assetPath}/favicon/192x192.png` } rel="icon shortcut" sizes="192x192" />
        <link href={ `${assetPath}/favicon/76x76.png` } rel="apple-touch-icon" sizes="76x76" />
        <link href={ `${assetPath}/favicon/120x120.png` } rel="apple-touch-icon" sizes="120x120" />
        <link href={ `${assetPath}/favicon/152x152.png` } rel="apple-touch-icon" sizes="152x152" />
        <link href={ `${assetPath}/favicon/180x180.png` } rel="apple-touch-icon" sizes="180x180" />
        { canonicalLink ? <link rel='canonical' href={ canonicalLink }/> : null }
        { ampLink ? <link rel='amphtml' href={ ampLink }/> : null }
      </head>
      <body className={ themeClass(data.theme) }>
        <div
          id='container'
          dangerouslySetInnerHTML={ {
            __html: ReactServerDom.renderToString(
              <Provider store={ store }>
                <App />
              </Provider>
            ),
          } }
        />
        <script
          id='data'
          dangerouslySetInnerHTML={ {
            __html: `window.___r = ${safeStringify(data)}`,
          } }
        ></script>
        <script async type='text/javascript' src={ `${assetPath}/${JS_FILE}` } />
      </body>
    </html>
  );
}
