const config = require('../../app/config.js'),
	  l = config.logger,
	  Promise = require('bluebird'),
	  watson = require('watson-developer-cloud'),
	  alchemy_language = watson.alchemy_language(config.watson.alchemy_language),
	  language_translator = watson.language_translator(config.watson.language_translator),
	  tone_analyzer = watson.tone_analyzer(config.watson.tone_analyzer);


/**
 * All methods are static, do not call the constructor.
 * 
 * @class     WatsonAPI
 * @classdesc Watson API wrapper.
 */
class WatsonAPI {
	/**
	 * Given some text it will return an the sentiment and lanuage of
	 * the text.
	 * 
	 * @param  {string} Text to get sentiment.
	 * @return {promise} Promise that resovles to object with sentiment and language.
	 */
	static sentiment(text) {
		return Promise.promisify(alchemy_language.sentiment, {
			context: alchemy_language
		})({
			text: text
		}).catch(
			(err) => l.error(" -- sentiment -- ", err)
		).then(function (res) {
			console.log(res);

			return {
				langugage: res.language,
				docSentiment: res.docSentiment
			};
		});
	}

	/**
	 *	Given some text it returns an acronym mathching the texts language.
	 *
	 * @param  {string} Text to identify language.
	 * @return {promise} Promise that resolves to a string with the language identified.
	 */
	static identifyLang(text) {
		return Promise.promisify(language_translator.identify, {
			context: language_translator
		})({
			text: text
		}).catch(
			(err) => l.error(" -- identifyLang -- ", err)
		).then(
			(res) => res.languages[0].language
		);
	}

	/**
	 * Translate text from English to a given language
	 * 
	 * @param  {string} Text to translate.
	 * @param  {string} Lanuage to translate to.
	 * @return {promise} Promise that resolves to a string with the language identified.
	 */
	static translateEn(text, to) {
		return Promise.promisify(language_translator.translate, {
			context: language_translator
		})({
			text: text, source: 'en', target: to
		}).catch(function (err) {
			// 404 appear when they don't support the language
			if (err.error_code != 404) l.error(" -- translateEn -- ", err);
		}).then(function (res) {
			// If the language is supported
			if (res) return res.translations[0].translation;
			else     return null;
		});
	}

	/**
	 * Returns the emotions detected in the text.
	 * 
	 * @param  {string} Input text.
	 * @return {promise} Promise that resolves to object with emotions.
	 */
	static emotions(text) {
		return Promise.promisify(tone_analyzer.tone, {
			context: tone_analyzer
		})({
			text: text
		}).catch(
			(err) => l.error(" -- emotions -- ", err)
		).then(
			(res) => res.document_tone.tone_categories[0].tones
		);
	}
};

module.exports = WatsonAPI;
