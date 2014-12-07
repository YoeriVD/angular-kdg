'use strict';

/**
 * @ngdoc function
 * @name angularKdgApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the angularKdgApp
 */
angular.module('angularKdgApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
