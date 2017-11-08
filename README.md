[![CircleCI](https://circleci.com/gh/METASPACE2020/sm-webapp/tree/master.svg?style=svg)](https://circleci.com/gh/METASPACE2020/sm-webapp/tree/master)

# sm-webapp

Web application for browsing results produced by [sm-engine](https://github.com/metaspace2020/sm-engine).

## Installation

* Clone the repository with `--recursive` flag.
* Run `yarn install`
* Create `conf.js` using the provided `conf.js.template` (used by the backend, all secrets are kept here)
* Create `src/clientConfig.json` using the provided template (this is used by the frontend)
* Run `node deref_schema.js > src/assets/metadata_schema.json` (FIXME: do it through webpack)

## Running in development mode

```bash
NODE_ENV=development nodemon server.js
```

This will take care of hot reloading after both server and client code changes.

## Running in production

First, execute `yarn run build` to get the minified bundles in the `dist/` directory.

Then set `NODE_ENV` accordingly and run `server.js`, e.g.
```bash
NODE_ENV=production forever start -l forever.log -o out.log -e err.log -c "nodemon --exitcrash" server.js
```
