angular.module('w11k.slides.template', ['slides/slides.tpl.html', 'footer/footer.tpl.html']);

angular.module('slides/slides.tpl.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('slides/slides.tpl.html',
    '<div class="slides export" ng-controller="SlidesCtrl"><div class="overlay"></div><div class="slide-container" ng-repeat="slide in slides" ng-show="slide.active"><div ng-include="slide.template"></div></div></div>');
}]);

angular.module('footer/footer.tpl.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('footer/footer.tpl.html',
    '<div class="w11k-footer"><div class="row"><div class="col-sm-3 footer-left"></div><div class="col-sm-6 footer-middle"></div><div class="col-sm-3 footer-right"></div></div></div>');
}]);
