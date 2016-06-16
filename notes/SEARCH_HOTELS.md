The following will be done using elastic search to find matches (the TravelClick API can be used for bookings and details on a specific property).

## Possible search queries:

* *List all hotels that cost between 10$ and 100$.*
* *What hotels are within 5 miles of Manhattan and are cheaper than 100$ per night?*
* *Show me hotels that are available in August and cost between 20$ and 200$ in New York.*
* **More examples are on the STORIES in Wit.ai**

## Problems:

**How to extract ranges? Approaches:**
* Capture only price entities and assign roles to them (min or max value), eg. *Show me all hotels that are cheaper than **100$**.* This doesn't work Wit.ai does not recognize the if the price is the minimum or maximum one.
* Capture parts of the sentence that refere to a maximum or minimum price and extract the amounts from those (the number of keywords is pretty limited so this is possible eg. cheaper, less, highest refer to maximum) including the price itself. Then extract the price from that smaller part (this would use a feature callled nested entities). The problem is we cannot distinguish between diffrent currencies.
* Recognize the weather the user price refers to a maximum or minimum and extract the prices separately. It might be hard to relate the range with the price if there are more arguments. Consider the follwing: `Show me all hotels in less than 5 miles from Manhattan, that cost more than 100$.` When does **less** and **more** refer to the price and when to the distance?
