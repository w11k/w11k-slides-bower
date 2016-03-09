/**
 * w11k-slides
 *
 * @version v0.13.0
 * @link https://github.com/w11k/w11k-slides
 * @license MIT
 */
(function(module) {
try { module = angular.module('w11k.slides.template'); }
catch(err) { module = angular.module('w11k.slides.template', []); }
module.run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('footer/footer.html',
    '<div class=w11k-footer><div class=row><div class="col-sm-3 footer-left"></div><div class="col-sm-6 footer-middle"></div><div class="col-sm-3 footer-right"></div></div></div>');
}]);
})();

(function(module) {
try { module = angular.module('w11k.slides.template'); }
catch(err) { module = angular.module('w11k.slides.template', []); }
module.run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('slides/slides.html',
    '<div class="slides export" ng-controller="SlidesCtrl as sc"><div class=overlay></div><div class=slide-container ng-repeat="slide in sc.slides" ng-show=slide.active><div ng-include=slide.template></div></div></div>');
}]);
})();
