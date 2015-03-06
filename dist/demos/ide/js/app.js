(function() {
  'use strict';
 
  var app = angular.module('yagm', ['ngRoute', 'jsTree.directive']).
  config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
      when('/', {
        templateUrl: './partials/home.html',
        controller: 'ResourcesTree'
      }).
      otherwise({
        redirectTo: '/'
      });
    }
  ]);


  app.controller('ResourcesTree', ['$scope',  '$timeout',
    function($scope, $timeout) {
      $scope.fileViewer = 'Please select a file to view its contents';
      var solution_element = document.getElementById("solution_window");

      var setup_resource_panel = function() {
       
      if (typeof solution_element !== 'undefined' && typeof dockManager !== 'undefined' && typeof window.documentNode !== 'undefined') {
         console.log('Docking...')
          var solution = new dockspawn.PanelContainer(solution_element, dockManager);
          var solutionNode = dockManager.dockLeft(window.documentNode, solution, 0.15);
      } else {
        $timeout(setup_resource_panel, 2000);
      }
       };

      $timeout(setup_resource_panel, 2000);

      // $timeout(function() {
      //   console.log('Docking...')
      //   var documentNode = dockManager.context.model.documentManagerNode;
      //     var solution = new dockspawn.PanelContainer(document.getElementById("solution_window"), dockManager);
      //     var solutionNode = dockManager.dockLeft(documentNode, solution, 0.15);
      // },10000);
 
      $scope.nodeSelected = function(e, data) {
        var _l = data.node.li_attr;
        if (_l.isLeaf) {
          FetchFileFactory.fetchFile(_l.base).then(function(data) {
            var _d = data.data;
            if (typeof _d == 'object') {
 
              //http://stackoverflow.com/a/7220510/1015046//
              _d = JSON.stringify(_d, undefined, 2);
            }
            $scope.fileViewer = _d;
          });
        } else {
 
          //http://jimhoskins.com/2012/12/17/angularjs-and-apply.html//
          $scope.$apply(function() {
            $scope.fileViewer = 'Please select a file to view its contents';
          });
        }
      };
    }
  ]);

  angular.bootstrap(document, ['yagm']);
 
}());