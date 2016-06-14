## How Wit.ai works?

* For each sentence we figure out what the user is trying to do (action or intent)
* Find the entities (arguments) from the sentence to be passed to the function.
* The arguments or entities become part of the context and are passed further down if needed.

NOTE: the context that needs to be retained has to be stored through node.js, wit.ai does not keep any context state itself.

NOTE: if the user types just keywords without valid grammar the API still works.

TIP: Start with `Understanding` and then use `Stories`. The `Understanding` tab is where the rules are defined the `Stories` tab is kind of like testing.

Right now Wit.ai only has a Node.js library so to create an app we would have our backend make the calls to the API, but for efficiency it's probably also possible to use the Wit API directly on the front-end.

## Goals for chatbot.

Support listing properties based on filters (such as price range, distance and location) and sorting them by relevance, price, stars etc.

View details (availability, price, photos, videos) for a specific property by name (eg. Show  me the availability of King hotel for August).

Make, edit or cancel a reservation through the chatbot.

## Limitations

It's hard to reverse meanings such as "Show all hotels in New York, expect for the ones that cost less than 100$", which is equivalent to "Show all hotels that cost more than 100$ in New York". The `first` version does not work.


## Wit.ai vs API.ai

Wit.ai only advantage is it does not cost at all, while API.ai has a free tier but costs for more requests.

API.ai advantages:
* Can recognize connectives eg. "Show hotels between 10 and 200 dollars". Wit.ai does not understand that 10 refers to a price.
* It's faster and more responsive.
* Has a wider array of default entities.
* Much better documentation with plenty of examples.
* Allows for templates instead of user input, which would work well with a response produced by the code (eg. the user clicks).
* Wit.ai only gives out the date and not the text


## Conversations
When the users intent (or action) is known we would like to execute it, however there might not be enough information.

What happens is we store arguments from every sentence and keep asking for more info until all argument required (this can be configured) for our function (or action) are there.

eg. The listHotels() function requires at least a location and a price range.
`User: ` Show me a list of hotels.
*we know the intent the user wants to get a list of hotels*
`Bot: ` Where would you like to go?
`User: ` New York.
`Bot: ` What is your price range?
`User: ` From 10$ to 100$.
`Bot: ` Here is a list of hotels:
*only now can we run the query to find possible hotels*

## Brainstoring
Ask people questions they would ask the chatbot to get ideas and ensure we have covered most of the cases.

## Further things to look into

* Integration with facebook and slack
* How to integrate with machine answers (eg. click on of the options).
* Spelling correction using Bing API
* Language detection (if you only speek english)
* Enable speech-to-text
* Enable text-to-speech
* TripAdvisor has a free API, but requires a working link (possible not free alternative is Olery)

## APP possibilities
* Text/email hotel (eg. to notify arrival). Note that it is not possible to know the users phone number.
* Integrate with Siri