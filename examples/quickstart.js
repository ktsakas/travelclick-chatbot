'use strict';

// Quickstart example
// See https://wit.ai/l5t/Quickstart

// When not cloning the `node-wit` repo, replace the `require` like so:
// const Wit = require('node-wit').Wit;
const Wit = require('../').Wit;

const token = (() => {
  /*if (process.argv.length !== 3) {
    console.log('usage: node examples/quickstart.js <wit-token>');
    process.exit(1);
  }*/
  return process.argv[2] || "2FK4QWEZEQJYRGTYZW2YS37XJNMDIHXT";
})();

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  say(sessionId, context, message, cb) {
    console.log(message);
    cb();
  },
  merge(sessionId, context, entities, message, cb) {
    // Retrieve the location entity and store it into a context field
    console.log(entities);
    const intent = firstEntityValue(entities, 'intent');
    if (intent) {
      context.intent = intent;
    }
    const loc = firstEntityValue(entities, 'location');
    if (loc) {
      context.loc = loc;
    }
    const price = firstEntityValue(entities, 'price');
    if (price) {
      context.price = price;
    }
    console.log(context);
    cb(context);
  },
  error(sessionId, context, error) {
    console.log(context);
    console.log(error.message);
  },
  ['list'](sessionId, context, cb) {
    console.log("Result context ", context);
    cb(context);
  },
};

const client = new Wit(token, actions);
client.interactive();
