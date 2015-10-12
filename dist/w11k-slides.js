/**
 * w11k-slides
 *
 * @version v0.12.0
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

(function () {
  'use strict';

  /* @ngInject */
  function configureShortcuts(slidesConfig) {
    slidesConfig.shortcuts = slidesConfig.shortcuts || {};

    slidesConfig.shortcuts['76'] = ['SourceSnippets', function (SourceSnippets) {
      SourceSnippets.toggle();
    }];
  }
  configureShortcuts.$inject = ['slidesConfig'];

  /* @ngInject */
  function initSnippets(SourceSnippets) {
    // just for eager creation
    SourceSnippets.init();
  }
  initSnippets.$inject = ['SourceSnippets'];

  /* @ngInject */
  function SourceSnippets($rootScope) {
    var states = {
      'jsOnly': {
        js: true,
        ts: false,
        next: 'tsOnly'
      },
      'tsOnly': {
        js: false,
        ts: true,
        next: 'jsAndTs'
      },
      'jsAndTs': {
        js: true,
        ts: true,
        next: 'jsOnly'
      }
    };

    var currentState = states.jsOnly;

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
    };

    this.init = function () {
      // nothing to do here at the moment
    };
  }
  SourceSnippets.$inject = ['$rootScope'];
  var module = angular.module('w11k.slides');

  module.config(configureShortcuts);
  module.run(initSnippets);
  module.service('SourceSnippets', SourceSnippets);
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIncxMWstc2xpZGVzLmpzIiwiZXZlbnQtdG9nZ2xlL2V2ZW50LXRvZ2dsZS5qcyIsImV2ZW50LXRvZ2dsZS9sYW5ndWFnZS5qcyIsImV2ZW50LXRvZ2dsZS9zb3VyY2Utc25pcHBldHMuanMiLCJmb290ZXIvZm9vdGVyLmpzIiwicHJldHR5cHJpbnQvcHJldHR5cHJpbnQuanMiLCJvcGVuLW9uY2UvY29uZmlybS11bmxvYWQuanMiLCJvcGVuLW9uY2Uvb3Blbi1vbmNlLmpzIiwic2xpZGVzL3NsaWRlcy5qcyIsInNvdXJjZS1zbmlwcGV0cy9zb3VyY2Utc25pcHBldHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxBQVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6IncxMWstc2xpZGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd3MTFrLnNsaWRlcycsIFtdKTtcblxuICBtb2R1bGUuY29uc3RhbnQoJ3NsaWRlc0NvbmZpZycsIHtcbiAgICBzbGlkZXM6IFtdLFxuICAgIHNsaWRlVGVtcGxhdGVQcmVmaXg6ICdzbGlkZXMvY29udGVudC8nLFxuICAgIHNsaWRlVGVtcGxhdGVTdWZmaXg6ICcuaHRtbCcsXG4gICAgbWFzdGVyczoge30sXG4gICAgZm9vdGVyOiB7XG4gICAgICB0ZW1wbGF0ZVVybDogJ2Zvb3Rlci9mb290ZXIuaHRtbCcsXG4gICAgICBsZWZ0OiAnJyxcbiAgICAgIG1pZGRsZTogJycsXG4gICAgICByaWdodDogJyRpbmRleCArIDEnXG4gICAgfVxuICB9KTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gdzExa0V2ZW50VG9nZ2xlKCRyb290U2NvcGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwganFFbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IGpxRWxlbWVudFswXTtcbiAgICAgICAgdmFyIG9yaWdpbmFsRGlzcGxheTtcbiAgICAgICAgc2NvcGUuJG9uKGF0dHJzLncxMWtFdmVudFRvZ2dsZSwgZnVuY3Rpb24gKGV2ZW50LCB2aXNpYmxlKSB7XG4gICAgICAgICAgdG9nZ2xlKHZpc2libGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiB0b2dnbGUodmlzaWJsZSkge1xuICAgICAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBvcmlnaW5hbERpc3BsYXk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxEaXNwbGF5ID0gZWxlbWVudC5zdHlsZS5kaXNwbGF5O1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICRyb290U2NvcGUuJGVtaXQoYXR0cnMudzExa0V2ZW50VG9nZ2xlICsgJy1jdXJyZW50JywgZnVuY3Rpb24odmlzaWJsZSkge1xuICAgICAgICAgIHRvZ2dsZSh2aXNpYmxlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB3MTFrRXZlbnRUb2dnbGUuJGluamVjdCA9IFsnJHJvb3RTY29wZSddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa0V2ZW50VG9nZ2xlJywgdzExa0V2ZW50VG9nZ2xlKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gaW5pdExhbmd1YWdlKExhbmd1YWdlKSB7XG4gICAgTGFuZ3VhZ2UuaW5pdCgpO1xuICB9XG4gIGluaXRMYW5ndWFnZS4kaW5qZWN0ID0gWydMYW5ndWFnZSddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiBMYW5ndWFnZSgkcm9vdFNjb3BlKSB7XG4gICAgdmFyIHN0YXRlcyA9IHtcbiAgICAgICdkZSc6IHtcbiAgICAgICAgZGU6IHRydWUsXG4gICAgICAgIGVuOiBmYWxzZSxcbiAgICAgICAgbmFtZTogJ2RlJyxcbiAgICAgICAgbmV4dDogJ2VuT25seSdcbiAgICAgIH0sXG4gICAgICAnZW4nOiB7XG4gICAgICAgIGRlOiBmYWxzZSxcbiAgICAgICAgZW46IHRydWUsXG4gICAgICAgIG5hbWU6ICdlbicsXG4gICAgICAgIG5leHQ6ICdkZStlbidcbiAgICAgIH0sXG4gICAgICAnZGUrZW4nOiB7XG4gICAgICAgIGRlOiB0cnVlLFxuICAgICAgICBlbjogdHJ1ZSxcbiAgICAgICAgbmFtZTogJ2RlK2VuJyxcbiAgICAgICAgbmV4dDogJ2RlJ1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgY3VycmVudFN0YXRlID0gc3RhdGVzLmRlO1xuXG4gICAgdGhpcy50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldChjdXJyZW50U3RhdGUubmV4dCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIGN1cnJlbnRTdGF0ZSA9IHN0YXRlc1tzdGF0ZV07XG5cbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnbGFuZy1kZScsIGN1cnJlbnRTdGF0ZS5kZSk7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xhbmctZW4nLCBjdXJyZW50U3RhdGUuZW4pO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRTdGF0ZS5uYW1lO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRyb290U2NvcGUuJG9uKCdsYW5nLWRlLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKGN1cnJlbnRTdGF0ZS5kZSk7XG4gICAgICB9KTtcblxuICAgICAgJHJvb3RTY29wZS4kb24oJ2xhbmctZW4tY3VycmVudCcsIGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soY3VycmVudFN0YXRlLmVuKTtcbiAgICAgIH0pO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgfVxuICBMYW5ndWFnZS4kaW5qZWN0ID0gWyckcm9vdFNjb3BlJ107XG5cbiAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd3MTFrLnNsaWRlcycpO1xuICBtb2R1bGUucnVuKGluaXRMYW5ndWFnZSk7XG4gIG1vZHVsZS5zZXJ2aWNlKCdMYW5ndWFnZScsIExhbmd1YWdlKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gU291cmNlU25pcHBldHMoJHJvb3RTY29wZSkge1xuICAgIHZhciBzdGF0ZXMgPSB7XG4gICAgICAnanMnOiB7XG4gICAgICAgIGpzOiB0cnVlLFxuICAgICAgICB0czogZmFsc2UsXG4gICAgICAgIG5hbWU6ICdqcycsXG4gICAgICAgIG5leHQ6ICd0c09ubHknXG4gICAgICB9LFxuICAgICAgJ3RzJzoge1xuICAgICAgICBqczogZmFsc2UsXG4gICAgICAgIHRzOiB0cnVlLFxuICAgICAgICBuYW1lOiAndHMnLFxuICAgICAgICBuZXh0OiAnanMrdHMnXG4gICAgICB9LFxuICAgICAgJ2pzK3RzJzoge1xuICAgICAgICBqczogdHJ1ZSxcbiAgICAgICAgdHM6IHRydWUsXG4gICAgICAgIG5hbWU6ICdqcyt0cycsXG4gICAgICAgIG5leHQ6ICdqcydcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHN0YXRlcy5qcztcblxuICAgICRyb290U2NvcGUuJG9uKCdzcmMtanMtY3VycmVudCcsIGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKGN1cnJlbnRTdGF0ZS5qcyk7XG4gICAgfSk7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignc3JjLXRzLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhjdXJyZW50U3RhdGUudHMpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjdXJyZW50U3RhdGUgPSBzdGF0ZXNbY3VycmVudFN0YXRlLm5leHRdO1xuXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NyYy1qcycsIGN1cnJlbnRTdGF0ZS5qcyk7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NyYy10cycsIGN1cnJlbnRTdGF0ZS50cyk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIGN1cnJlbnRTdGF0ZSA9IHN0YXRlc1tzdGF0ZV07XG5cbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnc3JjLWpzJywgY3VycmVudFN0YXRlLmpzKTtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnc3JjLXRzJywgY3VycmVudFN0YXRlLnRzKTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjdXJyZW50U3RhdGUubmFtZTtcbiAgICB9LmJpbmQodGhpcyk7XG4gIH1cbiAgU291cmNlU25pcHBldHMuJGluamVjdCA9IFsnJHJvb3RTY29wZSddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLnNlcnZpY2UoJ1NvdXJjZVNuaXBwZXRzJywgU291cmNlU25pcHBldHMpO1xufSgpKTtcblxuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtGb290ZXIoc2xpZGVzQ29uZmlnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRUEnLFxuICAgICAgdGVtcGxhdGVVcmw6IHNsaWRlc0NvbmZpZy5mb290ZXIudGVtcGxhdGVVcmwgfHzCoCdmb290ZXIvZm9vdGVyLnRwbC5odG1sJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIHZhciBsZWZ0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcuZm9vdGVyLWxlZnQnKTtcbiAgICAgICAgdmFyIG1pZGRsZSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLmZvb3Rlci1taWRkbGUnKTtcbiAgICAgICAgdmFyIHJpZ2h0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcuZm9vdGVyLXJpZ2h0Jyk7XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0Q29udGVudChlbGVtZW50LCBleHByZXNzaW9uKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSBzY29wZS4kZXZhbChleHByZXNzaW9uKTtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoY29udGVudCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZXRDb250ZW50KGxlZnQsIGF0dHJzLmxlZnQgfHzCoHNsaWRlc0NvbmZpZy5mb290ZXIubGVmdCk7XG4gICAgICAgIHNldENvbnRlbnQobWlkZGxlLCBhdHRycy5taWRkbGUgfHzCoHNsaWRlc0NvbmZpZy5mb290ZXIubWlkZGxlKTtcbiAgICAgICAgc2V0Q29udGVudChyaWdodCwgYXR0cnMucmlnaHQgfHzCoHNsaWRlc0NvbmZpZy5mb290ZXIucmlnaHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa0Zvb3Rlci4kaW5qZWN0ID0gWydzbGlkZXNDb25maWcnXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtGb290ZXInLCB3MTFrRm9vdGVyKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIHcxMWtQcmV0dHlQcmludCgkd2luZG93KSB7XG5cbiAgICB2YXIgZXNjYXBlSFRNTCA9IGZ1bmN0aW9uIChodG1sKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChodG1sKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuICAgIH07XG5cbiAgICB2YXIgY29udGFpbmVyVGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cIncxMWstcHJldHR5LXByaW50XCI+PHByZSBjbGFzcz1cInByZXR0eXByaW50IGxpbmVudW1zXCI+PC9wcmU+PC9kaXY+JztcbiAgICB2YXIgdGl0bGVUZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwidGl0bGVcIj48L2Rpdj4nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICB0ZXJtaW5hbDogdHJ1ZSxcbiAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uICh0RWxlbWVudCwgdEF0dHJzKSB7XG4gICAgICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oJHdpbmRvdy5wcmV0dHlQcmludE9uZSkpIHtcbiAgICAgICAgICB2YXIgaHRtbCA9IHRFbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgICB2YXIgZXNjYXBlZEh0bWwgPSBlc2NhcGVIVE1MKGh0bWwpO1xuICAgICAgICAgIHZhciBwcmV0dGlmaWVkSHRtbCA9ICR3aW5kb3cucHJldHR5UHJpbnRPbmUoZXNjYXBlZEh0bWwsIHRBdHRycy5sYW5nLCB0cnVlKTtcblxuICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmd1bGFyLmVsZW1lbnQoY29udGFpbmVyVGVtcGxhdGUpO1xuICAgICAgICAgIHZhciBwcmVFbGVtZW50ID0gY29udGFpbmVyLmZpbmQoJ3ByZScpO1xuXG4gICAgICAgICAgcHJlRWxlbWVudC5odG1sKHByZXR0aWZpZWRIdG1sKTtcblxuICAgICAgICAgIHRFbGVtZW50LnJlcGxhY2VXaXRoKGNvbnRhaW5lcik7XG5cbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgYXR0cnMuJG9ic2VydmUoJ3RpdGxlJywgZnVuY3Rpb24gKHRpdGxlVGV4dCkge1xuICAgICAgICAgICAgICBpZiAodGl0bGVUZXh0ICE9PSB1bmRlZmluZWQgJiYgdGl0bGVUZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHZhciB0aXRsZUVsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQodGl0bGVUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgdGl0bGVFbGVtZW50Lmh0bWwodGl0bGVUZXh0KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnByZXBlbmQodGl0bGVFbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB3MTFrUHJldHR5UHJpbnQuJGluamVjdCA9IFsnJHdpbmRvdyddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa1ByZXR0eVByaW50JywgdzExa1ByZXR0eVByaW50KTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gVW5sb2FkQ29uZmlybSgkd2luZG93KSB7XG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gICAgdGhpcy5pbmNyZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvdW50ZXIrKztcbiAgICB9O1xuXG4gICAgdGhpcy5kZWNyZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNvdW50ZXItLTtcbiAgICB9O1xuXG4gICAgJHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgaWYgKGNvdW50ZXIgPiAwKSB7XG4gICAgICAgIHZhciBoaW50ID0gJ0VzIHd1cmRlIG1pbmRlc3RlbnMgZWluIEJlaXNwaWVsIGdlw7ZmZm5ldC4gV2VubiBkaWUgU2VpdGUgbmV1IGdlbGFkZW4gd2lyZCwgbcO8c3NlbiBiZWltIGVybmV1dGVuIMOWZmZuZW4gYXVjaCBkaWUgQmVpc3BpZWxlIG5ldSBnZWxhZGVuIHdlcmRlbi4nO1xuICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGhpbnQ7XG4gICAgICAgIHJldHVybiBoaW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgVW5sb2FkQ29uZmlybS4kaW5qZWN0ID0gWyckd2luZG93J107XG5cbiAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd3MTFrLnNsaWRlcycpO1xuICBtb2R1bGUuc2VydmljZSgnVW5sb2FkQ29uZmlybScsIFVubG9hZENvbmZpcm0pO1xufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiB3MTFrT3Blbk9uY2UoJHdpbmRvdywgVW5sb2FkQ29uZmlybSkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIgbmFtZWRXaW5kb3c7XG5cbiAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIHZhciBub05hbWVkV2luZG93T3BlbiA9IG5hbWVkV2luZG93ID09PSB1bmRlZmluZWQgfHwgbmFtZWRXaW5kb3cgPT09IG51bGwgfHwgbmFtZWRXaW5kb3cuY2xvc2VkO1xuICAgICAgICAgIHZhciBsaW5rQXR0clNldCA9IGF0dHJzLmhyZWYgIT09IHVuZGVmaW5lZCAmJiBhdHRycy5ocmVmICE9PSBudWxsICYmIGF0dHJzLnRhcmdldCAhPT0gdW5kZWZpbmVkICYmIGF0dHJzLnRhcmdldCAhPT0gbnVsbDtcbiAgICAgICAgICB2YXIgb3Blbk9uY2VTZXQgPSBhdHRycy53MTFrT3Blbk9uY2UgPT09ICd0cnVlJztcblxuICAgICAgICAgIGlmIChub05hbWVkV2luZG93T3BlbiAmJiBsaW5rQXR0clNldCAmJiBvcGVuT25jZVNldCkge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygnZXhhbXBsZS1zaG93bicpO1xuICAgICAgICAgICAgVW5sb2FkQ29uZmlybS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIG5hbWVkV2luZG93ID0gJHdpbmRvdy5vcGVuKGF0dHJzLmhyZWYsIGF0dHJzLnRhcmdldCk7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobm9OYW1lZFdpbmRvd09wZW4gPT09IGZhbHNlICYmIG9wZW5PbmNlU2V0KSB7XG4gICAgICAgICAgICBuYW1lZFdpbmRvdy5mb2N1cygpO1xuICAgICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygnZXhhbXBsZS1zaG93bicpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa09wZW5PbmNlLiRpbmplY3QgPSBbJyR3aW5kb3cnLCAnVW5sb2FkQ29uZmlybSddO1xuXG4gIHZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndzExay5zbGlkZXMnKTtcbiAgbW9kdWxlLmRpcmVjdGl2ZSgndzExa09wZW5PbmNlJywgdzExa09wZW5PbmNlKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIFNsaWRlc1NlcnZpY2Uoc2xpZGVzQ29uZmlnLCAkbG9jYXRpb24sICRyb290U2NvcGUpIHtcbiAgICB2YXIgYWN0aXZlU2xpZGU7XG5cbiAgICBmdW5jdGlvbiBhY3RpdmF0ZUZpcnN0U2xpZGUoKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoYWN0aXZlU2xpZGUpKSB7XG4gICAgICAgIGFjdGl2ZVNsaWRlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgYWN0aXZlU2xpZGUgPSBzbGlkZXNbMF07XG4gICAgICBhY3RpdmVTbGlkZS5hY3RpdmUgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciBzbGlkZXM7XG4gICAgdmFyIHNsaWRlc01hcCA9IHt9O1xuXG4gICAgJHJvb3RTY29wZS4kb24oJyRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2xpZGVOYW1lID0gJGxvY2F0aW9uLnBhdGgoKTtcblxuICAgICAgaWYgKHNsaWRlTmFtZS5zdWJzdHJpbmcoMCwgMSkgPT09ICcvJykge1xuICAgICAgICBzbGlkZU5hbWUgPSBzbGlkZU5hbWUuc3Vic3RyaW5nKDEsIHNsaWRlTmFtZS5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2xpZGUgPSBzbGlkZXNNYXBbc2xpZGVOYW1lXTtcblxuICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHNsaWRlKSkge1xuICAgICAgICBzbGlkZS5hY3RpdmF0ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbWFwU2xpZGVzQ29uZmlnKCkge1xuICAgICAgdmFyIHByZWZpeCA9IHNsaWRlc0NvbmZpZy5zbGlkZVRlbXBsYXRlUHJlZml4IHx8ICdzbGlkZXMvY29udGVudC8nO1xuICAgICAgdmFyIHN1ZmZpeCA9IHNsaWRlc0NvbmZpZy5zbGlkZVRlbXBsYXRlU3VmZml4IHx8ICcuaHRtbCc7XG5cbiAgICAgIHNsaWRlcyA9IHNsaWRlc0NvbmZpZy5zbGlkZXMubWFwKGZ1bmN0aW9uIChzbGlkZSkge1xuICAgICAgICB2YXIgc2xpZGVPYmplY3QgPSB7XG4gICAgICAgICAgbmFtZTogc2xpZGUsXG4gICAgICAgICAgdGVtcGxhdGU6IHByZWZpeCArIHNsaWRlICsgc3VmZml4LFxuICAgICAgICAgIGFjdGl2ZTogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICBzbGlkZU9iamVjdC5hY3RpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhY3RpdmVTbGlkZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICBhY3RpdmVTbGlkZSA9IHRoaXM7XG5cbiAgICAgICAgICBzbGlkZU9iamVjdC5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBzbGlkZU9iamVjdDtcbiAgICAgIH0pO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHNsaWRlc1tpXTtcbiAgICAgICAgdmFyIHByZXZpb3VzO1xuICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICBwcmV2aW91cyA9IHNsaWRlc1tpIC0gMV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcHJldmlvdXMgPSBzbGlkZXNbc2xpZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5leHQ7XG4gICAgICAgIGlmIChpICsgMSA8IHNsaWRlcy5sZW5ndGgpIHtcbiAgICAgICAgICBuZXh0ID0gc2xpZGVzW2kgKyAxXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBuZXh0ID0gc2xpZGVzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5wcmV2aW91cyA9IHByZXZpb3VzO1xuICAgICAgICBlbGVtZW50Lm5leHQgPSBuZXh0O1xuXG4gICAgICAgIHNsaWRlc01hcFtlbGVtZW50Lm5hbWVdID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtYXBTbGlkZXNDb25maWcoKTtcbiAgICBhY3RpdmF0ZUZpcnN0U2xpZGUoKTtcblxuICAgIHRoaXMuZ2V0QWN0aXZlU2xpZGUgPSBmdW5jdGlvbigpwqB7XG4gICAgICByZXR1cm4gYWN0aXZlU2xpZGU7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0U2xpZGVzID0gZnVuY3Rpb24oKcKge1xuICAgICAgcmV0dXJuIHNsaWRlcztcbiAgICB9O1xuXG4gICAgdGhpcy5uYXZpZ2F0ZVRvID0gZnVuY3Rpb24gKHNsaWRlTmFtZSkge1xuICAgICAgJGxvY2F0aW9uLnBhdGgoc2xpZGVOYW1lKTtcbiAgICB9O1xuXG4gICAgdGhpcy5uYXZpZ2F0ZVRvRmlyc3QgPSBmdW5jdGlvbigpwqB7XG4gICAgICAkbG9jYXRpb24ucGF0aChzbGlkZXNbMF0ubmFtZSk7XG4gICAgfTtcblxuICAgIHRoaXMubmF2aWdhdGVUb0xhc3QgPSBmdW5jdGlvbigpwqB7XG4gICAgICAkbG9jYXRpb24ucGF0aChzbGlkZXNbc2xpZGVzLmxlbmd0aCAtIDFdLm5hbWUpO1xuICAgIH07XG5cbiAgICB0aGlzLm5hdmlnYXRlVG9PdmVydmlldyA9IGZ1bmN0aW9uKCnCoHtcbiAgICAgICRsb2NhdGlvbi5wYXRoKHNsaWRlc1sxXS5uYW1lKTtcbiAgICB9O1xuXG4gICAgdGhpcy5uYXZpZ2F0ZVRvTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBuZXh0ID0gdGhpcy5nZXRBY3RpdmVTbGlkZSgpLm5leHQ7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQobmV4dCkpIHtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVRvKG5leHQubmFtZSk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5uYXZpZ2F0ZVRvUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgcHJldmlvdXMgPSB0aGlzLmdldEFjdGl2ZVNsaWRlKCkucHJldmlvdXM7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQocHJldmlvdXMpKSB7XG4gICAgICAgIHRoaXMubmF2aWdhdGVUbyhwcmV2aW91cy5uYW1lKTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG4gIH1cbiAgU2xpZGVzU2VydmljZS4kaW5qZWN0ID0gWydzbGlkZXNDb25maWcnLCAnJGxvY2F0aW9uJywgJyRyb290U2NvcGUnXTtcblxuICAvKiBAbmdJbmplY3QgKi9cbiAgZnVuY3Rpb24gU2xpZGVzQ3RybChTbGlkZXNTZXJ2aWNlKSB7XG4gICAgdGhpcy5zbGlkZXMgPSBTbGlkZXNTZXJ2aWNlLmdldFNsaWRlcygpO1xuICB9XG4gIFNsaWRlc0N0cmwuJGluamVjdCA9IFsnU2xpZGVzU2VydmljZSddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiB3MTFrU2xpZGVNYXN0ZXJEaXJlY3RpdmUoc2xpZGVzQ29uZmlnKSB7XG4gICAgdmFyIHJlbW92ZUNoaWxkcmVuID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIHZhciBsYXN0ID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgICBpZiAobGFzdCkge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChsYXN0KTtcbiAgICAgICAgICBsYXN0ID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgICAgIH0gd2hpbGUgKGxhc3QpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGVtcGxhdGVVcmw6IGZ1bmN0aW9uIChlbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIga2V5ID0gYXR0cnMudzExa1NsaWRlTWFzdGVyIHx8IGF0dHJzLm1hc3RlcjtcbiAgICAgICAgdmFyIHRlbXBsYXRlVXJsID0gc2xpZGVzQ29uZmlnLm1hc3RlcnNba2V5XTtcblxuICAgICAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZCh0ZW1wbGF0ZVVybCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIE1hdGVyLVNsaWRlIGZvdW5kIGZvciBcIicgKyBrZXkgKyAnXCIuIFBsZWFzZSBjb25maWd1cmUgXCJzbGlkZXNDb25maWdcIiBwcm9wZXJseS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZVVybDtcbiAgICAgIH0sXG4gICAgICByZXN0cmljdDogJ0VBJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBpRWxlbWVudCwgaUF0dHJzLCBjdHJsLCB0cmFuc2NsdWRlKSB7XG4gICAgICAgIHZhciB0cmFuc2NsdXNpb25TY29wZTtcblxuICAgICAgICB0cmFuc2NsdWRlKGZ1bmN0aW9uIChjbG9uZSwgc2NvcGUpIHtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xvbmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwYXJ0ID0gY2xvbmVbaV07XG5cbiAgICAgICAgICAgIGlmIChwYXJ0ICE9PSB1bmRlZmluZWQgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKHBhcnQuZ2V0QXR0cmlidXRlKSkge1xuICAgICAgICAgICAgICB2YXIgcGFydE5hbWUgPSBwYXJ0LmdldEF0dHJpYnV0ZSgndzExay1zbGlkZS1wYXJ0LXNvdXJjZScpO1xuXG4gICAgICAgICAgICAgIGlmIChwYXJ0TmFtZSAhPT0gdW5kZWZpbmVkICYmIHBhcnROYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9yID0gJ1t3MTFrLXNsaWRlLXBhcnQtdGFyZ2V0PVwiJyArIHBhcnROYW1lICsgJ1wiXSc7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGlFbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIHJlbW92ZUNoaWxkcmVuKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocGFydCwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmVBdHRyaWJ1dGUoJ3cxMWstc2xpZGUtcGFydC10YXJnZXQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cmFuc2NsdXNpb25TY29wZSA9IHNjb3BlO1xuICAgICAgICB9KTtcblxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRyYW5zY2x1c2lvblNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa1NsaWRlTWFzdGVyRGlyZWN0aXZlLiRpbmplY3QgPSBbJ3NsaWRlc0NvbmZpZyddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiB3MTFrU2xpZGVzRGlyZWN0aXZlKCR3aW5kb3csICRkb2N1bWVudCwgU2xpZGVzU2VydmljZSwgc2xpZGVzQ29uZmlnLCAkaW5qZWN0b3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFQScsXG4gICAgICB0ZW1wbGF0ZVVybDogc2xpZGVzQ29uZmlnLmRpcmVjdGl2ZVRlbXBsYXRlVXJsIHx8ICdzbGlkZXMvc2xpZGVzLmh0bWwnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwganFFbGVtZW50KSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0ganFFbGVtZW50WzBdO1xuXG4gICAgICAgIHZhciBsb2NhbFN0b3JhZ2VNb2RlS2V5ID0gJ3cxMWstc2xpZGVzLm1vZGUnO1xuICAgICAgICB2YXIgbW9kZSA9ICdleHBvcnQnO1xuXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZU1vZGUoKSB7XG4gICAgICAgICAgaWYgKG1vZGUgPT09ICdleHBvcnQnKSB7XG4gICAgICAgICAgICBtb2RlID0gJ3NjcmVlbic7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKG1vZGUgPT09ICdzY3JlZW4nKSB7XG4gICAgICAgICAgICBtb2RlID0gJ2V4cG9ydCc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2V0TW9kZShtb2RlKTtcblxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCgkd2luZG93LmxvY2FsU3RvcmFnZSkpIHtcbiAgICAgICAgICAgICR3aW5kb3cubG9jYWxTdG9yYWdlW2xvY2FsU3RvcmFnZU1vZGVLZXldID0gbW9kZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzZXRNb2RlKG1vZGUpIHtcbiAgICAgICAgICBpZiAobW9kZSA9PT0gJ2V4cG9ydCcpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2NyZWVuJyk7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2V4cG9ydCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChtb2RlID09PSAnc2NyZWVuJykge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdleHBvcnQnKTtcbiAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc2NyZWVuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlT3ZlcmxheSgpIHtcbiAgICAgICAgICBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5vdmVybGF5JykuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBydW5EZWZhdWx0QWN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgdmFyIGFjdGlvbjtcbiAgICAgICAgICB2YXIgYWN0aW9uVHlwZTtcblxuICAgICAgICAgIC8vIHJpZ2h0IG9yIHBhZ2UgZG93blxuICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzOSB8fCBldmVudC5rZXlDb2RlID09PSAzNCkge1xuICAgICAgICAgICAgYWN0aW9uID0gU2xpZGVzU2VydmljZS5uYXZpZ2F0ZVRvTmV4dDtcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBsZWZ0IG9yIHBhZ2UgdXBcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAzNyB8fCBldmVudC5rZXlDb2RlID09PSAzMykge1xuICAgICAgICAgICAgYWN0aW9uID0gU2xpZGVzU2VydmljZS5uYXZpZ2F0ZVRvUHJldmlvdXM7XG4gICAgICAgICAgICBhY3Rpb25UeXBlID0gJ25hdmlnYXRlJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gcG9zIDFcbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAzNikge1xuICAgICAgICAgICAgYWN0aW9uID0gU2xpZGVzU2VydmljZS5uYXZpZ2F0ZVRvRmlyc3Q7XG4gICAgICAgICAgICBhY3Rpb25UeXBlID0gJ25hdmlnYXRlJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gZW5kXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMzUpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IFNsaWRlc1NlcnZpY2UubmF2aWdhdGVUb0xhc3Q7XG4gICAgICAgICAgICBhY3Rpb25UeXBlID0gJ25hdmlnYXRlJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gb1xuICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDc5KSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBTbGlkZXNTZXJ2aWNlLm5hdmlnYXRlVG9PdmVydmlldztcbiAgICAgICAgICAgIGFjdGlvblR5cGUgPSAnbmF2aWdhdGUnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBlXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNjkpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IHRvZ2dsZU1vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHAgb3IgcGVyaW9kXG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gODAgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTkwKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSB0b2dnbGVPdmVybGF5O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGFjdGlvbigpO1xuICAgICAgICAgICAgICBpZiAoYWN0aW9uVHlwZSA9PT0gJ25hdmlnYXRlJykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCgkd2luZG93LmxvY2FsU3RvcmFnZSkpIHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoJHdpbmRvdy5sb2NhbFN0b3JhZ2VbbG9jYWxTdG9yYWdlTW9kZUtleV0pKSB7XG4gICAgICAgICAgICBtb2RlID0gJHdpbmRvdy5sb2NhbFN0b3JhZ2VbbG9jYWxTdG9yYWdlTW9kZUtleV07XG4gICAgICAgICAgICBzZXRNb2RlKG1vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICRkb2N1bWVudC5iaW5kKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICBpZiAoZXZlbnQuYWx0S2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQubWV0YUtleSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciB0YWdOYW1lID0gZXZlbnQudGFyZ2V0LnRhZ05hbWU7XG4gICAgICAgICAgaWYgKHRhZ05hbWUgPT09ICdJTlBVVCcgfHwgdGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyB8fCBldmVudC50YXJnZXQuY29udGVudEVkaXRhYmxlID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2xpZGVzQ29uZmlnLnNob3J0Y3V0cykge1xuICAgICAgICAgICAgdmFyIGN1c3RvbVNob3J0Y3V0ID0gc2xpZGVzQ29uZmlnLnNob3J0Y3V0c1tldmVudC5rZXlDb2RlXTtcbiAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oY3VzdG9tU2hvcnRjdXQpIHx8IGFuZ3VsYXIuaXNBcnJheShjdXN0b21TaG9ydGN1dCkpIHtcbiAgICAgICAgICAgICAgJGluamVjdG9yLmludm9rZShjdXN0b21TaG9ydGN1dCwgeyRldmVudDogZXZlbnR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBydW5EZWZhdWx0QWN0aW9uKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBydW5EZWZhdWx0QWN0aW9uKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgdzExa1NsaWRlc0RpcmVjdGl2ZS4kaW5qZWN0ID0gWyckd2luZG93JywgJyRkb2N1bWVudCcsICdTbGlkZXNTZXJ2aWNlJywgJ3NsaWRlc0NvbmZpZycsICckaW5qZWN0b3InXTtcblxuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG4gIG1vZHVsZS5zZXJ2aWNlKCdTbGlkZXNTZXJ2aWNlJywgU2xpZGVzU2VydmljZSk7XG4gIG1vZHVsZS5jb250cm9sbGVyKCdTbGlkZXNDdHJsJywgU2xpZGVzQ3RybCk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtTbGlkZU1hc3RlcicsIHcxMWtTbGlkZU1hc3RlckRpcmVjdGl2ZSk7XG4gIG1vZHVsZS5kaXJlY3RpdmUoJ3cxMWtTbGlkZXMnLCB3MTFrU2xpZGVzRGlyZWN0aXZlKTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIGNvbmZpZ3VyZVNob3J0Y3V0cyhzbGlkZXNDb25maWcpIHtcbiAgICBzbGlkZXNDb25maWcuc2hvcnRjdXRzID0gc2xpZGVzQ29uZmlnLnNob3J0Y3V0cyB8fCB7fTtcblxuICAgIHNsaWRlc0NvbmZpZy5zaG9ydGN1dHNbJzc2J10gPSBbJ1NvdXJjZVNuaXBwZXRzJywgZnVuY3Rpb24gKFNvdXJjZVNuaXBwZXRzKSB7XG4gICAgICBTb3VyY2VTbmlwcGV0cy50b2dnbGUoKTtcbiAgICB9XTtcbiAgfVxuICBjb25maWd1cmVTaG9ydGN1dHMuJGluamVjdCA9IFsnc2xpZGVzQ29uZmlnJ107XG5cbiAgLyogQG5nSW5qZWN0ICovXG4gIGZ1bmN0aW9uIGluaXRTbmlwcGV0cyhTb3VyY2VTbmlwcGV0cykge1xuICAgIC8vIGp1c3QgZm9yIGVhZ2VyIGNyZWF0aW9uXG4gICAgU291cmNlU25pcHBldHMuaW5pdCgpO1xuICB9XG4gIGluaXRTbmlwcGV0cy4kaW5qZWN0ID0gWydTb3VyY2VTbmlwcGV0cyddO1xuXG4gIC8qIEBuZ0luamVjdCAqL1xuICBmdW5jdGlvbiBTb3VyY2VTbmlwcGV0cygkcm9vdFNjb3BlKSB7XG4gICAgdmFyIHN0YXRlcyA9IHtcbiAgICAgICdqc09ubHknOiB7XG4gICAgICAgIGpzOiB0cnVlLFxuICAgICAgICB0czogZmFsc2UsXG4gICAgICAgIG5leHQ6ICd0c09ubHknXG4gICAgICB9LFxuICAgICAgJ3RzT25seSc6IHtcbiAgICAgICAganM6IGZhbHNlLFxuICAgICAgICB0czogdHJ1ZSxcbiAgICAgICAgbmV4dDogJ2pzQW5kVHMnXG4gICAgICB9LFxuICAgICAgJ2pzQW5kVHMnOiB7XG4gICAgICAgIGpzOiB0cnVlLFxuICAgICAgICB0czogdHJ1ZSxcbiAgICAgICAgbmV4dDogJ2pzT25seSdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHN0YXRlcy5qc09ubHk7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignc3JjLWpzLWN1cnJlbnQnLCBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhjdXJyZW50U3RhdGUuanMpO1xuICAgIH0pO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ3NyYy10cy1jdXJyZW50JywgZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soY3VycmVudFN0YXRlLnRzKTtcbiAgICB9KTtcblxuICAgIHRoaXMudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgY3VycmVudFN0YXRlID0gc3RhdGVzW2N1cnJlbnRTdGF0ZS5uZXh0XTtcblxuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzcmMtanMnLCBjdXJyZW50U3RhdGUuanMpO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzcmMtdHMnLCBjdXJyZW50U3RhdGUudHMpO1xuICAgIH07XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBub3RoaW5nIHRvIGRvIGhlcmUgYXQgdGhlIG1vbWVudFxuICAgIH07XG4gIH1cbiAgU291cmNlU25pcHBldHMuJGluamVjdCA9IFsnJHJvb3RTY29wZSddO1xuICB2YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3cxMWsuc2xpZGVzJyk7XG5cbiAgbW9kdWxlLmNvbmZpZyhjb25maWd1cmVTaG9ydGN1dHMpO1xuICBtb2R1bGUucnVuKGluaXRTbmlwcGV0cyk7XG4gIG1vZHVsZS5zZXJ2aWNlKCdTb3VyY2VTbmlwcGV0cycsIFNvdXJjZVNuaXBwZXRzKTtcbn0oKSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
