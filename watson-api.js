const watson = require('watson-developer-cloud');

var params = {
  text: 'IBM Watson won the Jeopardy television show hosted by Alex Trebek'
  // text: "Ich can nue ein bischen Deutch sprechen."
};

function WatsonAPI() {
	var api_key = 'b9aef1bcb7a5923fd1672ff159477fe3db9b5331';

	this.alchemy_language = watson.alchemy_language({ api_key: api_key });

	return this;
}

WatsonAPI.prototype.analyze = function (text, cb) {
	this.alchemy_language.sentiment(params, function (err, response) {
		if (err) throw "Sentiment analysis request failed."
		else cb(response.language, response.docSentiment.score);
	});
};

module.exports = WatsonAPI;
