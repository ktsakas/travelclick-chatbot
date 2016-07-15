const dotenv = require('dotenv').config({ path: __dirname + "/../.env" });
var winston = require('winston');

module.exports = {
	port: process.env.PORT || 3000,
	logger: new (winston.Logger)({ level: 'silly' }),

	bing: {
		base_url: "https://bingapis.azure-api.net/api/v5",
		subscription_key: process.env.BING_SUBSCRIPTION_KEY
	},

	witai: {
		token: process.env.WIT_TOKEN,
		version: "20160706",
	},

	twillio: {
		account_sid: process.env.TWILLIO_ACCOUNT_SID,
		auth_token: process.env.TWILLIO_AUTH_TOKEN
	},

	apiai: {
		api_key: process.env.API_AI_KEY
	},

	travelclick: {
		prod: process.env.TRAVELCLICK_API_ENDPOINT,
		dev: "localhost"
	},

	watson: {
		alchemy_language: {
			api_key: process.env.WATSON_ALCHEMY_LANGUAGE_API_KEY
		},

		language_translation: {
			username: process.env.WATSON_LANG_TRANSLATION_USER,
			password: process.env.WATSON_LANG_TRANSLATION_PASS,
			version: "v2"
		},

		tone_analyzer: {
			username: process.env.WATSON_TONE_ANALYZER_USER,
			password: process.env.WATSON_TONE_ANALYZER_PASS,
			version: "v3",
			version_date: "2016-05-19"
		}
	}
};