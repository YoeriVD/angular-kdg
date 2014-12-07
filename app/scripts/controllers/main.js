'use strict';

/**
 * @ngdoc function
 * @name angularKdgApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularKdgApp
 */
angular.module('angularKdgApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
