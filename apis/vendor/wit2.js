const config = require('../../app/config.js'),
	  l = config.logger,
	  uuid = require('node-uuid'),
	  EventEmitter = require('events').EventEmitter,
	  util = require('util'),
	  request = require('request-promise'),
	  _ = require('underscore'),
	  moment = require('moment');

/**
 * @class     WitAPI
 * @classdesc API wrapper class for Wit.ai.
 */
class WitAPI extends EventEmitter {
	constructor (token) {
		super();

		var version = '20160706';

		this.queryData = {
			v: version,
			session_id: uuid.v1()
		};

		this.req = request.defaults({
			baseUrl: 'https://api.wit.ai',
			headers: {
				'Authorization': 'Bearer ' + token,
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		});

		this.context = {};

		// this.actions = actions;
		this.actions = {};
	}

	/**
	 * Set the action that will be called for a particular Wit action.
	 * 
	 * @param  {String} action - the name of the action
	 * @param  {Function} fn - to be called for the action
	 */
	action (action, fn) {
		this.actions[action] = fn;
	}

	/**
	 * Will call an action with the given parameters.
	 *
	 * @private
	 * @param  {String} action - name of the action to be called
	 */
	callAction(action) {
		if (!this.actions[action]) throw "Action " + action + " does not exist!";

		var restArgs = Array.prototype.slice.call(arguments, [1]);
		// console.log("rest args: ", restArgs);
		this.actions[action].apply(this, restArgs);
	}

	/**
	 * Sends a query to Wit.ai with the given text
	 * and based on the response calls the appropriate actions.
	 *
	 * @param  {String}  text input by the user to send to Wit
	 * @return {Promise}
	 */
	query (text) {
		var self = this;

		l.info("querying with: ", self.context, text);
		this.req.post({
			url: "/converse",
			qs: Object.assign(text ? { q: text } : {}, this.queryData),
			body: self.context,
			json: true
		}).catch(
			(err) => l.error(" -- wit query -- ", err)
		).then(function (body) {
			 if (body.type == "merge") {
			 	l.info("MERGING");
				// l.info("merge body: ", body);
				self.callAction('merge', text, self.context, body.entities || {}, function (mergedCtx) {
					self.context = mergedCtx;

					self.query();
				});
			} else if (body.type == "msg") {
			 	l.info("SAYING", body);
				self.callAction('say', body);
				self.query();
			} else if (body.type == "action") {
				self.callAction(body.action, self.context, function (newCtx) {
					self.context = newCtx;

					// l.info("action ctx: ", self.context);
					self.query();
				});
			} else if (body.type == "stop") {
			 	l.info("STOPPING");
				l.info(self.context);
				self.callAction('stop');
				return;
			}
		});
	}

	/**
	 * Reset the session id for wit.
	 * This should be called when then intent changes.
	 */
	reset () {
		this.queryData.session_id = uuid.v1();
	}
}

module.exports = WitAPI;