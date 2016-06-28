const _ = require('underscore');
const request = require('request');
const moment = require('moment');

var Availability = {
	hotelCode: 1098,

	parseOptions: function (params) {
		console.log("avail params: ", params);
		/*
			Parse Dates
		*/
		/*var dateIn = params['dateIn'],
			dateOut,
			nights = params['nights'],
			datePeriod = params['datePeriod'];

		if (datePeriod != "") {
			console.log('datePeriod: ', datePeriod);
			var datePeriod = params['datePeriod'].split('/');
			dateIn = datePeriod[0];
			dateOut = datePeriod[1];
			
		}*/

		/*
			Parse Guests
		*/
		/*var roomTypes = ['single', 'double', 'triple'],
			guests = params['guests'],
			roomType = params['roomType'];

		if (guests != "") {
			guests = guests.number;
			roomType = roomTypes[guests.number - 1];
		} else if (roomType != "") {
			if (roomType.match(/single/i)) {
				guests = 1;
			} else if (roomType.match(/double/i)) {
				guests = 2;
			} else if (roomType.match(/triple/i)) {
				guests = 3;
			}
		}
		console.log(dateIn, dateOut, guests, roomType);*/

		return {
			dateIn: params.dateIn,
			dateOut: params.dateOut,
			adults: params.guests
		};
	},

	get: function (options, cb) {
		options.rooms = 1;

		request.get({
			// url: "http://ibeapil01-t5.ilcb.tcprod.local:8090/ibe/v1/hotel/1098/basicavail",
			url : "http://localhost:9898/hotel/1098/basicavail",
			qs: options
		}, function (err, res, body) {
			if (err) cb(err, false);
			else {
				// console.log(JSON.parse(body));

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