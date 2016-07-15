const watson = require('watson-developer-cloud'),
	  alchemy_language = watson.alchemy_language(config.watson.alchemy_language),
	  language_translation = watson.language_translation(config.watson.language_translation),
	  tone_analyzer = watson.tone_analyzer(config.watson.tone_analyzer);

// Watson API
class WatsonAPI {
	static sentiment(text, cb) {
		return alchemy_language.sentiment({
			text: text
		}, function (err, response) {
			if (err) cb(err, null, null);
			else cb(null, response.language, response.docSentiment);
		});
	},

	static identifyLang(text, cb) {
		return language_translation.identify({
			text: text
		}, function (err, detected) {
			console.log(err);
			var lang = detected.languages[0].language;

			cb(err, lang);
		});
	},

	static translateEn(text, to, cb) {
		return language_translation.translate({
			text: text, source: 'en', target: to
		}, function (err, res) {
			if (err) cb(err, null);
			else cb(null, res.translations[0].translation);
		});
	},

	static emotions(text, cb) {
		return tone_analyzer.tone({ text: text },  function(err, tone) {
			if (err) console.log(err);
			else cb(err, tone.document_tone.tone_categories[0].tones);
		});
	}
};

module.exports = WatsonAPI;
