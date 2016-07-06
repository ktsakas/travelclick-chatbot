var watson = require('watson-developer-cloud');

var WatsonAPI = {
	alchemy_language: watson.alchemy_language({ 
		api_key: 'b9aef1bcb7a5923fd1672ff159477fe3db9b5331'
	}),

	language_translation: watson.language_translation({
		username: "d6d60526-121f-4d6f-ade4-e0ced92b79f2",
		password: "xoi31emdeO1O",
		version: 'v2'
	}),

	tone_analyzer: watson.tone_analyzer({
		username: 'af14eb53-0679-4096-97a2-0bf6f2287603',
		password: 'OrmEaGl1Vww5',
		version: 'v3',
		version_date: '2016-05-19'
	}),

	sentiment: function (text, cb) {
		return this.alchemy_language.sentiment({
			text: text
		}, function (err, response) {
			if (err) cb(err, null, null);
			else cb(null, response.language, response.docSentiment);
		});
	},

	identifyLang: function (text, cb) {
		return this.language_translation.identify({
			text: text
		}, function (err, detected) {
			console.log(err);
			var lang = detected.languages[0].language;

			cb(err, lang);
		});
	},

	translateEn: function (text, to, cb) {
		return this.language_translation.translate({
			text: text, source: 'en', target: to
		}, function (err, res) {
			if (err) cb(err, null);
			else cb(null, res.translations[0].translation);
		});
	},

	emotions: function (text, cb) {
		return this.tone_analyzer.tone({ text: text },  function(err, tone) {
			if (err) console.log(err);
			else cb(err, tone.document_tone.tone_categories[0].tones);
		});
	}
};

module.exports = WatsonAPI;
