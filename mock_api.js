const express = require('express'),
	  moment = require('moment'),
	  l = require('winston'),
	  faker = require('faker'),
	  app = express();

Array.prototype.shuffle = function() {
	var input = this;

	for (var i = input.length-1; i >=0; i--) {
		var randomIndex = Math.floor(Math.random()*(i+1)); 
		var itemAtIndex = input[randomIndex]; 
		 
		input[randomIndex] = input[i]; 
		input[i] = itemAtIndex;
	}
	return input;
}

app.get('/check', function (req, res) {
	res.json({ 'check': 'fine' });
});

app.get('/hotel/:hotelCode/basicavail', function (req, res) {
	// Required dateIn, dateOut, adults and rooms
	
	dateIn = moment(req.query.dateIn, 'YYYY-MM-DD');
	dateOut = moment(req.query.dateOut, 'YYYY-MM-DD');

	var result = {
		hotelCode: req.params.hotelCode,
		currencyCode: 'eur',
		timeSpan: {
			start: req.query.dateIn,
			end: req.query.dateOut,
			duration: dateOut.diff(dateIn, 'days')
		},
		dates: []
	};

	console.log("dateIn: " + dateIn.month());

	for (var i = 0; i < result.timeSpan.duration; i++) {
		var avail;
		// January is empty
		if (dateIn.month() == 0) avail = true;
		// December is booked
		else if (dateIn.month() == 11) avail = false;
		// Some are booked in other months
		else avail = !(i % 3);

		result.dates.push({
			date: dateIn.format('YYYY-MM-DD'),
			isAvailable: avail,
			rate: {
				minRate: Math.round(Math.random()) ? 10 : 20,
				discount: 0
			},
			availability: [{
				availStatus: avail ? "avail" : "booked"
			}]
		});

		dateIn.add(1, 'd');
	}

	res.json(result);
});

app.get('/hotel/:hotelCode/info', function (req, res) {
	var result = {
		hotelCode: req.params.hotelCode,
		hotelName: faker.company.companyName(),
		webAddress: faker.internet.url(),
		maxRoomsPerBooking: 0,
		roomCategoriesEnabled: true,

		position: {
			latitude: faker.address.latitude(),
			longitude: faker.address.longitude()
		},

		address: {
			addressLine1: faker.address.streetAddress(),
			cityName: faker.address.city(),
			stateName: faker.address.state(),
			postalCode: faker.address.zipCode(),
			countryName: faker.address.country(),
			countryCode: faker.address.countryCode()
		},

		policies: {
			policyInfo: {
				checkInTime: '1pm',
				checkOutTime: '12pm'
			}
		},

		address: {
			telephone: [{
				phoneTechType: 'Voice',
				phoneNumber: faker.phone.phoneNumberFormat()
			}, {
				phoneTechType: 'Fax',
				phoneNumber: faker.phone.phoneNumberFormat()
			}]
		}
	};


	res.json(result);
});

app.get('/hotel/:hotelCode/info/rooms', function (req, res) {
	var alwaysAmenities = [ "coffeemaker", "alarm", "air condition" ];
	var randAmenities = [
		"wifi", "tv", "telephone", "bathtub", "bathroom", "kitchen", "ocean view"
	];

	var result = {
		hotelCode: req.params.hotelCode,
		hotelName: faker.company.companyName(),
		mainImage: {
			sortOrder: 0,
			source: "http://lorempixel.com/1366/768/city/1/",
			type: "image"
		},

		guestRooms: []
	};

	for (var i= 0; i < 5; i++) {
		var roomType = {
			id: 1534 + i,
			roomTypeName: faker.company.companyName(),
			maxOccupancy: 4,
			maxAdultOccupancy: 3,
			maxChildOccupancy: 1,
			description: faker.lorem.paragraph(),

			amenities: []
		};

		result.guestRooms.push(roomType);

		randAmenities.shuffle();
		for (var k= 0; k < 5; k++) {
			roomType.amenities.push({
				amenityCode: Math.floor(Math.random() * 1000),
				amenityType: "room",
				amenityName: randAmenities[k],
				quantity: 0,
				isPremiumAmenity: true,
				image: {
					type: "photo",
					source: "http://lorempixel.com/200/150/city/1/",
					sortOrder: 0
				},
				sortOrder: 0
			});
		}

		for (var j= 0; j < 3; j++) {
			roomType.amenities.push({
				amenityCode: Math.floor(Math.random() * 1000),
				amenityType: "room",
				amenityName: alwaysAmenities[j],
				quantity: 0,
				isPremiumAmenity: true,
				image: {
					type: "photo",
					source: "http://lorempixel.com/200/150/city/1/",
					sortOrder: 0
				},
				sortOrder: 0
			});
		}
	}

	res.json(result);
});

module.exports = app;
// app.listen(9898, () => l.info("Mock api listening on 127.0.0.1:" + 9898));