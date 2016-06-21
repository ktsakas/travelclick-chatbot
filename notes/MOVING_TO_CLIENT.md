**API.AI**
Provides a client and server token. The client token can be used directly in the frontend and refreshed manually if compromized.

**WATSON API**
Allows you to request an access token that last for a specific period of time. It would mean that the server generates an access token every time it loads the app and passes it to the client (it's safer than api.ai).

**BING API**
Only the translator API seems to use access tokens. Seems that the spellcheck API that the chatbot uses a key (called Subscription Key) that can be used publicly similar to API.ai and updated manually if needed.

Advantages of moving to client:
* Huge decrease in the number of requests (only on load vs on every action)
* Speed increase on all requests since they are sent directly to the third party
* Speech will respond much faster (because it sends more data, therefore benefits more)

Disadvantages:
* Initial load time might be increased, but should be minimal with minification and serving javascript from the cdn. This can further be improved by smart loading the libraries (eg. allow the user to type before the server has responded with access tokens).
* If the final front-end is not in javascript (eg navive) the code cannot be used