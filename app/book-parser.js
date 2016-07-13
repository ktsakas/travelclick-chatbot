/* BOOKING PARSER */

function datesToNights (dateIn, dateOut) {
	return moment(dateIn).diff(dateOut);
}

function parseDateIn (context, entities) {
	if (context.dateIn < today) {
		context.errorMsg = "Your check in day is in the past. Could you try again?";
		return context;
	}

	if (entities.dates[0]) {
		context.dateIn = entities.dates[0];
	} else {
		context.errorMsg = "I expected a date, could you repeat that?";
	}

	return context;
}

function parseDateOut (context, entities) {
	if (!context.dateIn) throw Error("Missing date in.");

	if (entities.dates[0] || entities.dates[1]) {
		context.dateOut = entities.dates[0] || entities.dates[1];

		// Once we have dateIn and dateOut we can calulate the number of nights
		context.nights = datesToNights(context.dateIn, context.dateOut);
	} else {
		context.errorMsg = "I expected a check out date, could you repeat that?";
	}

	return context;
}

function parseDates (context, entities) {
	if (entities.dates.length > 2) {
		context.errorMsg = "You entered too many dates. Could you try again?";
		return context;
	}

	if (!context.dateIn) {
		context = parseDateIn(context, entities);

		// Date out is optional at this stage so only check it if there are two dates
		if (entities.dates[1]) parseDateOut(context, entities);
	}

	if (entities.nights) parseNights(context, entities);

	return context;
}

function parseNights (context, entities) {
	if (!context.dateIn) throw Error("Missing date in.");

	if (!entities.nights) {
		context.erroMsg = "I expected a number, could you try again?";
		return context;
	}

	// If the number of nights does not match the dates give an error
	if (context.dateIn && context.dateOut && entities.nights &&
		entities.nights != datesToNights(context.dateIn, context.dateOut) ) {
		delete context.dateIn;
		delete context.dateOut;

		context.errorMsg = 
			"I am not sure when you are trying to book for, could you give me the dates again?";

		return context;
	}

	// Add nights to context
	if (entities.nights) context.nights = entities.nights;

	// If date in and nights are given we can caculate date out
	if (context.dateIn && context.nights) {
		context.dateOut = moment(context.dateIn).add(context.nights, 'days').format( --- );
	}

	return context;
}

function parseRoom (text, context, entities) {
	if (context.roomId && (!context.roomTypeName || !context.roomType)) {
		throw new Error("If the room ID is known we should also know the room type and room name.");
	}

	if (context.roomTypeName) // query to find roomType and roomId
}

function countRoomsFound (context) {
	if (context.roomId) {

	} else {

	}
}

function clearState (context) {
	delete context.askDateIn;
	delete context.askNights;
	delete context.askRoom;
	delete context.noRoomsFound;
	delete context.invalidArgument;
	delete context.errorMsg;
}

function setNextState (context) {
	if      (!context.matchingRooms == 0) context.noRoomsFound = true; 
	else if (context.errorMsg) context.invalidArgument = true;
	else if (!context.dateIn)  context.askDateIn = true;
	else if (!context.nights)  context.askNights = true;
	else if (!context.roomId)  context.askRoom   = true;
}

/* Model of argumensts and states for booking flow */
var model_example = {
	// Possible output states (note these states are only for wit.ai)
	/* askDateIn, askNights, askRoom, noRoomsFound, invalid */

	// Required variables to complete booking
	dateIn: "date",
	dateOut: "date",
	nights: "number",
	guests: "number",
	roomId: "number",
	roomTypeName: "string",
	roomType: "single" || "double" || "triple" || "quadruple"
};

module.exports = function (text, context, entities) {
	
	// If this is a new command
	// or no rooms matching the query where found
	if (entities.intent || context.noRooms) {

		context = parseRoomType(context, entities);

		if      (entities.dates)        parseDates(context, entities);
		else if (entities.roomTypeName) parseRooms(context, entities);

	// Note: this will also run if some argument is invalid (errorMsg state)
	} else {
		// Parse one missing argument at a time
		if      (!context.dateIn) context = parseDates(context, entities);
		else if (!context.nights) context = parseNights(context, entities);
		else if (!context.roomId) context = parseRoom(context, entities);
	}
	
	context = countRoomsFound(context);
	
	// If the arguments are valid, always check if any rooms match those arguments
	context = clearState(context);
	context = setNextState(context);

	return context;
};