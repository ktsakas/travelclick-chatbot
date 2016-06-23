const _ = require('underscore');
const request = require('request');
const moment = require('moment');

var Availability = {
	hotelCode: 1098,

	setOptions: function (options) {

	},

	parseOptions: function (options) {
		return {
			dateIn: dateIn,
			dateOut: dateOut,
			adults: guests
		};
	},

	get: function (options, cb) {
		options.rooms = 1;

		request.get({
			url: "http://ibeapil01-t5.ilcb.tcprod.local:8090/ibe/v1/hotel/1098/basicavail",
			qs: options
		}, function (err, res, body) {
			console.log("getting availability");//, err, JSON.parse(body));

			if (err) cb(err, false);
			else {
				var availability = _.map(JSON.parse(body).dates, (date) => {
					// console.log("get availability" + date.date);

					return {
						date: date.date,
						isAvailable: date.isAvailable,
						price: date.rate.minRate
					};
				});

				cb(null, availability);
			}
		});
	}/*,

	check: function (options, cb) {
		this.get(this.parseOptions(options), function (err, dates) {
			if (err) cb(err, false);
			else {
				cb( null, _(dates).every((date) => date.isAvailable) );
			}
		});
	}*/
};

/*Availability.get({
	dateIn: "2016-10-10",
	dateOut: "2016-10-13",
	adults: 2
}, function (err, dates) {
	console.log(dates);
});

Availability.check({
	dateIn: "2016-10-10",
	dateOut: "2016-10-13",
	adults: 2
}, function (err, isAvailable) {
	console.log("Is available? " + isAvailable);
});*/

module.exports = Availability;