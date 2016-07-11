var app = angular.module("chatbot", [/*'jsonFormatter'*/]);

app.controller("chatCtrl", function ($scope/*, $element, $http*/, $timeout) {
	// Array of all answers (bot and user)
	$scope.answers = [];
	// Whether or not the input is disabled
	$scope.disabled = false;

	$scope.addMessage = function () {
		console.log("add message!");
		$scope.answers.push({
			type: "msg",
			owner: "user",
			text: $scope.newMessage,
		});
	};

	// Test message
	$scope.answers.push({
		type: "msg",
		owner: "user",
		text: "Test user message",
	});

	$scope.answers.push({
		type: "msg",
		owner: "bot",
		text: "Test bot message",
	});

	$scope.answers.push({
		type: "yes_no",
		owner: "bot",
	});

	$scope.answers.push({
		type: "calendar",
		owner: "bot",
	});

	$scope.answers.push({
		type: "rooms",
		owner: "bot",
	});

	$scope.answers.push({
		type: "calendar",
		owner: "bot",
	});

	$timeout(function () {
		$scope.answers.push({
			type: "map_directions",
			owner: "bot",
		});
	}, 1000);
});

// Display html instead of plain text
app.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

app.controller("msgCtrl", function ($scope) {});
app.controller("yesNoCtrl", function ($scope) {});