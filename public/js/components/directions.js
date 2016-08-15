app.controller("mapDirectionsCtrl", function ($scope, $element) {
	var map = new google.maps.Map($element[0].getElementsByClassName('map')[0], {
		zoom: 13,
		/*center: {
			lat: 37.918201,
			lng: -92.285156
		},*/
		disableDefaultUI: true
	});

	var directionsService = new google.maps.DirectionsService;
	var directionsDisplay = new google.maps.DirectionsRenderer;
	directionsDisplay.setMap(map);

	// Fix for partial loading problem
	google.maps.event.addListenerOnce(map, 'idle', function() {
		google.maps.event.trigger(map,'resize');
	});

	directionsService.route({
		/*origin: {
			lat: 37.8386741,
			lng: -122.2936934
		},*/
		origin: "JFK Airport",
		destination: "Port Authority Bus Terminal",
		travelMode: google.maps.TravelMode.DRIVING
	}, function(response, status) {
		var steps = response.routes[0].legs[0].steps;
		console.log("directions: ", $element[0].getElementsByClassName('directions'));
		console.log("legs: ", response.routes[0].legs);

		if (status === google.maps.DirectionsStatus.OK) {
			$scope.directions = steps;
			console.log(steps);
			$scope.$apply();

			directionsDisplay.setDirections(response);
		} else {
			window.alert('Directions request failed due to ' + status);
		}
	});
});