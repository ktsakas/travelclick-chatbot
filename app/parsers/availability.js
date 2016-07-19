module.exports = function (text, context, entities) {
	if (entities.roomTypeName) context.roomTypeName = entities.roomTypeName;
	if (entities.roomId) context.roomId = entities.roomId;
	if (entities.roomType) context.roomType = entities.roomType;

	entities.nights = entities.number;
	entities.guests = entities.number;

	delete context.askDates;
	delete context.askRoom;

	if (!context.dateIn) {
		// if (entities.dates.length == 0) this.addMessage("I expected a date. Could you repeat that?");

		if (entities.dates && entities.dates[0]) context.dateIn = entities.dates[0];
		if (entities.dates && entities.dates[1]) context.dateOut = entities.dates[1];
	} else if (!context.dateOut) {
		if (entities.dates.length > 0) {
			context.dateOut = entities.dates[0];
		} else if (entities.nights) {
			context.dateOut = moment(context.dateIn).add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD');
		}
	} else if (!context.guests) {
		if (entities.guests) {
			context.guests = entities.guests;

			var roomTypes = ['single', 'double', 'triple', 'quadruple'];
			context.roomType = roomTypes[ context.guests - 1 ];
		} else if (entities.roomType) {
			context.roomType = entities.roomType;

			if (context.roomType == 'single') {
				context.guests = 1;
			} else if (context.roomType == 'double') {
				context.guests = 2;
			} else if (context.roomType == 'triple') {
				context.guests = 3;
			} else if (context.roomType == 'quadruple') {
				context.guests = 4;
			}
		}
		
		/*if (!entities.guests) {
			this.addMessage("I expected the number of guests. Could you repeat that?")
		}*/
	}

	if (!context.dateIn || !context.dateOut) context.askDates = true;
	else if (!context.roomId) context.askRoom = true;

	/*delete context.availability;
	context.book = true;*/

	return Promise.resolve(context);
}