angular.module('w11k.slides.template', ['slides/slides.tpl.html']);

angular.module('slides/slides.tpl.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('slides/slides.tpl.html',
    '<div class="slides export" ng-controller="SlidesCtrl"><div ng-repeat="slide in slides" ng-show="slide.active"><div ng-include="slide.template"></div></div></div>');
}]);
