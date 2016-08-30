const moment = require("moment"),
	  dateFormat = "YYYY-MM-DD";

var Hotel = require('../../apis/travelclick/travelclick.js'),
	Promise = require("bluebird");


/* 
 * Model of argumensts and states for the booking flow
 */
var model_example = {
	// Possible output states (note these states are only for wit.ai)

	/* askDateIn, askNights, askRoom, noRoomsFound, invalidArgument */

	// Variables available in the booking flow
	dateIn: "date",
	dateOut: "date",
	nights: "number",
	guests: "number",
	roomId: "number",
	roomTypeName: "string",
	roomType: "single" || "double" || "triple" || "quadruple",
	errorMsg: "string"
};

/**
 * Converts roomType to number of guests (eg. double is 2 guests)
 * 
 * @param  {string} roomType - The check in date.
 * @return {number} The number of guests.
 */
function roomTypeToGuests (roomType) {
	var roomTypes = ['single', 'double', 'triple', 'quadruple'];

	if ( roomTypes.indexOf(roomType) != -1 ) {
		return roomTypes.indexOf(roomType) + 1;
	} else {
		throw Error("Invalid room type!");
	}
}

/**
 * Calculates the number of nights based on the check in and
 * check out dates.
 * 
 * @param  {string} dateIn - The check in date.
 * @param  {string} dateOut - The check out date.
 * @return {number} The number of nights.
 */
function datesToNights (dateIn, dateOut) {
	var mDateIn = moment(dateIn, dateFormat),
		mDateOut = moment(dateOut, dateFormat)

	return mDateOut.diff(mDateIn, 'days');
}

/**
 * Parses the check in date.
 * 
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} The updated context.
 */
function parseDateIn (ctx, entities) {
	if ( moment(ctx.dateIn, dateFormat).diff(new Date(), 'days') < 0) {
		ctx.errorMsg = "Your check in day is in the past. Could you try again?";
		return ctx;
	}

	if (entities.dates[0]) {
		ctx.dateIn = entities.dates[0];
	} else {
		ctx.errorMsg = "I expected a date, could you repeat that?";
	}

	return ctx;
}

/**
 * Parses the check out date and calculates the number of nights the 
 * user wants to stay (dateOut - dateIn).
 * 
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} The updated context.
 */
function parseDateOut (ctx, entities) {
	if (!ctx.dateIn) throw Error("Missing date in.");

	if (entities.dates[1] || entities.dates[0]) {
		ctx.dateOut = entities.dates[1] || entities.dates[0];

		// Once we have dateIn and dateOut we can calulate the number of nights
		ctx.nights = datesToNights(ctx.dateIn, ctx.dateOut);
	} else {
		ctx.errorMsg = "I expected a check out date, could you repeat that?";
	}

	return ctx;
}

/**
 * Parses the check in date, check out date and number of nights.
 * This is called only when a book command is given for the first time.
 * 
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} The updated context.
 */
function parseDates (ctx, entities) {
	if (entities.dates.length > 2) {
		ctx.errorMsg = "You entered too many dates. Could you try again?";
		return ctx;
	}

	if (!ctx.dateIn) {
	console.log("PARSING DATE IN : ", ctx);
		ctx = parseDateIn(ctx, entities);

		// Chech if the user provided dateOut or number of nights
		if (entities.dates[1]) parseDateOut(ctx, entities);
		if (entities.number) parseNights(ctx, entities);
	}

	if (entities.nights) parseNights(ctx, entities);

	return ctx;
}

/**
 * Parses the number of nights a the user would like to stay.
 * 
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} The updated context.
 */
function parseNights (ctx, entities) {
	if (!ctx.dateIn) throw Error("Missing date in.");

	// Identify any number as the number of nights
	// this is prone to error, but can be fixed using roles
	// in the future look at (https://github.com/wit-ai/wit/issues/253)
	entities.nights = entities.number;

	if (!entities.nights) {
		ctx.erroMsg = "I expected a number, could you try again?";
		return ctx;
	}

	// If the number of nights does not match the dates give an error
	if (ctx.dateIn && ctx.dateOut && entities.nights &&
		entities.nights != datesToNights(ctx.dateIn, ctx.dateOut) ) {
		delete ctx.dateIn;
		delete ctx.dateOut;

		ctx.errorMsg = 
			"I am not sure when you are trying to book for, could you give me the dates again?";

		return ctx;
	}

	// Add nights to ctx
	if (entities.nights) ctx.nights = entities.nights;

	// If date in and nights are given we can caculate date out
	if (ctx.dateIn && ctx.nights) {
		ctx.dateOut =
			moment(ctx.dateIn).add(ctx.nights, 'days').format("YYYY-MM-DD");
	}

	return ctx;
}

/**
 * Parses a specific room either by name or by ID.
 * 
 * @param  {string} text - The user message.
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} The updated context or a promise that resolves with it.
 */
function parseSpecificRoom (text, ctx, entities) {
	if (entities.roomId && (!entities.roomTypeName || !entities.roomType)) {
		throw new Error("If the room ID is known we should also know the room type and room name.");
	}

	console.log("entities: ", entities);
	if (entities.roomId) {
		ctx.roomId = entities.roomId;
		ctx.roomTypeName = entities.roomTypeName;
		ctx.roomType = entities.roomType;

		return ctx;
	} else if (entities.roomTypeName) {
		return new Hotel(1098)
			.getRoom(entities.roomTypeName)
			.then(function (room) {
				console.log("specific room found? ", room);

				ctx.roomId = room.id;
				ctx.roomTypeName = room.roomTypeName;
				ctx.roomType = room.roomType;
				ctx.guests = roomTypeToGuests(ctx.roomType);

				return ctx;
			});
	}
}

/**
 * Parses any room details found in the user message (that is room name and room type).
 * 
 * @param  {string} text - The user message.
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} The updated context.
 */
function parseRoomDetails (text, ctx, entities) {
	if (entities.roomId && (!entities.roomTypeName || !entities.roomType)) {
		throw new Error("If the room ID is known we should also know the room type and room name.");
	}

	if (entities.roomTypeName) {
		return parseSpecificRoom(text, ctx, entities);
	} else if (entities.roomType) {
		ctx.roomType = entities.roomType;
		ctx.guests = roomTypeToGuests(entities.roomType);

		return ctx;
	}
}

/**
 * Finds all rooms matching the criteria of the current context
 * and updates the context with how many rooms where found.
 * 
 * @param  {object} ctx - The current context.
 * @return {object} Promise that resolves with the updated context.
 */
function findRooms (ctx) {
	var p;

	// If we have a specific name get the specific room
	if (ctx.roomTypeName) {
		p = new Hotel(1098)
			.getRoom(ctx.roomTypeName)
			.then(function (room) {
				if (room) ctx.roomsFoundCount = 1;
				else      ctx.roomsFoundCount = 0;

				return ctx;
			});

	// Otherwise find the rooms matching the criteria
	} else {
		p = new Hotel(1098)
			.getRooms({
				dateIn: ctx.dateIn || null,
				dateOut: ctx.dateOut || null,
				roomAmenities: ctx.amenity ? [ctx.amenity] : [],
				guests: ctx.guests || null
			})
			.then(function (rooms) {
				ctx.roomsFoundCount = rooms.length;
				return ctx;
			});
	}

	return p;
}

/**
 * Clears all state values from the context.
 * State values are an indicator for Wit.ai to decide the next action
 * and should not be used as input to parse the context.
 * 
 * @param  {object} ctx - The current context.
 * @return {object} The updated context.
 */
function clearState (ctx) {
	delete ctx.askDateIn;
	delete ctx.askNights;
	delete ctx.askRoom;
	delete ctx.noRoomsFound;
	delete ctx.invalidArgument;
	delete ctx.errorMsg;

	return ctx;
}

/**
 * Updates the output state to tell Wit.ai what the next action should be.
 * 
 * @param  {object} ctx - The current context.
 * @return {object} The updated context.
 */
function setNextState (ctx) {
	if      (ctx.roomsFoundCount == 0) ctx.noRoomsFound = true; 
	else if (ctx.errorMsg) ctx.invalidArgument = true;
	else if (!ctx.dateIn)  ctx.askDateIn = true;
	else if (!ctx.nights)  ctx.askNights = true;
	else if (!ctx.roomId)  ctx.askRoom   = true;

	return ctx;
}


/**
 * Parses all data related to the booking flow.
 * This is called every time merge is called and we are in the booking flow.
 * 
 * @param  {string} text - The user message.
 * @param  {object} ctx - The current context.
 * @param  {object} entities - The message entities.
 * @return {object} A promise that resolves with the updated context.
 */
module.exports = function (text, ctx, entities) {
	var p = Promise.resolve(ctx);

	// If this is a new command
	// or no rooms matching the query where found
	if (entities.newCommand || ctx.noRooms || entities.yes) {
		console.log("NEW COMMAND");

		if (entities.dates) {
			p = p.then((ctx) => parseDates(ctx, entities));
		} else if (entities.roomTypeName || entities.roomType) {
			p = p.then((ctx) => parseRoomDetails(text, ctx, entities));
		}

	// Note: this will also run if some argument is invalid (errorMsg state)
	} else {
		console.log("OLD COMMAND");

		// Parse one missing argument at a time
		if      (!ctx.dateIn) p = p.then((ctx) => parseDates(ctx, entities));
		else if (!ctx.nights) p = p.then((ctx) => parseNights(ctx, entities));
		else if (!ctx.roomId) {
			console.log("THIRD CASE");
			p = p.then((ctx) => parseSpecificRoom(text, ctx, entities));
		}
	}
	
	return p.then(findRooms)
	 .then(clearState)
	 .then(setNextState)
	 .then(function (ctx) {
	 	console.log("BOOKING PARSER RESULT: ", ctx);

	 	return ctx;
	 });
};