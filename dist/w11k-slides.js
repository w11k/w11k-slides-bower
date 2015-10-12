/**
 * w11k-slides
 *
 * @version v0.12.2
 * @link https://github.com/w11k/w11k-slides
 * @license MIT
 */
(function() {
  'use strict';

  var module = angular.module('w11k.slides', []);

  module.constant('slidesConfig', {
    slides: [],
    slideTemplatePrefix: 'slides/content/',
    slideTemplateSuffix: '.html',
    masters: {},
    footer: {
      templateUrl: 'footer/footer.html',
      left: '',
      middle: '',
      right: '$index + 1'
    }
  });
}());

(function() {
  'use strict';

  /* @ngInject */
  function w11kEventToggle($rootScope) {
    return {
      restrict: 'A',
      link: function (scope, jqElement, attrs) {
        var element = jqElement[0];
        var originalDisplay;
        scope.$on(attrs.w11kEventToggle, function (event, visible) {
          toggle(visible);
        });

        function toggle(visible) {
          if (visible) {
            element.style.display = originalDisplay;
          }
          else {
            originalDisplay = element.style.display;
            element.style.display = 'none';
          }
        }

        $rootScope.$emit(attrs.w11kEventToggle + '-current', function(visible) {
          toggle(visible);
        });
      }
    };
  }
  w11kEventToggle.$inject = ['$rootScope'];

  var module = angular.module('w11k.slides');
  module.directive('w11kEventToggle', w11kEventToggle);
}());

(function() {
  'use strict';

  /* @ngInject */
  function w11kFooter(slidesConfig) {
    return {
      restrict: 'EA',
      templateUrl: slidesConfig.footer.templateUrl || 'footer/footer.tpl.html',
      replace: true,
      link: function (scope, element, attrs) {
        var left = element[0].querySelector('.footer-left');
        var middle = element[0].querySelector('.footer-middle');
        var right = element[0].querySelector('.footer-right');

        function setContent(element, expression) {
          var content = scope.$eval(expression);
          if (angular.isDefined(content)) {
            element.innerHTML = content;
          }
        }

        setContent(left, attrs.left || slidesConfig.footer.left);
        setContent(middle, attrs.middle || slidesConfig.footer.middle);
        setContent(right, attrs.right || slidesConfig.footer.right);
      }
    };
  }
  w11kFooter.$inject = ['slidesConfig'];

  var module = angular.module('w11k.slides');
  module.directive('w11kFooter', w11kFooter);
}());

(function() {
  'use strict';

  /* @ngInject */
  function UnloadConfirm($window) {
    var counter = 0;

    this.increment = function () {
      this.counter++;
    };

    this.decrement = function () {
      this.counter--;
    };

    $window.onbeforeunload = function (event) {
      if (counter > 0) {
        var hint = 'Es wurde mindestens ein Beispiel geöffnet. Wenn die Seite neu geladen wird, müssen beim erneuten Öffnen auch die Beispiele neu geladen werden.';
        event.returnValue = hint;
        return hint;
      } else {
        event.preventDefault();
        return;
      }
    };
  }
  UnloadConfirm.$inject = ['$window'];

  var module = angular.module('w11k.slides');
  module.service('UnloadConfirm', UnloadConfirm);
}());

(function() {
  'use strict';

  /* @ngInject */
  function w11kOpenOnce($window, UnloadConfirm) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var namedWindow;

        element.bind('click', function (event) {
          var noNamedWindowOpen = namedWindow === undefined || namedWindow === null || namedWindow.closed;
          var linkAttrSet = attrs.href !== undefined && attrs.href !== null && attrs.target !== undefined && attrs.target !== null;
          var openOnceSet = attrs.w11kOpenOnce === 'true';

          if (noNamedWindowOpen && linkAttrSet && openOnceSet) {
            element.removeClass('example-shown');
            UnloadConfirm.increment();
            namedWindow = $window.open(attrs.href, attrs.target);
            event.preventDefault();
          } else if (noNamedWindowOpen === false && openOnceSet) {
            namedWindow.focus();
            element.addClass('example-shown');
            event.preventDefault();
          }
        });
      }
    };
  }
  w11kOpenOnce.$inject = ['$window', 'UnloadConfirm'];

  var module = angular.module('w11k.slides');
  module.directive('w11kOpenOnce', w11kOpenOnce);
}());

(function () {
  'use strict';

  /* @ngInject */
  function w11kPrettyPrint($window) {

    var escapeHTML = function (html) {
      if (angular.isUndefined(html)) {
        return;
      }

      return html.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    };

    var containerTemplate = '<div class="w11k-pretty-print"><pre class="prettyprint linenums"></pre></div>';
    var titleTemplate = '<div class="title"></div>';

    return {
      restrict: 'A',
      terminal: true,
      compile: function (tElement, tAttrs) {
        if (angular.isFunction($window.prettyPrintOne)) {
          var html = tElement.html();
          var escapedHtml = escapeHTML(html);
          var prettifiedHtml = $window.prettyPrintOne(escapedHtml, tAttrs.lang, true);

          var container = angular.element(containerTemplate);
          var preElement = container.find('pre');

          preElement.html(prettifiedHtml);

          tElement.replaceWith(container);

          return function (scope, element, attrs) {
            attrs.$observe('title', function (titleText) {
              if (titleText !== undefined && titleText !== '') {
                var titleElement = angular.element(titleTemplate);
                titleElement.html(titleText);
                element.prepend(titleElement);
              }
            });
          };
        }

      }
    };
  }
  w11kPrettyPrint.$inject = ['$window'];

  var module = angular.module('w11k.slides');
  module.directive('w11kPrettyPrint', w11kPrettyPrint);
}());

(function() {
  'use strict';

  /* @ngInject */
  function initLanguage(Language) {
    Language.init();
  }
  initLanguage.$inject = ['Language'];

  /* @ngInject */
  function Language($rootScope) {
    var states = {
      'de': {
        de: true,
        en: false,
        name: 'de',
        next: 'enOnly'
      },
      'en': {
        de: false,
        en: true,
        name: 'en',
        next: 'de+en'
      },
      'de+en': {
        de: true,
        en: true,
        name: 'de+en',
        next: 'de'
      }
    };

    var currentState = states.de;

    this.toggle = function () {
      this.set(currentState.next);
    }.bind(this);

    this.set = function (state) {
      currentState = states[state];

      $rootScope.$broadcast('lang-de', currentState.de);
      $rootScope.$broadcast('lang-en', currentState.en);
    }.bind(this);

    this.get = function () {
      return currentState.name;
    }.bind(this);

    this.init = function () {
      $rootScope.$on('lang-de-current', function (event, callback) {
        callback(currentState.de);
      });

      $rootScope.$on('lang-en-current', function (event, callback) {
        callback(currentState.en);
      });
    }.bind(this);
  }
  Language.$inject = ['$rootScope'];

  var module = angular.module('w11k.slides');
  module.run(initLanguage);
  module.service('Language', Language);
}());

(function() {
  'use strict';

  /* @ngInject */
  function SourceSnippets($rootScope) {
    var states = {
      'js': {
        js: true,
        ts: false,
        name: 'js',
        next: 'tsOnly'
      },
      'ts': {
        js: false,
        ts: true,
        name: 'ts',
        next: 'js+ts'
      },
      'js+ts': {
        js: true,
        ts: true,
        name: 'js+ts',
        next: 'js'
      }
    };

    var currentState = states.js;

    $rootScope.$on('src-js-current', function (event, callback) {
      callback(currentState.js);
    });

    $rootScope.$on('src-ts-current', function (event, callback) {
      callback(currentState.ts);
    });

    this.toggle = function () {
      currentState = states[currentState.next];

      $rootScope.$broadcast('src-js', currentState.js);
      $rootScope.$broadcast('src-ts', currentState.ts);
    }.bind(this);

    this.set = function (state) {
      currentState = states[state];

      $rootScope.$broadcast('src-js', currentState.js);
      $rootScope.$broadcast('src-ts', currentState.ts);
    }.bind(this);

    this.get = function () {
      return currentState.name;
    }.bind(this);
  }
  SourceSnippets.$inject = ['$rootScope'];

  var module = angular.module('w11k.slides');
  module.service('SourceSnippets', SourceSnippets);
}());


(function () {
  'use strict';

  /* @ngInject */
  function SlidesService(slidesConfig, $location, $rootScope) {
    var activeSlide;

    function activateFirstSlide() {
      if (angular.isDefined(activeSlide)) {
        activeSlide.active = false;
      }
      activeSlide = slides[0];
      activeSlide.active = true;
    }

    var slides;
    var slidesMap = {};

    $rootScope.$on('$locationChangeSuccess', function () {
      var slideName = $location.path();

      if (slideName.substring(0, 1) === '/') {
        slideName = slideName.substring(1, slideName.length);
      }

      var slide = slidesMap[slideName];

      if (angular.isDefined(slide)) {
        slide.activate();
      }
    });

    function mapSlidesConfig() {
      var prefix = slidesConfig.slideTemplatePrefix || 'slides/content/';
      var suffix = slidesConfig.slideTemplateSuffix || '.html';

      slides = slidesConfig.slides.map(function (slide) {
        var slideObject = {
          name: slide,
          template: prefix + slide + suffix,
          active: false
        };

        slideObject.activate = function () {
          activeSlide.active = false;
          activeSlide = this;

          slideObject.active = true;
        };

        return slideObject;
      });

      for (var i = 0; i < slides.length; i++) {
        var element = slides[i];
        var previous;
        if (i > 0) {
          previous = slides[i - 1];
        }
        else {
          previous = slides[slides.length - 1];
        }

        var next;
        if (i + 1 < slides.length) {
          next = slides[i + 1];
        }
        else {
          next = slides[0];
        }

        element.previous = previous;
        element.next = next;

        slidesMap[element.name] = element;
      }
    }

    mapSlidesConfig();
    activateFirstSlide();

    this.getActiveSlide = function() {
      return activeSlide;
    };

    this.getSlides = function() {
      return slides;
    };

    this.navigateTo = function (slideName) {
      $location.path(slideName);
    };

    this.navigateToFirst = function() {
      $location.path(slides[0].name);
    };

    this.navigateToLast = function() {
      $location.path(slides[slides.length - 1].name);
    };

    this.navigateToOverview = function() {
      $location.path(slides[1].name);
    };

    this.navigateToNext = function () {
      var next = this.getActiveSlide().next;
      if (angular.isDefined(next)) {
        this.navigateTo(next.name);
      }
    }.bind(this);

    this.navigateToPrevious = function () {
      var previous = this.getActiveSlide().previous;
      if (angular.isDefined(previous)) {
        this.navigateTo(previous.name);
      }
    }.bind(this);
  }
  SlidesService.$inject = ['slidesConfig', '$location', '$rootScope'];

  /* @ngInject */
  function SlidesCtrl(SlidesService) {
    this.slides = SlidesService.getSlides();
  }
  SlidesCtrl.$inject = ['SlidesService'];

  /* @ngInject */
  function w11kSlideMasterDirective(slidesConfig) {
    var removeChildren = function (node) {
      var last = node.lastChild;
      if (last) {
        do {
          node.removeChild(last);
          last = node.lastChild;
        } while (last);
      }
    };

    return {
      templateUrl: function (element, attrs) {
        var key = attrs.w11kSlideMaster || attrs.master;
        var templateUrl = slidesConfig.masters[key];

        if (angular.isUndefined(templateUrl)) {
          throw new Error('No Mater-Slide found for "' + key + '". Please configure "slidesConfig" properly.');
        }

        return templateUrl;
      },
      restrict: 'EA',
      replace: true,
      transclude: true,
      link: function (scope, iElement, iAttrs, ctrl, transclude) {
        var transclusionScope;

        transclude(function (clone, scope) {

          for (var i = 0; i < clone.length; i++) {
            var part = clone[i];

            if (part !== undefined && angular.isFunction(part.getAttribute)) {
              var partName = part.getAttribute('w11k-slide-part-source');

              if (partName !== undefined && partName !== null) {
                var selector = '[w11k-slide-part-target="' + partName + '"]';
                var container = iElement[0].querySelector(selector);
                if (container !== null) {
                  removeChildren(container);
                  container.appendChild(part, container);
                  container.removeAttribute('w11k-slide-part-target');
                }
              }
            }
          }

          transclusionScope = scope;
        });

        scope.$on('$destroy', function () {
          transclusionScope.$destroy();
        });
      }
    };
  }
  w11kSlideMasterDirective.$inject = ['slidesConfig'];

  /* @ngInject */
  function w11kSlidesDirective($window, $document, SlidesService, slidesConfig, $injector) {
    return {
      restrict: 'EA',
      templateUrl: slidesConfig.directiveTemplateUrl || 'slides/slides.html',
      replace: true,
      link: function (scope, jqElement) {
        var element = jqElement[0];

        var localStorageModeKey = 'w11k-slides.mode';
        var mode = 'export';

        function toggleMode() {
          if (mode === 'export') {
            mode = 'screen';
          }
          else if (mode === 'screen') {
            mode = 'export';
          }

          setMode(mode);

          if (angular.isDefined($window.localStorage)) {
            $window.localStorage[localStorageModeKey] = mode;
          }
        }

        function setMode(mode) {
          if (mode === 'export') {
            element.classList.remove('screen');
            element.classList.add('export');
          }
          else if (mode === 'screen') {
            element.classList.remove('export');
            element.classList.add('screen');
          }
        }

        function toggleOverlay() {
          element.querySelector('div.overlay').classList.toggle('active');
        }

        function runDefaultAction(event) {
          var action;
          var actionType;

          // right or page down
          if (event.keyCode === 39 || event.keyCode === 34) {
            action = SlidesService.navigateToNext;
            actionType = 'navigate';
          }
          // left or page up
          else if (event.keyCode === 37 || event.keyCode === 33) {
            action = SlidesService.navigateToPrevious;
            actionType = 'navigate';
          }
          // pos 1
          else if (event.keyCode === 36) {
            action = SlidesService.navigateToFirst;
            actionType = 'navigate';
          }
          // end
          else if (event.keyCode === 35) {
            action = SlidesService.navigateToLast;
            actionType = 'navigate';
          }
          // o
          else if (event.keyCode === 79) {
            action = SlidesService.navigateToOverview;
            actionType = 'navigate';
          }
          // e
          else if (event.keyCode === 69) {
            action = toggleMode;
          }
          // p or period
          else if (event.keyCode === 80 || event.keyCode === 190) {
            action = toggleOverlay;
          }

          if (action) {
            scope.$apply(function () {
              action();
              if (actionType === 'navigate') {
                $window.scrollTo(0, 0);
              }
            });
          }
        }

        if (angular.isDefined($window.localStorage)) {
          if (angular.isDefined($window.localStorage[localStorageModeKey])) {
            mode = $window.localStorage[localStorageModeKey];
            setMode(mode);
          }
        }

        $document.bind('keydown', function (event) {

          if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
            return;
          }

          var tagName = event.target.tagName;
          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
            return;
          }

          if (slidesConfig.shortcuts) {
            var customShortcut = slidesConfig.shortcuts[event.keyCode];
            if (angular.isFunction(customShortcut) || angular.isArray(customShortcut)) {
              $injector.invoke(customShortcut, {$event: event});
            }
            else {
              runDefaultAction(event);
            }
          }
          else {
            runDefaultAction(event);
          }
        });
      }
    };
  }
  w11kSlidesDirective.$inject = ['$window', '$document', 'SlidesService', 'slidesConfig', '$injector'];

  var module = angular.module('w11k.slides');
  module.service('SlidesService', SlidesService);
  module.controller('SlidesCtrl', SlidesCtrl);
  module.directive('w11kSlideMaster', w11kSlideMasterDirective);
  module.directive('w11kSlides', w11kSlidesDirective);
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIncxMWstc2xpZGVzLmpzIiwiZXZlbnQtdG9nZ2xlL2V2ZW50LXRvZ2dsZS5qcyIsImZvb3Rlci9mb290ZXIuanMiLCJvcGVuLW9uY2UvY29uZmlybS11bmxvYWQuanMiLCJvcGVuLW9uY2Uvb3Blbi1vbmNlLmpzIiwicHJldHR5cHJpbnQvcHJldHR5cHJpbnQuanMiLCJzZXR0aW5ncy9sYW5ndWFnZS5qcyIsInNldHRpbmdzL3NvdXJjZS1zbmlwcGV0cy5qcyIsInNsaWRlcy9zbGlkZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxBQVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoidzExay1zbGlkZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJywgW10pO1xuXG4gIG1vZHVsZS5jb25zdGFudCgnc2xpZGVzQ29uZmlnJywge1xuICAgIHNsaWRlczogW10sXG4gICAgc2xpZGVUZW1wbGF0ZVByZWZpeDogJ3NsaWRlcy9jb250ZW50LycsXG4gICAgc2xpZGVUZW1wbGF0ZVN1ZmZpeDogJy5odG1sJyxcbiAgICBtYXN0ZXJzOiB7fSxcbiAgICBmb290ZXI6IHtcbiAgICAgIHRlbXBsYXRlVXJsOiAnZm9vdGVyL2Zvb3Rlci5odG1sJyxcbiAgICAgIGxlZnQ6ICcnLFxuICAgICAgbWlkZGxlOiAnJyxcbiAgICAgIHJpZ2h0OiAnJGluZGV4ICsgMSdcbiAgICB9XG4gIH0pO1xufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiB3MTFrRXZlbnRUb2dnbGUoJHJvb3RTY29wZSkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBqcUVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0ganFFbGVtZW50WzBdO1xuICAgICAgICB2YXIgb3JpZ2luYWxEaXNwbGF5O1xuICAgICAgICBzY29wZS4kb24oYXR0cnMudzExa0V2ZW50VG9nZ2xlLCBmdW5jdGlvbiAoZXZlbnQsIHZpc2libGUpIHtcbiAgICAgICAgICB0b2dnbGUodmlzaWJsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZSh2aXNpYmxlKSB7XG4gICAgICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IG9yaWdpbmFsRGlzcGxheTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcmlnaW5hbERpc3BsYXkgPSBlbGVtZW50LnN0eWxlLmRpc3BsYXk7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJHJvb3RTY29wZS4kZW1pdChhdHRycy53MTFrRXZlbnRUb2dnbGUgKyAnLWN1cnJlbnQnLCBmdW5jdGlvbih2aXNpYmxlKSB7XG4gICAgICAgICAgdG9nZ2xlKHZpc2libGUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHcxMWtFdmVudFRvZ2dsZS4kaW5qZWN0ID0gWyckcm9vdFNjb3BlJ107XG5cbiAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd3MTFrLnNsaWRlcycpO1xuICBtb2R1bGUuZGlyZWN0aXZlKCd3MTFrRXZlbnRUb2dnbGUnLCB3MTFrRXZlbnRUb2dnbGUpO1xufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiB3MTFrRm9vdGVyKHNsaWRlc0NvbmZpZykge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0VBJyxcbiAgICAgIHRlbXBsYXRlVXJsOiBzbGlkZXNDb25maWcuZm9vdGVyLnRlbXBsYXRlVXJsIHx8wqAnZm9vdGVyL2Zvb3Rlci50cGwuaHRtbCcsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIgbGVmdCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLmZvb3Rlci1sZWZ0Jyk7XG4gICAgICAgIHZhciBtaWRkbGUgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5mb290ZXItbWlkZGxlJyk7XG4gICAgICAgIHZhciByaWdodCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLmZvb3Rlci1yaWdodCcpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHNldENvbnRlbnQoZWxlbWVudCwgZXhwcmVzc2lvbikge1xuICAgICAgICAgIHZhciBjb250ZW50ID0gc2NvcGUuJGV2YWwoZXhwcmVzc2lvbik7XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGNvbnRlbnQpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGNvbnRlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0Q29udGVudChsZWZ0LCBhdHRycy5sZWZ0IHx8wqBzbGlkZXNDb25maWcuZm9vdGVyLmxlZnQpO1xuICAgICAgICBzZXRDb250ZW50KG1pZGRsZSwgYXR0cnMubWlkZGxlIHx8wqBzbGlkZXNDb25maWcuZm9vdGVyLm1pZGRsZSk7XG4gICAgICAgIHNldENvbnRlbnQocmlnaHQsIGF0dHJzLnJpZ2h0IHx8wqBzbGlkZXNDb25maWcuZm9vdGVyLnJpZ2h0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHcxMWtGb290ZXIuJGluamVjdCA9IFsnc2xpZGVzQ29uZmlnJ107XG5cbiAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd3MTFrLnNsaWRlcycpO1xuICBtb2R1bGUuZGlyZWN0aXZlKCd3MTFrRm9vdGVyJywgdzExa0Zvb3Rlcik7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIFVubG9hZENvbmZpcm0oJHdpbmRvdykge1xuICAgIHZhciBjb3VudGVyID0gMDtcblxuICAgIHRoaXMuaW5jcmVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb3VudGVyKys7XG4gICAgfTtcblxuICAgIHRoaXMuZGVjcmVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb3VudGVyLS07XG4gICAgfTtcblxuICAgICR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmIChjb3VudGVyID4gMCkge1xuICAgICAgICB2YXIgaGludCA9ICdFcyB3dXJkZSBtaW5kZXN0ZW5zIGVpbiBCZWlzcGllbCBnZcO2ZmZuZXQuIFdlbm4gZGllIFNlaXRlIG5ldSBnZWxhZGVuIHdpcmQsIG3DvHNzZW4gYmVpbSBlcm5ldXRlbiDDlmZmbmVuIGF1Y2ggZGllIEJlaXNwaWVsZSBuZXUgZ2VsYWRlbiB3ZXJkZW4uJztcbiAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBoaW50O1xuICAgICAgICByZXR1cm4gaGludDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFVubG9hZENvbmZpcm0uJGluamVjdCA9IFsnJHdpbmRvdyddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnNlcnZpY2UoJ1VubG9hZENvbmZpcm0nLCBVbmxvYWRDb25maXJtKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gdzExa09wZW5PbmNlKCR3aW5kb3csIFVubG9hZENvbmZpcm0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgdmFyIG5hbWVkV2luZG93O1xuXG4gICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICB2YXIgbm9OYW1lZFdpbmRvd09wZW4gPSBuYW1lZFdpbmRvdyA9PT0gdW5kZWZpbmVkIHx8IG5hbWVkV2luZG93ID09PSBudWxsIHx8IG5hbWVkV2luZG93LmNsb3NlZDtcbiAgICAgICAgICB2YXIgbGlua0F0dHJTZXQgPSBhdHRycy5ocmVmICE9PSB1bmRlZmluZWQgJiYgYXR0cnMuaHJlZiAhPT0gbnVsbCAmJiBhdHRycy50YXJnZXQgIT09IHVuZGVmaW5lZCAmJiBhdHRycy50YXJnZXQgIT09IG51bGw7XG4gICAgICAgICAgdmFyIG9wZW5PbmNlU2V0ID0gYXR0cnMudzExa09wZW5PbmNlID09PSAndHJ1ZSc7XG5cbiAgICAgICAgICBpZiAobm9OYW1lZFdpbmRvd09wZW4gJiYgbGlua0F0dHJTZXQgJiYgb3Blbk9uY2VTZXQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2V4YW1wbGUtc2hvd24nKTtcbiAgICAgICAgICAgIFVubG9hZENvbmZpcm0uaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBuYW1lZFdpbmRvdyA9ICR3aW5kb3cub3BlbihhdHRycy5ocmVmLCBhdHRycy50YXJnZXQpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5vTmFtZWRXaW5kb3dPcGVuID09PSBmYWxzZSAmJiBvcGVuT25jZVNldCkge1xuICAgICAgICAgICAgbmFtZWRXaW5kb3cuZm9jdXMoKTtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2V4YW1wbGUtc2hvd24nKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHcxMWtPcGVuT25jZS4kaW5qZWN0ID0gWyckd2luZG93JywgJ1VubG9hZENvbmZpcm0nXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtPcGVuT25jZScsIHcxMWtPcGVuT25jZSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiB3MTFrUHJldHR5UHJpbnQoJHdpbmRvdykge1xuXG4gICAgdmFyIGVzY2FwZUhUTUwgPSBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoaHRtbCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaHRtbC5yZXBsYWNlKC8+L2csICcmZ3Q7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcbiAgICB9O1xuXG4gICAgdmFyIGNvbnRhaW5lclRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCJ3MTFrLXByZXR0eS1wcmludFwiPjxwcmUgY2xhc3M9XCJwcmV0dHlwcmludCBsaW5lbnVtc1wiPjwvcHJlPjwvZGl2Pic7XG4gICAgdmFyIHRpdGxlVGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cInRpdGxlXCI+PC9kaXY+JztcblxuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgICBjb21waWxlOiBmdW5jdGlvbiAodEVsZW1lbnQsIHRBdHRycykge1xuICAgICAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKCR3aW5kb3cucHJldHR5UHJpbnRPbmUpKSB7XG4gICAgICAgICAgdmFyIGh0bWwgPSB0RWxlbWVudC5odG1sKCk7XG4gICAgICAgICAgdmFyIGVzY2FwZWRIdG1sID0gZXNjYXBlSFRNTChodG1sKTtcbiAgICAgICAgICB2YXIgcHJldHRpZmllZEh0bWwgPSAkd2luZG93LnByZXR0eVByaW50T25lKGVzY2FwZWRIdG1sLCB0QXR0cnMubGFuZywgdHJ1ZSk7XG5cbiAgICAgICAgICB2YXIgY29udGFpbmVyID0gYW5ndWxhci5lbGVtZW50KGNvbnRhaW5lclRlbXBsYXRlKTtcbiAgICAgICAgICB2YXIgcHJlRWxlbWVudCA9IGNvbnRhaW5lci5maW5kKCdwcmUnKTtcblxuICAgICAgICAgIHByZUVsZW1lbnQuaHRtbChwcmV0dGlmaWVkSHRtbCk7XG5cbiAgICAgICAgICB0RWxlbWVudC5yZXBsYWNlV2l0aChjb250YWluZXIpO1xuXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIGF0dHJzLiRvYnNlcnZlKCd0aXRsZScsIGZ1bmN0aW9uICh0aXRsZVRleHQpIHtcbiAgICAgICAgICAgICAgaWYgKHRpdGxlVGV4dCAhPT0gdW5kZWZpbmVkICYmIHRpdGxlVGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGl0bGVFbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KHRpdGxlVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIHRpdGxlRWxlbWVudC5odG1sKHRpdGxlVGV4dCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5wcmVwZW5kKHRpdGxlRWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa1ByZXR0eVByaW50LiRpbmplY3QgPSBbJyR3aW5kb3cnXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtQcmV0dHlQcmludCcsIHcxMWtQcmV0dHlQcmludCk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIGluaXRMYW5ndWFnZShMYW5ndWFnZSkge1xuICAgIExhbmd1YWdlLmluaXQoKTtcbiAgfVxuICBpbml0TGFuZ3VhZ2UuJGluamVjdCA9IFsnTGFuZ3VhZ2UnXTtcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gTGFuZ3VhZ2UoJHJvb3RTY29wZSkge1xuICAgIHZhciBzdGF0ZXMgPSB7XG4gICAgICAnZGUnOiB7XG4gICAgICAgIGRlOiB0cnVlLFxuICAgICAgICBlbjogZmFsc2UsXG4gICAgICAgIG5hbWU6ICdkZScsXG4gICAgICAgIG5leHQ6ICdlbk9ubHknXG4gICAgICB9LFxuICAgICAgJ2VuJzoge1xuICAgICAgICBkZTogZmFsc2UsXG4gICAgICAgIGVuOiB0cnVlLFxuICAgICAgICBuYW1lOiAnZW4nLFxuICAgICAgICBuZXh0OiAnZGUrZW4nXG4gICAgICB9LFxuICAgICAgJ2RlK2VuJzoge1xuICAgICAgICBkZTogdHJ1ZSxcbiAgICAgICAgZW46IHRydWUsXG4gICAgICAgIG5hbWU6ICdkZStlbicsXG4gICAgICAgIG5leHQ6ICdkZSdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHN0YXRlcy5kZTtcblxuICAgIHRoaXMudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXQoY3VycmVudFN0YXRlLm5leHQpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICBjdXJyZW50U3RhdGUgPSBzdGF0ZXNbc3RhdGVdO1xuXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xhbmctZGUnLCBjdXJyZW50U3RhdGUuZGUpO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdsYW5nLWVuJywgY3VycmVudFN0YXRlLmVuKTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjdXJyZW50U3RhdGUubmFtZTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkcm9vdFNjb3BlLiRvbignbGFuZy1kZS1jdXJyZW50JywgZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayhjdXJyZW50U3RhdGUuZGUpO1xuICAgICAgfSk7XG5cbiAgICAgICRyb290U2NvcGUuJG9uKCdsYW5nLWVuLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKGN1cnJlbnRTdGF0ZS5lbik7XG4gICAgICB9KTtcbiAgICB9LmJpbmQodGhpcyk7XG4gIH1cbiAgTGFuZ3VhZ2UuJGluamVjdCA9IFsnJHJvb3RTY29wZSddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnJ1bihpbml0TGFuZ3VhZ2UpO1xuICBtb2R1bGUuc2VydmljZSgnTGFuZ3VhZ2UnLCBMYW5ndWFnZSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIFNvdXJjZVNuaXBwZXRzKCRyb290U2NvcGUpIHtcbiAgICB2YXIgc3RhdGVzID0ge1xuICAgICAgJ2pzJzoge1xuICAgICAgICBqczogdHJ1ZSxcbiAgICAgICAgdHM6IGZhbHNlLFxuICAgICAgICBuYW1lOiAnanMnLFxuICAgICAgICBuZXh0OiAndHNPbmx5J1xuICAgICAgfSxcbiAgICAgICd0cyc6IHtcbiAgICAgICAganM6IGZhbHNlLFxuICAgICAgICB0czogdHJ1ZSxcbiAgICAgICAgbmFtZTogJ3RzJyxcbiAgICAgICAgbmV4dDogJ2pzK3RzJ1xuICAgICAgfSxcbiAgICAgICdqcyt0cyc6IHtcbiAgICAgICAganM6IHRydWUsXG4gICAgICAgIHRzOiB0cnVlLFxuICAgICAgICBuYW1lOiAnanMrdHMnLFxuICAgICAgICBuZXh0OiAnanMnXG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjdXJyZW50U3RhdGUgPSBzdGF0ZXMuanM7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignc3JjLWpzLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhjdXJyZW50U3RhdGUuanMpO1xuICAgIH0pO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ3NyYy10cy1jdXJyZW50JywgZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soY3VycmVudFN0YXRlLnRzKTtcbiAgICB9KTtcblxuICAgIHRoaXMudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgY3VycmVudFN0YXRlID0gc3RhdGVzW2N1cnJlbnRTdGF0ZS5uZXh0XTtcblxuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzcmMtanMnLCBjdXJyZW50U3RhdGUuanMpO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzcmMtdHMnLCBjdXJyZW50U3RhdGUudHMpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICBjdXJyZW50U3RhdGUgPSBzdGF0ZXNbc3RhdGVdO1xuXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NyYy1qcycsIGN1cnJlbnRTdGF0ZS5qcyk7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NyYy10cycsIGN1cnJlbnRTdGF0ZS50cyk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY3VycmVudFN0YXRlLm5hbWU7XG4gICAgfS5iaW5kKHRoaXMpO1xuICB9XG4gIFNvdXJjZVNuaXBwZXRzLiRpbmplY3QgPSBbJyRyb290U2NvcGUnXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5zZXJ2aWNlKCdTb3VyY2VTbmlwcGV0cycsIFNvdXJjZVNuaXBwZXRzKTtcbn0oKSk7XG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gU2xpZGVzU2VydmljZShzbGlkZXNDb25maWcsICRsb2NhdGlvbiwgJHJvb3RTY29wZSkge1xuICAgIHZhciBhY3RpdmVTbGlkZTtcblxuICAgIGZ1bmN0aW9uIGFjdGl2YXRlRmlyc3RTbGlkZSgpIHtcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChhY3RpdmVTbGlkZSkpIHtcbiAgICAgICAgYWN0aXZlU2xpZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBhY3RpdmVTbGlkZSA9IHNsaWRlc1swXTtcbiAgICAgIGFjdGl2ZVNsaWRlLmFjdGl2ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIHNsaWRlcztcbiAgICB2YXIgc2xpZGVzTWFwID0ge307XG5cbiAgICAkcm9vdFNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzbGlkZU5hbWUgPSAkbG9jYXRpb24ucGF0aCgpO1xuXG4gICAgICBpZiAoc2xpZGVOYW1lLnN1YnN0cmluZygwLCAxKSA9PT0gJy8nKSB7XG4gICAgICAgIHNsaWRlTmFtZSA9IHNsaWRlTmFtZS5zdWJzdHJpbmcoMSwgc2xpZGVOYW1lLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBzbGlkZSA9IHNsaWRlc01hcFtzbGlkZU5hbWVdO1xuXG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoc2xpZGUpKSB7XG4gICAgICAgIHNsaWRlLmFjdGl2YXRlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtYXBTbGlkZXNDb25maWcoKSB7XG4gICAgICB2YXIgcHJlZml4ID0gc2xpZGVzQ29uZmlnLnNsaWRlVGVtcGxhdGVQcmVmaXggfHwgJ3NsaWRlcy9jb250ZW50Lyc7XG4gICAgICB2YXIgc3VmZml4ID0gc2xpZGVzQ29uZmlnLnNsaWRlVGVtcGxhdGVTdWZmaXggfHwgJy5odG1sJztcblxuICAgICAgc2xpZGVzID0gc2xpZGVzQ29uZmlnLnNsaWRlcy5tYXAoZnVuY3Rpb24gKHNsaWRlKSB7XG4gICAgICAgIHZhciBzbGlkZU9iamVjdCA9IHtcbiAgICAgICAgICBuYW1lOiBzbGlkZSxcbiAgICAgICAgICB0ZW1wbGF0ZTogcHJlZml4ICsgc2xpZGUgKyBzdWZmaXgsXG4gICAgICAgICAgYWN0aXZlOiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHNsaWRlT2JqZWN0LmFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGFjdGl2ZVNsaWRlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIGFjdGl2ZVNsaWRlID0gdGhpcztcblxuICAgICAgICAgIHNsaWRlT2JqZWN0LmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHNsaWRlT2JqZWN0O1xuICAgICAgfSk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gc2xpZGVzW2ldO1xuICAgICAgICB2YXIgcHJldmlvdXM7XG4gICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgIHByZXZpb3VzID0gc2xpZGVzW2kgLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBwcmV2aW91cyA9IHNsaWRlc1tzbGlkZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV4dDtcbiAgICAgICAgaWYgKGkgKyAxIDwgc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgIG5leHQgPSBzbGlkZXNbaSArIDFdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG5leHQgPSBzbGlkZXNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnByZXZpb3VzID0gcHJldmlvdXM7XG4gICAgICAgIGVsZW1lbnQubmV4dCA9IG5leHQ7XG5cbiAgICAgICAgc2xpZGVzTWFwW2VsZW1lbnQubmFtZV0gPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIG1hcFNsaWRlc0NvbmZpZygpO1xuICAgIGFjdGl2YXRlRmlyc3RTbGlkZSgpO1xuXG4gICAgdGhpcy5nZXRBY3RpdmVTbGlkZSA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgIHJldHVybiBhY3RpdmVTbGlkZTtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRTbGlkZXMgPSBmdW5jdGlvbigpwqB7XG4gICAgICByZXR1cm4gc2xpZGVzO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAoc2xpZGVOYW1lKSB7XG4gICAgICAkbG9jYXRpb24ucGF0aChzbGlkZU5hbWUpO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9GaXJzdCA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgICRsb2NhdGlvbi5wYXRoKHNsaWRlc1swXS5uYW1lKTtcbiAgICB9O1xuXG4gICAgdGhpcy5uYXZpZ2F0ZVRvTGFzdCA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgICRsb2NhdGlvbi5wYXRoKHNsaWRlc1tzbGlkZXMubGVuZ3RoIC0gMV0ubmFtZSk7XG4gICAgfTtcblxuICAgIHRoaXMubmF2aWdhdGVUb092ZXJ2aWV3ID0gZnVuY3Rpb24oKcKge1xuICAgICAgJGxvY2F0aW9uLnBhdGgoc2xpZGVzWzFdLm5hbWUpO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9OZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5leHQgPSB0aGlzLmdldEFjdGl2ZVNsaWRlKCkubmV4dDtcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChuZXh0KSkge1xuICAgICAgICB0aGlzLm5hdmlnYXRlVG8obmV4dC5uYW1lKTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9QcmV2aW91cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBwcmV2aW91cyA9IHRoaXMuZ2V0QWN0aXZlU2xpZGUoKS5wcmV2aW91cztcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChwcmV2aW91cykpIHtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVRvKHByZXZpb3VzLm5hbWUpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcbiAgfVxuICBTbGlkZXNTZXJ2aWNlLiRpbmplY3QgPSBbJ3NsaWRlc0NvbmZpZycsICckbG9jYXRpb24nLCAnJHJvb3RTY29wZSddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiBTbGlkZXNDdHJsKFNsaWRlc1NlcnZpY2UpIHtcbiAgICB0aGlzLnNsaWRlcyA9IFNsaWRlc1NlcnZpY2UuZ2V0U2xpZGVzKCk7XG4gIH1cbiAgU2xpZGVzQ3RybC4kaW5qZWN0ID0gWydTbGlkZXNTZXJ2aWNlJ107XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtTbGlkZU1hc3RlckRpcmVjdGl2ZShzbGlkZXNDb25maWcpIHtcbiAgICB2YXIgcmVtb3ZlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgdmFyIGxhc3QgPSBub2RlLmxhc3RDaGlsZDtcbiAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKGxhc3QpO1xuICAgICAgICAgIGxhc3QgPSBub2RlLmxhc3RDaGlsZDtcbiAgICAgICAgfSB3aGlsZSAobGFzdCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24gKGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciBrZXkgPSBhdHRycy53MTFrU2xpZGVNYXN0ZXIgfHwgYXR0cnMubWFzdGVyO1xuICAgICAgICB2YXIgdGVtcGxhdGVVcmwgPSBzbGlkZXNDb25maWcubWFzdGVyc1trZXldO1xuXG4gICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHRlbXBsYXRlVXJsKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gTWF0ZXItU2xpZGUgZm91bmQgZm9yIFwiJyArIGtleSArICdcIi4gUGxlYXNlIGNvbmZpZ3VyZSBcInNsaWRlc0NvbmZpZ1wiIHByb3Blcmx5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlVXJsO1xuICAgICAgfSxcbiAgICAgIHJlc3RyaWN0OiAnRUEnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGlFbGVtZW50LCBpQXR0cnMsIGN0cmwsIHRyYW5zY2x1ZGUpIHtcbiAgICAgICAgdmFyIHRyYW5zY2x1c2lvblNjb3BlO1xuXG4gICAgICAgIHRyYW5zY2x1ZGUoZnVuY3Rpb24gKGNsb25lLCBzY29wZSkge1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbG9uZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBhcnQgPSBjbG9uZVtpXTtcblxuICAgICAgICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCAmJiBhbmd1bGFyLmlzRnVuY3Rpb24ocGFydC5nZXRBdHRyaWJ1dGUpKSB7XG4gICAgICAgICAgICAgIHZhciBwYXJ0TmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKCd3MTFrLXNsaWRlLXBhcnQtc291cmNlJyk7XG5cbiAgICAgICAgICAgICAgaWYgKHBhcnROYW1lICE9PSB1bmRlZmluZWQgJiYgcGFydE5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSAnW3cxMWstc2xpZGUtcGFydC10YXJnZXQ9XCInICsgcGFydE5hbWUgKyAnXCJdJztcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gaUVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgcmVtb3ZlQ2hpbGRyZW4oY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChwYXJ0LCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgY29udGFpbmVyLnJlbW92ZUF0dHJpYnV0ZSgndzExay1zbGlkZS1wYXJ0LXRhcmdldCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyYW5zY2x1c2lvblNjb3BlID0gc2NvcGU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdHJhbnNjbHVzaW9uU2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB3MTFrU2xpZGVNYXN0ZXJEaXJlY3RpdmUuJGluamVjdCA9IFsnc2xpZGVzQ29uZmlnJ107XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtTbGlkZXNEaXJlY3RpdmUoJHdpbmRvdywgJGRvY3VtZW50LCBTbGlkZXNTZXJ2aWNlLCBzbGlkZXNDb25maWcsICRpbmplY3Rvcikge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0VBJyxcbiAgICAgIHRlbXBsYXRlVXJsOiBzbGlkZXNDb25maWcuZGlyZWN0aXZlVGVtcGxhdGVVcmwgfHwgJ3NsaWRlcy9zbGlkZXMuaHRtbCcsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBqcUVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBqcUVsZW1lbnRbMF07XG5cbiAgICAgICAgdmFyIGxvY2FsU3RvcmFnZU1vZGVLZXkgPSAndzExay1zbGlkZXMubW9kZSc7XG4gICAgICAgIHZhciBtb2RlID0gJ2V4cG9ydCc7XG5cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlTW9kZSgpIHtcbiAgICAgICAgICBpZiAobW9kZSA9PT0gJ2V4cG9ydCcpIHtcbiAgICAgICAgICAgIG1vZGUgPSAnc2NyZWVuJztcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gJ3NjcmVlbicpIHtcbiAgICAgICAgICAgIG1vZGUgPSAnZXhwb3J0JztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXRNb2RlKG1vZGUpO1xuXG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKCR3aW5kb3cubG9jYWxTdG9yYWdlKSkge1xuICAgICAgICAgICAgJHdpbmRvdy5sb2NhbFN0b3JhZ2VbbG9jYWxTdG9yYWdlTW9kZUtleV0gPSBtb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldE1vZGUobW9kZSkge1xuICAgICAgICAgIGlmIChtb2RlID09PSAnZXhwb3J0Jykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdzY3JlZW4nKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZXhwb3J0Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKG1vZGUgPT09ICdzY3JlZW4nKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2V4cG9ydCcpO1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzY3JlZW4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVPdmVybGF5KCkge1xuICAgICAgICAgIGVsZW1lbnQucXVlcnlTZWxlY3RvcignZGl2Lm92ZXJsYXknKS5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJ1bkRlZmF1bHRBY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgYWN0aW9uO1xuICAgICAgICAgIHZhciBhY3Rpb25UeXBlO1xuXG4gICAgICAgICAgLy8gcmlnaHQgb3IgcGFnZSBkb3duXG4gICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM5IHx8IGV2ZW50LmtleUNvZGUgPT09IDM0KSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9OZXh0O1xuICAgICAgICAgICAgYWN0aW9uVHlwZSA9ICduYXZpZ2F0ZSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGxlZnQgb3IgcGFnZSB1cFxuICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM3IHx8IGV2ZW50LmtleUNvZGUgPT09IDMzKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9QcmV2aW91cztcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBwb3MgMVxuICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM2KSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9GaXJzdDtcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBlbmRcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAzNSkge1xuICAgICAgICAgICAgYWN0aW9uID0gU2xpZGVzU2VydmljZS5uYXZpZ2F0ZVRvTGFzdDtcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBvXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNzkpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IFNsaWRlc1NlcnZpY2UubmF2aWdhdGVUb092ZXJ2aWV3O1xuICAgICAgICAgICAgYWN0aW9uVHlwZSA9ICduYXZpZ2F0ZSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGVcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSA2OSkge1xuICAgICAgICAgICAgYWN0aW9uID0gdG9nZ2xlTW9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gcCBvciBwZXJpb2RcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSA4MCB8fCBldmVudC5rZXlDb2RlID09PSAxOTApIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IHRvZ2dsZU92ZXJsYXk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgYWN0aW9uKCk7XG4gICAgICAgICAgICAgIGlmIChhY3Rpb25UeXBlID09PSAnbmF2aWdhdGUnKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKCR3aW5kb3cubG9jYWxTdG9yYWdlKSkge1xuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCgkd2luZG93LmxvY2FsU3RvcmFnZVtsb2NhbFN0b3JhZ2VNb2RlS2V5XSkpIHtcbiAgICAgICAgICAgIG1vZGUgPSAkd2luZG93LmxvY2FsU3RvcmFnZVtsb2NhbFN0b3JhZ2VNb2RlS2V5XTtcbiAgICAgICAgICAgIHNldE1vZGUobW9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJGRvY3VtZW50LmJpbmQoJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgIGlmIChldmVudC5hbHRLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5zaGlmdEtleSB8fCBldmVudC5tZXRhS2V5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHRhZ05hbWUgPSBldmVudC50YXJnZXQudGFnTmFtZTtcbiAgICAgICAgICBpZiAodGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCB0YWdOYW1lID09PSAnVEVYVEFSRUEnIHx8IGV2ZW50LnRhcmdldC5jb250ZW50RWRpdGFibGUgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzbGlkZXNDb25maWcuc2hvcnRjdXRzKSB7XG4gICAgICAgICAgICB2YXIgY3VzdG9tU2hvcnRjdXQgPSBzbGlkZXNDb25maWcuc2hvcnRjdXRzW2V2ZW50LmtleUNvZGVdO1xuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbihjdXN0b21TaG9ydGN1dCkgfHwgYW5ndWxhci5pc0FycmF5KGN1c3RvbVNob3J0Y3V0KSkge1xuICAgICAgICAgICAgICAkaW5qZWN0b3IuaW52b2tlKGN1c3RvbVNob3J0Y3V0LCB7JGV2ZW50OiBldmVudH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHJ1bkRlZmF1bHRBY3Rpb24oZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJ1bkRlZmF1bHRBY3Rpb24oZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB3MTFrU2xpZGVzRGlyZWN0aXZlLiRpbmplY3QgPSBbJyR3aW5kb3cnLCAnJGRvY3VtZW50JywgJ1NsaWRlc1NlcnZpY2UnLCAnc2xpZGVzQ29uZmlnJywgJyRpbmplY3RvciddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnNlcnZpY2UoJ1NsaWRlc1NlcnZpY2UnLCBTbGlkZXNTZXJ2aWNlKTtcbiAgbW9kdWxlLmNvbnRyb2xsZXIoJ1NsaWRlc0N0cmwnLCBTbGlkZXNDdHJsKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa1NsaWRlTWFzdGVyJywgdzExa1NsaWRlTWFzdGVyRGlyZWN0aXZlKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa1NsaWRlcycsIHcxMWtTbGlkZXNEaXJlY3RpdmUpO1xufSgpKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
