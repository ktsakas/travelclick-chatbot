const EventEmitter = require('events').EventEmitter;
const util = require('util');

const api_key = "3ec2ce2feba540869d5f9ff32bc6680c";
const AI = require('apiai');
const request = require('request');

function AIapi () {
	this.ai = new AI(api_key);

	return this;
}

util.inherits(AIapi, EventEmitter);

AIapi.prototype.query = function (text) {
	var self = this;
	var aiQuery = this.ai.textRequest(text);

	aiQuery.on('response', function (res) {

		console.log(res.result);

		if (res.result.action == "" || res.result.actionIncomplete) {
			self.emit("say", res.result.fulfillment.speech);
		} else {
			console.log("query action: " + res.result.action);
			console.log("emit: " + res.result.parameters);
			self.emit(res.result.action, res.result.parameters);
		}

	}).on('error', function (err) {
		console.log(err);
	});

	aiQuery.end();

	return this;
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

// new AIapi().tts();

/*ttsQuery.on('data', function (data) {
	

	file.on('error', function (err) {
		console.log(err);
	});
});*/

module.exports = AIapi;