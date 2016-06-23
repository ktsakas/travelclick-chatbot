const EventEmitter = require('events').EventEmitter;
const util = require('util');

const api_key = "3ec2ce2feba540869d5f9ff32bc6680c";
const AI = require('apiai');
const request = require('request');

function AIapi () {
	this.ai = new AI(api_key);
	this.params = {};
	this.lastMsg = "";
	this.parsers = {};

	return this;
}

util.inherits(AIapi, EventEmitter);

AIapi.prototype.parse = function (action, params) {
	if (this.parsers[action]) {
		this.parsers[action]();
	}
};

AIapi.prototype.query = function (text, params) {
	var self = this;
	this.lastMsg = text;
	this.parsed = false;
	var contexts = [{
		name: "extra",
		parameters: params
	}];
	var aiQuery = this.ai.textRequest(text, {contexts: contexts});

	aiQuery.on('response', function (res) {

		console.log(res.result);

		

		if (res.result.action == "") {
			self.emit("say", res.result.fulfillment.speech);
		} else {
			self.emit("parse-" + res.result.action, res.result.parameters);

			var paramsChanged = !_.isEqual(res.result.parameters, params);
			if (paramsChanged) self.query(text, res.result.parameters);
			else if (res.result.actionIncomplete) self.emit("say", res.result.fulfillment.speech);
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

module.exports = AIapi;