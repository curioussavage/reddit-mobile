## Requirements

* NodeJS v4.0+ (production runs on 4.1.2 
* NPM v3.10+
* macOS or Linux (not tested on Windows)

## Quick start

We use NPM scripts for all development related tasks.

### git

The main git branch is **2X**

We use rebasing in order to avoid merge commits.

#### Hooks

  We have pre-commit/push hooks in the `hooks` directory to help enforce our linting rules and tests. Developers are highly encouraged to use them.

### Configure your dev envirnoment

We use a shell script to run the app so we can define needed environment variables. By convention we call it `start.sh`. This file is already in our `.gitignore`.

`touch start.sh`  

`chmod +x start.sh`  

#### Example `start.sh`

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

### Install

`npm install`

### Build/watch

*watch* - `npm run watch`  
*build* - `npm run build`

### running the app

Instead of running the npm script that starts the server make sure to use your `start.sh` with the appropriate keys so you can log in.

`./start.sh`

## Debugging

Aside from the current [node debugger](https://nodejs.org/api/debugger.html#debugger_debugger) you 
may use the experimental v8 inspector which allows you to use chrome dev tools to debug node and
browser code by doing the following:

* install Chrome Canary ([follow this guide to activate the dev tools feature](https://blog.hospodarets.com/nodejs-debugging-in-chrome-devtools)) 
* install node v6.6.* or higher.
* add `dev-inspect-server` npm script to your `start.sh` and restart.

