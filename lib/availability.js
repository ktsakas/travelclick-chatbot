const _ = require('underscore');
const request = require('request');
const moment = require('moment');

var Availability = {
	hotelCode: 1098,

	parseOptions: function (options) {
		/*
			Find the number of guests the user is checking the availability for
			based on room type or number of guests
		*/
		var guests = options['guests'];
		if (guests.number) {
			guests = guests.number;
		} else {
			if ( guests.roomType.match(/single/i) ) {
				guests = 1;
			} else if ( guests.roomType.match(/double/i) ) {
				guests = 2;
			} else if ( guests.roomType.match(/triple/i) ) {
				guests = 3;
			} else {
				throw "Invalid room type!";
			}
		}

		/*
			Find check in and check out dates based on starting date and nights or date period
		*/
		var dateIn, dateOut;
		if (options['date-period']) {
			var datePeriod = options['date-period'].split('/');
			dateIn = datePeriod[0];
			dateOut = datePeriod[1];
		} else if (date && nights) {
			dateIn = options['date'];
			dateOut = moment(date, "YYYY-MM-DD").add(
				parseInt(options['nights']), 'days'
			);
		}

		console.log("dateIn: ", dateIn);
		console.log("dateOut: ", dateOut);
		console.log("guests: ", guests);

		return {
			dateIn: dateIn,
			dateOut: dateOut,
			guests: guests
		};
	},

	get: function (options, cb) {
		options.rooms = 1;

		request.get({
			url: "http://ibeapil01-t5.ilcb.tcprod.local:8090/ibe/v1/hotel/1098/basicavail",
			qs: this.parseOptions(options)
		}, function (err, res, body) {
			// console.log("getting availability", err, res, body);

			if (err) cb(err, false);
			else {
				var availability = _.map(JSON.parse(body).dates, (date) => {
					console.log("get availability" + date.date);

					return {
						date: date.date,
						isAvailable: date.isAvailable,
						price: date.rate.minRate
					};
				});

				cb(null, availability);
			}
		});
	},

	check: function (options, cb) {
		this.get(this.parseOptions(options), function (err, dates) {
			if (err) cb(err, false);
			else {
				cb( null, _(dates).every((date) => date.isAvailable) );
			}
		});
	}
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