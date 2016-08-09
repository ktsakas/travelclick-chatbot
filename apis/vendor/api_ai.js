"use strict";

const EventEmitter = require('events').EventEmitter,
	  util = require('util'),
	  _ = require('underscore');

const api_key = "3ec2ce2feba540869d5f9ff32bc6680c";
const AI = require('apiai');
const request = require('request');

function AIapi () {
	this.ai = new AI(api_key);
	this.params = {};
	this.lastMsg = "";
	this.parsers = {};
	this.resetContexts = true;

	return this;
}

util.inherits(AIapi, EventEmitter);

AIapi.prototype.addParser = function (action, parserFn) {
	if (!this.parsers[action]) this.parsers[action] = [];

	this.parsers[action].push(parserFn);
};

AIapi.prototype.parse = function (action, params) {
	if (this.parsers[action]) {
		this.parsers[action].forEach((parser) => {
			params = parser(_.clone(params));
		});
	}

	return params;
}

AIapi.prototype.query = function (text, params) {
	var self = this;
	/*console.log("querying with: ", params);
	var contexts = [{
		name: "generic",
		parameters: params
	}];*/
	var aiQuery = this.ai.textRequest(text, {resetContexts: this.resetContexts});
	this.resetContexts = false;

	aiQuery.on('response', function (res) {

		// console.log("result: ", res.result.contexts);

		/*var contextParams = _(res.result.contexts).find((context) => {
			return context.name == 'generic';
		});
		console.log("context params: ", contextParams.parameters);
		console.log("resp params: ", res.result.parameters);
		params = _.extend(res.result.parameters, contextParams.parameters);
		console.log("results params: ", params);
*/
		/*var parsed = self.parse(res.result.action, params),
			paramsChanged = !_.isEqual(params, parsed);

		console.log('action: ' + res.result.action, 'params: ', params, 'parsed: ',  parsed);*/

		/*if (paramsChanged) {
			console.log("params changed");
			self.query(text, parsed);
		} else */
		console.log(res.result);
		if (res.result.action == "" || res.result.actionIncomplete) {
			self.emit("say", res.result.fulfillment.speech);
		} else {
			self.emit(res.result.action, res.result.parameters);
			if (res.result.fulfillment.speech) self.emit("say", res.result.fulfillment.speech);
		}

		/*if (res.result.action == "" && res.result.actionIncomplete && this.parsed) {
			self.emit("say", res.result.fulfillment.speech);
		} else {
			console.log("query action: " + res.result.action);
			console.log("emit: " + res.result.parameters);
			console.log("inner ai: ", self);
			self.emit(res.result.action, res.result.parameters);
		}*/

	}).on('error', function (err) {
		console.log(err);
	});

	aiQuery.end();

	return this;
};

AIapi.prototype.updateParams = function (params) {
	this.params = params;
	this.parsed = true;

	this.query(this.lastMsg, this.params);
};

AIapi.prototype.tts = function (text) {
	request.get({
		url: "https://api.api.ai/v1/tts",
		headers: {
			'Authorization': 'Bearer '+ api_key,
			'Accept-Language': 'en-US'
		},
		qs: {
			v: 20150910,
			text: "I would like to book a hotel room."
		}
	}).pipe(
		require('fs').createWriteStream('./output.wav')
	);
};

/*var aiApi = new AI(api_key);

console.log(aiApi);
aiApi.textRequest('I would like to book a room.', {
	contexts: [{
		name: "extra",
		parameters: {
			guests: 1
		}
	}]
}).on('response', function (res) {
	console.log(res);
}).on('error', function (err) {
	console.log(err);
}).end();*/


// new AIapi().tts();

/*ttsQuery.on('data', function (data) {
	

	file.on('error', function (err) {
		console.log(err);
	});
});*/

var ai = new AI(api_key);
ai.textRequest("I would like to book a room.", {
	contexts: [{
		name: "generic",
		parameters: {
			newthing: "hadsfa"
		}
	}],
	sessionId: "00000000-1234-0000-0000-000000000000", 
	resetContexts: true
}).on('response', function (res) {
	// console.log("response: ", res);
	// console.log("response contexts: ", res.result.contexts);
}).end();

module.exports = AIapi;