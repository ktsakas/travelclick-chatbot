const l = require('winston'),
	  uuid = require('node-uuid'),
	  EventEmitter = require('events').EventEmitter,
	  util = require('util'),
	  request = require('request'),
	  _ = require('underscore'),
	  moment = require('moment');

l.level = 'silly';

function WitAPI (token) {
	var version = '20160516';

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

	return this;
}

util.inherits(WitAPI, EventEmitter);

WitAPI.prototype.action = function (action, fn) {
	this.actions[action] = fn;
};

WitAPI.prototype.callAction = function (action, args, cb) {
	if (!this.actions[action]) throw "Action " + action + " does not exist!";

	var restArgs = Array.prototype.slice.call(arguments, [1]);
	// console.log("rest args: ", restArgs);
	this.actions[action].apply(this, restArgs);
};

WitAPI.prototype.query = function (text) {
	var self = this;

	console.log("querying with: ", self.context, text);
	this.req.post({
		url: "/converse",
		qs: _.defaults(text ? { q: text } : {}, this.queryData),
		body: JSON.stringify(self.context)
	}, function (err, res, body) {
		body = JSON.parse(body);

		 if (body.type == "merge") {
		 	console.log("MERGING");
			// console.log("merge body: ", body);
			self.callAction('merge', text, body.entities || {}, self.context, function (mergedCtx) {
				self.context = mergedCtx;
				// console.log("merged ctx", self.context);

				self.query();
			});
		} else if (body.type == "msg") {
		 	console.log("SAYING", body.msg);
			self.callAction('say', body.msg);
			self.query(text);
		} else if (body.type == "action") {
		 	console.log("ACTION" + body.action);
			self.callAction(body.action, self.context, function (newCtx) {
				self.context = newCtx;

				// console.log("action ctx: ", self.context);
				self.query(text);
			});
		} else if (body.type == "stop") {
		 	console.log("STOPPING");
			console.log(self.context);
			self.callAction('stop');
			return;
		}
	});
}

module.exports = WitAPI;