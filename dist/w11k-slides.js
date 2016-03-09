/**
 * w11k-slides
 *
 * @version v0.13.0
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
  function SlidesService(slidesConfig, $location, $rootScope, $window) {
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

    var localStorageModeKey = 'w11k-slides.mode';
    var mode = 'export';

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

    this.getMode = function () {
      return mode;
    }.bind(this);

    this.setMode = function (newMode) {
      mode = newMode;

      if (angular.isDefined($window.localStorage)) {
        $window.localStorage[localStorageModeKey] = mode;
      }

      $rootScope.$emit(this.events.modeChanged, mode);
    }.bind(this);

    this.toggleMode = function () {
      var newMode;

      if (mode === 'export') {
        newMode = 'screen';
      }
      else if (mode === 'screen') {
        newMode = 'export';
      }

      this.setMode(newMode);
    }.bind(this);

    this.events = {
      modeChanged: 'w11k-slides.modeChanged'
    };
  }
  SlidesService.$inject = ['slidesConfig', '$location', '$rootScope', '$window'];

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
  function w11kSlidesDirective($window, $document, SlidesService, slidesConfig, $injector, $rootScope) {
    return {
      restrict: 'EA',
      templateUrl: slidesConfig.directiveTemplateUrl || 'slides/slides.html',
      replace: true,
      link: function (scope, jqElement) {
        var element = jqElement[0];

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

        function toggleMode() {
          SlidesService.toggleMode();
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

        setMode(SlidesService.getMode());

        $rootScope.$on(SlidesService.events.modeChanged, function (event, mode) {
          setMode(mode);
        });

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
  w11kSlidesDirective.$inject = ['$window', '$document', 'SlidesService', 'slidesConfig', '$injector', '$rootScope'];

  var module = angular.module('w11k.slides');
  module.service('SlidesService', SlidesService);
  module.controller('SlidesCtrl', SlidesCtrl);
  module.directive('w11kSlideMaster', w11kSlideMasterDirective);
  module.directive('w11kSlides', w11kSlidesDirective);
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIncxMWstc2xpZGVzLmpzIiwiZXZlbnQtdG9nZ2xlL2V2ZW50LXRvZ2dsZS5qcyIsIm9wZW4tb25jZS9jb25maXJtLXVubG9hZC5qcyIsIm9wZW4tb25jZS9vcGVuLW9uY2UuanMiLCJmb290ZXIvZm9vdGVyLmpzIiwicHJldHR5cHJpbnQvcHJldHR5cHJpbnQuanMiLCJzZXR0aW5ncy9sYW5ndWFnZS5qcyIsInNldHRpbmdzL3NvdXJjZS1zbmlwcGV0cy5qcyIsInNsaWRlcy9zbGlkZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxBQVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ3MTFrLXNsaWRlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnLCBbXSk7XG5cbiAgbW9kdWxlLmNvbnN0YW50KCdzbGlkZXNDb25maWcnLCB7XG4gICAgc2xpZGVzOiBbXSxcbiAgICBzbGlkZVRlbXBsYXRlUHJlZml4OiAnc2xpZGVzL2NvbnRlbnQvJyxcbiAgICBzbGlkZVRlbXBsYXRlU3VmZml4OiAnLmh0bWwnLFxuICAgIG1hc3RlcnM6IHt9LFxuICAgIGZvb3Rlcjoge1xuICAgICAgdGVtcGxhdGVVcmw6ICdmb290ZXIvZm9vdGVyLmh0bWwnLFxuICAgICAgbGVmdDogJycsXG4gICAgICBtaWRkbGU6ICcnLFxuICAgICAgcmlnaHQ6ICckaW5kZXggKyAxJ1xuICAgIH1cbiAgfSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtFdmVudFRvZ2dsZSgkcm9vdFNjb3BlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGpxRWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBqcUVsZW1lbnRbMF07XG4gICAgICAgIHZhciBvcmlnaW5hbERpc3BsYXk7XG4gICAgICAgIHNjb3BlLiRvbihhdHRycy53MTFrRXZlbnRUb2dnbGUsIGZ1bmN0aW9uIChldmVudCwgdmlzaWJsZSkge1xuICAgICAgICAgIHRvZ2dsZSh2aXNpYmxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlKHZpc2libGUpIHtcbiAgICAgICAgICBpZiAodmlzaWJsZSkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gb3JpZ2luYWxEaXNwbGF5O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9yaWdpbmFsRGlzcGxheSA9IGVsZW1lbnQuc3R5bGUuZGlzcGxheTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KGF0dHJzLncxMWtFdmVudFRvZ2dsZSArICctY3VycmVudCcsIGZ1bmN0aW9uKHZpc2libGUpIHtcbiAgICAgICAgICB0b2dnbGUodmlzaWJsZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa0V2ZW50VG9nZ2xlLiRpbmplY3QgPSBbJyRyb290U2NvcGUnXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtFdmVudFRvZ2dsZScsIHcxMWtFdmVudFRvZ2dsZSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIFVubG9hZENvbmZpcm0oJHdpbmRvdykge1xuICAgIHZhciBjb3VudGVyID0gMDtcblxuICAgIHRoaXMuaW5jcmVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb3VudGVyKys7XG4gICAgfTtcblxuICAgIHRoaXMuZGVjcmVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jb3VudGVyLS07XG4gICAgfTtcblxuICAgICR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmIChjb3VudGVyID4gMCkge1xuICAgICAgICB2YXIgaGludCA9ICdFcyB3dXJkZSBtaW5kZXN0ZW5zIGVpbiBCZWlzcGllbCBnZcO2ZmZuZXQuIFdlbm4gZGllIFNlaXRlIG5ldSBnZWxhZGVuIHdpcmQsIG3DvHNzZW4gYmVpbSBlcm5ldXRlbiDDlmZmbmVuIGF1Y2ggZGllIEJlaXNwaWVsZSBuZXUgZ2VsYWRlbiB3ZXJkZW4uJztcbiAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBoaW50O1xuICAgICAgICByZXR1cm4gaGludDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFVubG9hZENvbmZpcm0uJGluamVjdCA9IFsnJHdpbmRvdyddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnNlcnZpY2UoJ1VubG9hZENvbmZpcm0nLCBVbmxvYWRDb25maXJtKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gdzExa09wZW5PbmNlKCR3aW5kb3csIFVubG9hZENvbmZpcm0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgdmFyIG5hbWVkV2luZG93O1xuXG4gICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICB2YXIgbm9OYW1lZFdpbmRvd09wZW4gPSBuYW1lZFdpbmRvdyA9PT0gdW5kZWZpbmVkIHx8IG5hbWVkV2luZG93ID09PSBudWxsIHx8IG5hbWVkV2luZG93LmNsb3NlZDtcbiAgICAgICAgICB2YXIgbGlua0F0dHJTZXQgPSBhdHRycy5ocmVmICE9PSB1bmRlZmluZWQgJiYgYXR0cnMuaHJlZiAhPT0gbnVsbCAmJiBhdHRycy50YXJnZXQgIT09IHVuZGVmaW5lZCAmJiBhdHRycy50YXJnZXQgIT09IG51bGw7XG4gICAgICAgICAgdmFyIG9wZW5PbmNlU2V0ID0gYXR0cnMudzExa09wZW5PbmNlID09PSAndHJ1ZSc7XG5cbiAgICAgICAgICBpZiAobm9OYW1lZFdpbmRvd09wZW4gJiYgbGlua0F0dHJTZXQgJiYgb3Blbk9uY2VTZXQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2V4YW1wbGUtc2hvd24nKTtcbiAgICAgICAgICAgIFVubG9hZENvbmZpcm0uaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBuYW1lZFdpbmRvdyA9ICR3aW5kb3cub3BlbihhdHRycy5ocmVmLCBhdHRycy50YXJnZXQpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5vTmFtZWRXaW5kb3dPcGVuID09PSBmYWxzZSAmJiBvcGVuT25jZVNldCkge1xuICAgICAgICAgICAgbmFtZWRXaW5kb3cuZm9jdXMoKTtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2V4YW1wbGUtc2hvd24nKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHcxMWtPcGVuT25jZS4kaW5qZWN0ID0gWyckd2luZG93JywgJ1VubG9hZENvbmZpcm0nXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtPcGVuT25jZScsIHcxMWtPcGVuT25jZSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtGb290ZXIoc2xpZGVzQ29uZmlnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRUEnLFxuICAgICAgdGVtcGxhdGVVcmw6IHNsaWRlc0NvbmZpZy5mb290ZXIudGVtcGxhdGVVcmwgfHzCoCdmb290ZXIvZm9vdGVyLnRwbC5odG1sJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciBsZWZ0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcuZm9vdGVyLWxlZnQnKTtcbiAgICAgICAgdmFyIG1pZGRsZSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLmZvb3Rlci1taWRkbGUnKTtcbiAgICAgICAgdmFyIHJpZ2h0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcuZm9vdGVyLXJpZ2h0Jyk7XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0Q29udGVudChlbGVtZW50LCBleHByZXNzaW9uKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSBzY29wZS4kZXZhbChleHByZXNzaW9uKTtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoY29udGVudCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZXRDb250ZW50KGxlZnQsIGF0dHJzLmxlZnQgfHzCoHNsaWRlc0NvbmZpZy5mb290ZXIubGVmdCk7XG4gICAgICAgIHNldENvbnRlbnQobWlkZGxlLCBhdHRycy5taWRkbGUgfHzCoHNsaWRlc0NvbmZpZy5mb290ZXIubWlkZGxlKTtcbiAgICAgICAgc2V0Q29udGVudChyaWdodCwgYXR0cnMucmlnaHQgfHzCoHNsaWRlc0NvbmZpZy5mb290ZXIucmlnaHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa0Zvb3Rlci4kaW5qZWN0ID0gWydzbGlkZXNDb25maWcnXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtGb290ZXInLCB3MTFrRm9vdGVyKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtQcmV0dHlQcmludCgkd2luZG93KSB7XG5cbiAgICB2YXIgZXNjYXBlSFRNTCA9IGZ1bmN0aW9uIChodG1sKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChodG1sKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuICAgIH07XG5cbiAgICB2YXIgY29udGFpbmVyVGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cIncxMWstcHJldHR5LXByaW50XCI+PHByZSBjbGFzcz1cInByZXR0eXByaW50IGxpbmVudW1zXCI+PC9wcmU+PC9kaXY+JztcbiAgICB2YXIgdGl0bGVUZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwidGl0bGVcIj48L2Rpdj4nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uICh0RWxlbWVudCwgdEF0dHJzKSB7XG4gICAgICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oJHdpbmRvdy5wcmV0dHlQcmludE9uZSkpIHtcbiAgICAgICAgICB2YXIgaHRtbCA9IHRFbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgICB2YXIgZXNjYXBlZEh0bWwgPSBlc2NhcGVIVE1MKGh0bWwpO1xuICAgICAgICAgIHZhciBwcmV0dGlmaWVkSHRtbCA9ICR3aW5kb3cucHJldHR5UHJpbnRPbmUoZXNjYXBlZEh0bWwsIHRBdHRycy5sYW5nLCB0cnVlKTtcblxuICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmd1bGFyLmVsZW1lbnQoY29udGFpbmVyVGVtcGxhdGUpO1xuICAgICAgICAgIHZhciBwcmVFbGVtZW50ID0gY29udGFpbmVyLmZpbmQoJ3ByZScpO1xuXG4gICAgICAgICAgcHJlRWxlbWVudC5odG1sKHByZXR0aWZpZWRIdG1sKTtcblxuICAgICAgICAgIHRFbGVtZW50LnJlcGxhY2VXaXRoKGNvbnRhaW5lcik7XG5cbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgYXR0cnMuJG9ic2VydmUoJ3RpdGxlJywgZnVuY3Rpb24gKHRpdGxlVGV4dCkge1xuICAgICAgICAgICAgICBpZiAodGl0bGVUZXh0ICE9PSB1bmRlZmluZWQgJiYgdGl0bGVUZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHZhciB0aXRsZUVsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQodGl0bGVUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgdGl0bGVFbGVtZW50Lmh0bWwodGl0bGVUZXh0KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnByZXBlbmQodGl0bGVFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB3MTFrUHJldHR5UHJpbnQuJGluamVjdCA9IFsnJHdpbmRvdyddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa1ByZXR0eVByaW50JywgdzExa1ByZXR0eVByaW50KTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gaW5pdExhbmd1YWdlKExhbmd1YWdlKSB7XG4gICAgTGFuZ3VhZ2UuaW5pdCgpO1xuICB9XG4gIGluaXRMYW5ndWFnZS4kaW5qZWN0ID0gWydMYW5ndWFnZSddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiBMYW5ndWFnZSgkcm9vdFNjb3BlKSB7XG4gICAgdmFyIHN0YXRlcyA9IHtcbiAgICAgICdkZSc6IHtcbiAgICAgICAgZGU6IHRydWUsXG4gICAgICAgIGVuOiBmYWxzZSxcbiAgICAgICAgbmFtZTogJ2RlJyxcbiAgICAgICAgbmV4dDogJ2VuT25seSdcbiAgICAgIH0sXG4gICAgICAnZW4nOiB7XG4gICAgICAgIGRlOiBmYWxzZSxcbiAgICAgICAgZW46IHRydWUsXG4gICAgICAgIG5hbWU6ICdlbicsXG4gICAgICAgIG5leHQ6ICdkZStlbidcbiAgICAgIH0sXG4gICAgICAnZGUrZW4nOiB7XG4gICAgICAgIGRlOiB0cnVlLFxuICAgICAgICBlbjogdHJ1ZSxcbiAgICAgICAgbmFtZTogJ2RlK2VuJyxcbiAgICAgICAgbmV4dDogJ2RlJ1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgY3VycmVudFN0YXRlID0gc3RhdGVzLmRlO1xuXG4gICAgdGhpcy50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldChjdXJyZW50U3RhdGUubmV4dCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIGN1cnJlbnRTdGF0ZSA9IHN0YXRlc1tzdGF0ZV07XG5cbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbGFuZy1kZScsIGN1cnJlbnRTdGF0ZS5kZSk7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xhbmctZW4nLCBjdXJyZW50U3RhdGUuZW4pO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRTdGF0ZS5uYW1lO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRyb290U2NvcGUuJG9uKCdsYW5nLWRlLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKGN1cnJlbnRTdGF0ZS5kZSk7XG4gICAgICB9KTtcblxuICAgICAgJHJvb3RTY29wZS4kb24oJ2xhbmctZW4tY3VycmVudCcsIGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soY3VycmVudFN0YXRlLmVuKTtcbiAgICAgIH0pO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgfVxuICBMYW5ndWFnZS4kaW5qZWN0ID0gWyckcm9vdFNjb3BlJ107XG5cbiAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd3MTFrLnNsaWRlcycpO1xuICBtb2R1bGUucnVuKGluaXRMYW5ndWFnZSk7XG4gIG1vZHVsZS5zZXJ2aWNlKCdMYW5ndWFnZScsIExhbmd1YWdlKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gU291cmNlU25pcHBldHMoJHJvb3RTY29wZSkge1xuICAgIHZhciBzdGF0ZXMgPSB7XG4gICAgICAnanMnOiB7XG4gICAgICAgIGpzOiB0cnVlLFxuICAgICAgICB0czogZmFsc2UsXG4gICAgICAgIG5hbWU6ICdqcycsXG4gICAgICAgIG5leHQ6ICd0c09ubHknXG4gICAgICB9LFxuICAgICAgJ3RzJzoge1xuICAgICAgICBqczogZmFsc2UsXG4gICAgICAgIHRzOiB0cnVlLFxuICAgICAgICBuYW1lOiAndHMnLFxuICAgICAgICBuZXh0OiAnanMrdHMnXG4gICAgICB9LFxuICAgICAgJ2pzK3RzJzoge1xuICAgICAgICBqczogdHJ1ZSxcbiAgICAgICAgdHM6IHRydWUsXG4gICAgICAgIG5hbWU6ICdqcyt0cycsXG4gICAgICAgIG5leHQ6ICdqcydcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHN0YXRlcy5qcztcblxuICAgICRyb290U2NvcGUuJG9uKCdzcmMtanMtY3VycmVudCcsIGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKGN1cnJlbnRTdGF0ZS5qcyk7XG4gICAgfSk7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignc3JjLXRzLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhjdXJyZW50U3RhdGUudHMpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjdXJyZW50U3RhdGUgPSBzdGF0ZXNbY3VycmVudFN0YXRlLm5leHRdO1xuXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NyYy1qcycsIGN1cnJlbnRTdGF0ZS5qcyk7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NyYy10cycsIGN1cnJlbnRTdGF0ZS50cyk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIGN1cnJlbnRTdGF0ZSA9IHN0YXRlc1tzdGF0ZV07XG5cbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnc3JjLWpzJywgY3VycmVudFN0YXRlLmpzKTtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnc3JjLXRzJywgY3VycmVudFN0YXRlLnRzKTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjdXJyZW50U3RhdGUubmFtZTtcbiAgICB9LmJpbmQodGhpcyk7XG4gIH1cbiAgU291cmNlU25pcHBldHMuJGluamVjdCA9IFsnJHJvb3RTY29wZSddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnNlcnZpY2UoJ1NvdXJjZVNuaXBwZXRzJywgU291cmNlU25pcHBldHMpO1xufSgpKTtcblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiBTbGlkZXNTZXJ2aWNlKHNsaWRlc0NvbmZpZywgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCAkd2luZG93KSB7XG4gICAgdmFyIGFjdGl2ZVNsaWRlO1xuXG4gICAgZnVuY3Rpb24gYWN0aXZhdGVGaXJzdFNsaWRlKCkge1xuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGFjdGl2ZVNsaWRlKSkge1xuICAgICAgICBhY3RpdmVTbGlkZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGFjdGl2ZVNsaWRlID0gc2xpZGVzWzBdO1xuICAgICAgYWN0aXZlU2xpZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgc2xpZGVzO1xuICAgIHZhciBzbGlkZXNNYXAgPSB7fTtcblxuICAgICRyb290U2NvcGUuJG9uKCckbG9jYXRpb25DaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNsaWRlTmFtZSA9ICRsb2NhdGlvbi5wYXRoKCk7XG5cbiAgICAgIGlmIChzbGlkZU5hbWUuc3Vic3RyaW5nKDAsIDEpID09PSAnLycpIHtcbiAgICAgICAgc2xpZGVOYW1lID0gc2xpZGVOYW1lLnN1YnN0cmluZygxLCBzbGlkZU5hbWUubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNsaWRlID0gc2xpZGVzTWFwW3NsaWRlTmFtZV07XG5cbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChzbGlkZSkpIHtcbiAgICAgICAgc2xpZGUuYWN0aXZhdGUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBsb2NhbFN0b3JhZ2VNb2RlS2V5ID0gJ3cxMWstc2xpZGVzLm1vZGUnO1xuICAgIHZhciBtb2RlID0gJ2V4cG9ydCc7XG5cbiAgICBmdW5jdGlvbiBtYXBTbGlkZXNDb25maWcoKSB7XG4gICAgICB2YXIgcHJlZml4ID0gc2xpZGVzQ29uZmlnLnNsaWRlVGVtcGxhdGVQcmVmaXggfHwgJ3NsaWRlcy9jb250ZW50Lyc7XG4gICAgICB2YXIgc3VmZml4ID0gc2xpZGVzQ29uZmlnLnNsaWRlVGVtcGxhdGVTdWZmaXggfHwgJy5odG1sJztcblxuICAgICAgc2xpZGVzID0gc2xpZGVzQ29uZmlnLnNsaWRlcy5tYXAoZnVuY3Rpb24gKHNsaWRlKSB7XG4gICAgICAgIHZhciBzbGlkZU9iamVjdCA9IHtcbiAgICAgICAgICBuYW1lOiBzbGlkZSxcbiAgICAgICAgICB0ZW1wbGF0ZTogcHJlZml4ICsgc2xpZGUgKyBzdWZmaXgsXG4gICAgICAgICAgYWN0aXZlOiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHNsaWRlT2JqZWN0LmFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGFjdGl2ZVNsaWRlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIGFjdGl2ZVNsaWRlID0gdGhpcztcblxuICAgICAgICAgIHNsaWRlT2JqZWN0LmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHNsaWRlT2JqZWN0O1xuICAgICAgfSk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gc2xpZGVzW2ldO1xuICAgICAgICB2YXIgcHJldmlvdXM7XG4gICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgIHByZXZpb3VzID0gc2xpZGVzW2kgLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBwcmV2aW91cyA9IHNsaWRlc1tzbGlkZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV4dDtcbiAgICAgICAgaWYgKGkgKyAxIDwgc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgIG5leHQgPSBzbGlkZXNbaSArIDFdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG5leHQgPSBzbGlkZXNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LnByZXZpb3VzID0gcHJldmlvdXM7XG4gICAgICAgIGVsZW1lbnQubmV4dCA9IG5leHQ7XG5cbiAgICAgICAgc2xpZGVzTWFwW2VsZW1lbnQubmFtZV0gPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIG1hcFNsaWRlc0NvbmZpZygpO1xuICAgIGFjdGl2YXRlRmlyc3RTbGlkZSgpO1xuXG4gICAgdGhpcy5nZXRBY3RpdmVTbGlkZSA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgIHJldHVybiBhY3RpdmVTbGlkZTtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRTbGlkZXMgPSBmdW5jdGlvbigpwqB7XG4gICAgICByZXR1cm4gc2xpZGVzO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG8gPSBmdW5jdGlvbiAoc2xpZGVOYW1lKSB7XG4gICAgICAkbG9jYXRpb24ucGF0aChzbGlkZU5hbWUpO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9GaXJzdCA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgICRsb2NhdGlvbi5wYXRoKHNsaWRlc1swXS5uYW1lKTtcbiAgICB9O1xuXG4gICAgdGhpcy5uYXZpZ2F0ZVRvTGFzdCA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgICRsb2NhdGlvbi5wYXRoKHNsaWRlc1tzbGlkZXMubGVuZ3RoIC0gMV0ubmFtZSk7XG4gICAgfTtcblxuICAgIHRoaXMubmF2aWdhdGVUb092ZXJ2aWV3ID0gZnVuY3Rpb24oKcKge1xuICAgICAgJGxvY2F0aW9uLnBhdGgoc2xpZGVzWzFdLm5hbWUpO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9OZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5leHQgPSB0aGlzLmdldEFjdGl2ZVNsaWRlKCkubmV4dDtcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChuZXh0KSkge1xuICAgICAgICB0aGlzLm5hdmlnYXRlVG8obmV4dC5uYW1lKTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9QcmV2aW91cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBwcmV2aW91cyA9IHRoaXMuZ2V0QWN0aXZlU2xpZGUoKS5wcmV2aW91cztcbiAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChwcmV2aW91cykpIHtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVRvKHByZXZpb3VzLm5hbWUpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuZ2V0TW9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtb2RlO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2V0TW9kZSA9IGZ1bmN0aW9uIChuZXdNb2RlKSB7XG4gICAgICBtb2RlID0gbmV3TW9kZTtcblxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKCR3aW5kb3cubG9jYWxTdG9yYWdlKSkge1xuICAgICAgICAkd2luZG93LmxvY2FsU3RvcmFnZVtsb2NhbFN0b3JhZ2VNb2RlS2V5XSA9IG1vZGU7XG4gICAgICB9XG5cbiAgICAgICRyb290U2NvcGUuJGVtaXQodGhpcy5ldmVudHMubW9kZUNoYW5nZWQsIG1vZGUpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMudG9nZ2xlTW9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBuZXdNb2RlO1xuXG4gICAgICBpZiAobW9kZSA9PT0gJ2V4cG9ydCcpIHtcbiAgICAgICAgbmV3TW9kZSA9ICdzY3JlZW4nO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAobW9kZSA9PT0gJ3NjcmVlbicpIHtcbiAgICAgICAgbmV3TW9kZSA9ICdleHBvcnQnO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNldE1vZGUobmV3TW9kZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5ldmVudHMgPSB7XG4gICAgICBtb2RlQ2hhbmdlZDogJ3cxMWstc2xpZGVzLm1vZGVDaGFuZ2VkJ1xuICAgIH07XG4gIH1cbiAgU2xpZGVzU2VydmljZS4kaW5qZWN0ID0gWydzbGlkZXNDb25maWcnLCAnJGxvY2F0aW9uJywgJyRyb290U2NvcGUnLCAnJHdpbmRvdyddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiBTbGlkZXNDdHJsKFNsaWRlc1NlcnZpY2UpIHtcbiAgICB0aGlzLnNsaWRlcyA9IFNsaWRlc1NlcnZpY2UuZ2V0U2xpZGVzKCk7XG4gIH1cbiAgU2xpZGVzQ3RybC4kaW5qZWN0ID0gWydTbGlkZXNTZXJ2aWNlJ107XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtTbGlkZU1hc3RlckRpcmVjdGl2ZShzbGlkZXNDb25maWcpIHtcbiAgICB2YXIgcmVtb3ZlQ2hpbGRyZW4gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgdmFyIGxhc3QgPSBub2RlLmxhc3RDaGlsZDtcbiAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKGxhc3QpO1xuICAgICAgICAgIGxhc3QgPSBub2RlLmxhc3RDaGlsZDtcbiAgICAgICAgfSB3aGlsZSAobGFzdCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZVVybDogZnVuY3Rpb24gKGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciBrZXkgPSBhdHRycy53MTFrU2xpZGVNYXN0ZXIgfHwgYXR0cnMubWFzdGVyO1xuICAgICAgICB2YXIgdGVtcGxhdGVVcmwgPSBzbGlkZXNDb25maWcubWFzdGVyc1trZXldO1xuXG4gICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHRlbXBsYXRlVXJsKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gTWF0ZXItU2xpZGUgZm91bmQgZm9yIFwiJyArIGtleSArICdcIi4gUGxlYXNlIGNvbmZpZ3VyZSBcInNsaWRlc0NvbmZpZ1wiIHByb3Blcmx5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlVXJsO1xuICAgICAgfSxcbiAgICAgIHJlc3RyaWN0OiAnRUEnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGlFbGVtZW50LCBpQXR0cnMsIGN0cmwsIHRyYW5zY2x1ZGUpIHtcbiAgICAgICAgdmFyIHRyYW5zY2x1c2lvblNjb3BlO1xuXG4gICAgICAgIHRyYW5zY2x1ZGUoZnVuY3Rpb24gKGNsb25lLCBzY29wZSkge1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbG9uZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBhcnQgPSBjbG9uZVtpXTtcblxuICAgICAgICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCAmJiBhbmd1bGFyLmlzRnVuY3Rpb24ocGFydC5nZXRBdHRyaWJ1dGUpKSB7XG4gICAgICAgICAgICAgIHZhciBwYXJ0TmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKCd3MTFrLXNsaWRlLXBhcnQtc291cmNlJyk7XG5cbiAgICAgICAgICAgICAgaWYgKHBhcnROYW1lICE9PSB1bmRlZmluZWQgJiYgcGFydE5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSAnW3cxMWstc2xpZGUtcGFydC10YXJnZXQ9XCInICsgcGFydE5hbWUgKyAnXCJdJztcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gaUVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgcmVtb3ZlQ2hpbGRyZW4oY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChwYXJ0LCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgY29udGFpbmVyLnJlbW92ZUF0dHJpYnV0ZSgndzExay1zbGlkZS1wYXJ0LXRhcmdldCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyYW5zY2x1c2lvblNjb3BlID0gc2NvcGU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdHJhbnNjbHVzaW9uU2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB3MTFrU2xpZGVNYXN0ZXJEaXJlY3RpdmUuJGluamVjdCA9IFsnc2xpZGVzQ29uZmlnJ107XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtTbGlkZXNEaXJlY3RpdmUoJHdpbmRvdywgJGRvY3VtZW50LCBTbGlkZXNTZXJ2aWNlLCBzbGlkZXNDb25maWcsICRpbmplY3RvciwgJHJvb3RTY29wZSkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0VBJyxcbiAgICAgIHRlbXBsYXRlVXJsOiBzbGlkZXNDb25maWcuZGlyZWN0aXZlVGVtcGxhdGVVcmwgfHwgJ3NsaWRlcy9zbGlkZXMuaHRtbCcsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBqcUVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBqcUVsZW1lbnRbMF07XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0TW9kZShtb2RlKSB7XG4gICAgICAgICAgaWYgKG1vZGUgPT09ICdleHBvcnQnKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3NjcmVlbicpO1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdleHBvcnQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gJ3NjcmVlbicpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZXhwb3J0Jyk7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3NjcmVlbicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZU1vZGUoKSB7XG4gICAgICAgICAgU2xpZGVzU2VydmljZS50b2dnbGVNb2RlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVPdmVybGF5KCkge1xuICAgICAgICAgIGVsZW1lbnQucXVlcnlTZWxlY3RvcignZGl2Lm92ZXJsYXknKS5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJ1bkRlZmF1bHRBY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgYWN0aW9uO1xuICAgICAgICAgIHZhciBhY3Rpb25UeXBlO1xuXG4gICAgICAgICAgLy8gcmlnaHQgb3IgcGFnZSBkb3duXG4gICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM5IHx8IGV2ZW50LmtleUNvZGUgPT09IDM0KSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9OZXh0O1xuICAgICAgICAgICAgYWN0aW9uVHlwZSA9ICduYXZpZ2F0ZSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGxlZnQgb3IgcGFnZSB1cFxuICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM3IHx8IGV2ZW50LmtleUNvZGUgPT09IDMzKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9QcmV2aW91cztcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBwb3MgMVxuICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM2KSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9GaXJzdDtcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBlbmRcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAzNSkge1xuICAgICAgICAgICAgYWN0aW9uID0gU2xpZGVzU2VydmljZS5uYXZpZ2F0ZVRvTGFzdDtcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBvXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNzkpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IFNsaWRlc1NlcnZpY2UubmF2aWdhdGVUb092ZXJ2aWV3O1xuICAgICAgICAgICAgYWN0aW9uVHlwZSA9ICduYXZpZ2F0ZSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGVcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSA2OSkge1xuICAgICAgICAgICAgYWN0aW9uID0gdG9nZ2xlTW9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gcCBvciBwZXJpb2RcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSA4MCB8fCBldmVudC5rZXlDb2RlID09PSAxOTApIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IHRvZ2dsZU92ZXJsYXk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgYWN0aW9uKCk7XG4gICAgICAgICAgICAgIGlmIChhY3Rpb25UeXBlID09PSAnbmF2aWdhdGUnKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0TW9kZShTbGlkZXNTZXJ2aWNlLmdldE1vZGUoKSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oU2xpZGVzU2VydmljZS5ldmVudHMubW9kZUNoYW5nZWQsIGZ1bmN0aW9uIChldmVudCwgbW9kZSkge1xuICAgICAgICAgIHNldE1vZGUobW9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRkb2N1bWVudC5iaW5kKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICBpZiAoZXZlbnQuYWx0S2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQubWV0YUtleSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciB0YWdOYW1lID0gZXZlbnQudGFyZ2V0LnRhZ05hbWU7XG4gICAgICAgICAgaWYgKHRhZ05hbWUgPT09ICdJTlBVVCcgfHwgdGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyB8fCBldmVudC50YXJnZXQuY29udGVudEVkaXRhYmxlID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2xpZGVzQ29uZmlnLnNob3J0Y3V0cykge1xuICAgICAgICAgICAgdmFyIGN1c3RvbVNob3J0Y3V0ID0gc2xpZGVzQ29uZmlnLnNob3J0Y3V0c1tldmVudC5rZXlDb2RlXTtcbiAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oY3VzdG9tU2hvcnRjdXQpIHx8IGFuZ3VsYXIuaXNBcnJheShjdXN0b21TaG9ydGN1dCkpIHtcbiAgICAgICAgICAgICAgJGluamVjdG9yLmludm9rZShjdXN0b21TaG9ydGN1dCwgeyRldmVudDogZXZlbnR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBydW5EZWZhdWx0QWN0aW9uKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBydW5EZWZhdWx0QWN0aW9uKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa1NsaWRlc0RpcmVjdGl2ZS4kaW5qZWN0ID0gWyckd2luZG93JywgJyRkb2N1bWVudCcsICdTbGlkZXNTZXJ2aWNlJywgJ3NsaWRlc0NvbmZpZycsICckaW5qZWN0b3InLCAnJHJvb3RTY29wZSddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnNlcnZpY2UoJ1NsaWRlc1NlcnZpY2UnLCBTbGlkZXNTZXJ2aWNlKTtcbiAgbW9kdWxlLmNvbnRyb2xsZXIoJ1NsaWRlc0N0cmwnLCBTbGlkZXNDdHJsKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa1NsaWRlTWFzdGVyJywgdzExa1NsaWRlTWFzdGVyRGlyZWN0aXZlKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa1NsaWRlcycsIHcxMWtTbGlkZXNEaXJlY3RpdmUpO1xufSgpKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
