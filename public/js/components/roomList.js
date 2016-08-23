app.component("roomsList", {
	templateUrl: "/partials/rooms.html",
	bindings: {
		rooms: '<'
	},
	controller: function ($scope/*, $element*/, $http, $timeout) {
		$scope.bookRoom = function (e, room) {
			$scope.addMessage('Book me the "' + room.roomTypeName + '" room.', room);
	    
			/*if (e.stopPropagation) e.stopPropagation();
			if (e.preventDefault) e.preventDefault();
			e.cancelBubble = true;
			e.returnValue = false;*/
		}
	}
});