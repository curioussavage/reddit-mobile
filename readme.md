### Quick start

1. Install npm dependencies:
  `git submodule init && git submodule update && npm install`
2. Build:
  `npm run build` (optionally watch for updates with `npm run watch`)
3. Run:
  dev: `npm run dev-server`
  production `npm run server`

### Configuring your dev envirnoment

Create a file in the root called `start.sh` and make it executable `chmod +x start.sh`.
This file is automatically ignore by git and you can use it to define environment variables start the server instead
of `npm run`.

#### Example start.sh

```sh
#!/bin/bash
GOOGLE_ANALYTICS_ID='UA-XXXXXX-1' \
LIVERELOAD=true \
DEBUG_LEVEL='info' \
OAUTH_CLIENT_ID=XXXXXXXXX \
SECRET_OAUTH_CLIENT_ID=XXXXXXXXX \
OAUTH_SECRET=XXXXXXXXX \
PROCESSES=2 \
API_PASS_THROUGH_HEADERS='accept-language' \
LOGIN_PATH="/login" \
MINIFY_ASSETS="false" \
STATSD_DEBUG="true" \
npm run dev-server
```

### debugging

Aside from the current [node debugger](https://nodejs.org/api/debugger.html#debugger_debugger) you 
may use the experimental v8 inspector which allows you to use chrome dev tools to debug node and
browser code by doing the following:

* install Chrome Canary ([follow this guide to activate the dev tools feature](https://blog.hospodarets.com/nodejs-debugging-in-chrome-devtools)) 
* install node v6.6.* or higher
* run `dev-inspect-server` npm script to start app

