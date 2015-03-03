/**
 * w11k-slides - v0.10.1 - 2015-03-03
 * https://github.com/w11k/w11k-slides
 *
 * Copyright (c) 2015 WeigleWilczek GmbH
 */
"use strict";

angular.module("w11k.slides", []);

angular.module("w11k.slides").constant("slidesConfig", {
    slides: [],
    slideTemplatePrefix: "slides/content/",
    slideTemplateSuffix: ".tpl.html",
    masters: {},
    footer: {
        templateUrl: "footer/footer.tpl.html",
        left: "",
        middle: "",
        right: "$index + 1"
    }
});

"use strict";

angular.module("w11k.slides").directive("w11kFooter", [ "slidesConfig", function(slidesConfig) {
    return {
        restrict: "EA",
        templateUrl: slidesConfig.footer.templateUrl || "footer/footer.tpl.html",
        replace: true,
        link: function(scope, element, attrs) {
            var left = element[0].querySelector(".footer-left");
            var middle = element[0].querySelector(".footer-middle");
            var right = element[0].querySelector(".footer-right");
            function setContent(element, expression) {
                var content = scope.$eval(expression);
                if (angular.isDefined(content)) {
                    element.innerHTML = content;
                }
            }
            setContent(left, attrs.left || slidesConfig.footer.left);
            setContent(middle, attrs.middle || slidesConfig.footer.middle);
            setContent(right, attrs.right || slidesConfig.footer.right);
        }
    };
} ]);

"use strict";

angular.module("w11k.slides").service("UnloadConfirm", [ "$window", function($window) {
    var service = {
        counter: 0,
        increment: function() {
            this.counter++;
        },
        decrement: function() {
            this.counter--;
        }
    };
    var unloadListener = function(event) {
        if (service.counter > 0) {
            var hint = "Es wurde mindestens ein Beispiel geöffnet. Wenn die Seite neu geladen wird, müssen beim erneuten Öffnen auch die Beispiele neu geladen werden.";
            event.returnValue = hint;
            return hint;
        } else {
            event.preventDefault();
            return;
        }
    };
    $window.onbeforeunload = unloadListener;
    return service;
} ]);

"use strict";

angular.module("w11k.slides").directive("w11kOpenOnce", [ "$window", "UnloadConfirm", function($window, UnloadConfirm) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var namedWindow;
            element.bind("click", function(event) {
                var noNamedWindowOpen = namedWindow === undefined || namedWindow === null || namedWindow.closed;
                var linkAttrSet = attrs.href !== undefined && attrs.href !== null && attrs.target !== undefined && attrs.target !== null;
                var openOnceSet = attrs.w11kOpenOnce === "true";
                if (noNamedWindowOpen && linkAttrSet && openOnceSet) {
                    element.removeClass("example-shown");
                    UnloadConfirm.increment();
                    namedWindow = $window.open(attrs.href, attrs.target);
                    event.preventDefault();
                } else if (noNamedWindowOpen === false && openOnceSet) {
                    namedWindow.focus();
                    element.addClass("example-shown");
                    event.preventDefault();
                }
            });
        }
    };
} ]);

"use strict";

angular.module("w11k.slides").directive("w11kPrettyPrint", [ "$window", "$document", function($window, $document) {
    var escapeHTML = function(html) {
        if (angular.isUndefined(html)) {
            return;
        }
        return html.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    };
    var containerTemplate = '<div class="w11k-pretty-print"><pre class="prettyprint linenums"></pre></div>';
    var titleTemplate = '<div class="title"></div>';
    return {
        restrict: "A",
        terminal: true,
        compile: function(tElement, tAttrs) {
            if (angular.isFunction($window.prettyPrintOne)) {
                var html = tElement.html();
                var escapedHtml = escapeHTML(html);
                var prettifiedHtml = $window.prettyPrintOne(escapedHtml, tAttrs.lang, true);
                var container = angular.element(containerTemplate);
                var preElement = container.find("pre");
                preElement.html(prettifiedHtml);
                tElement.replaceWith(container);
                return function(scope, element, attrs) {
                    attrs.$observe("title", function(titleText) {
                        if (titleText !== undefined && titleText !== "") {
                            var titleElement = angular.element(titleTemplate);
                            titleElement.html(titleText);
                            container.prepend(titleElement);
                        }
                    });
                };
            }
        }
    };
} ]);

"use strict";

angular.module("w11k.slides").factory("SlidesService", [ "slidesConfig", "$location", "$rootScope", function(slidesConfig, $location, $rootScope) {
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
    $rootScope.$on("$locationChangeSuccess", function() {
        var slideName = $location.path();
        if (slideName.substring(0, 1) === "/") {
            slideName = slideName.substring(1, slideName.length);
        }
        var slide = slidesMap[slideName];
        if (angular.isDefined(slide)) {
            slide.activate();
        }
    });
    function mapSlidesConfig() {
        var prefix = slidesConfig.slideTemplatePrefix || "slides/content/";
        var suffix = slidesConfig.slideTemplateSuffix || ".tpl.html";
        slides = slidesConfig.slides.map(function(slide) {
            var slideObject = {
                name: slide,
                template: prefix + slide + suffix,
                active: false
            };
            slideObject.activate = function() {
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
            } else {
                previous = slides[slides.length - 1];
            }
            var next;
            if (i + 1 < slides.length) {
                next = slides[i + 1];
            } else {
                next = slides[0];
            }
            element.previous = previous;
            element.next = next;
            slidesMap[element.name] = element;
        }
    }
    mapSlidesConfig();
    activateFirstSlide();
    return {
        getActiveSlide: function() {
            return activeSlide;
        },
        getSlides: function() {
            return slides;
        },
        navigateTo: function(slideName) {
            $location.path(slideName);
        },
        navigateToFirst: function() {
            $location.path(slides[0].name);
        },
        navigateToLast: function() {
            $location.path(slides[slides.length - 1].name);
        },
        navigateToOverview: function() {
            $location.path(slides[1].name);
        }
    };
} ]);

angular.module("w11k.slides").controller("SlidesCtrl", [ "$scope", "SlidesService", function($scope, SlidesService) {
    $scope.slides = SlidesService.getSlides();
} ]);

angular.module("w11k.slides").directive("w11kSlideMaster", [ "slidesConfig", function(slidesConfig) {
    var removeChildren = function(node) {
        var last = node.lastChild;
        if (last) {
            do {
                node.removeChild(last);
                last = node.lastChild;
            } while (last);
        }
    };
    return {
        templateUrl: function(element, attrs) {
            var key = attrs.w11kSlideMaster || attrs.master;
            var templateUrl = slidesConfig.masters[key];
            if (angular.isUndefined(templateUrl)) {
                throw new Error('No Mater-Slide found for "' + key + '". Please configure "slidesConfig" properly.');
            }
            return templateUrl;
        },
        restrict: "EA",
        replace: true,
        transclude: true,
        link: function(scope, iElement, iAttrs, ctrl, transclude) {
            var transclusionScope;
            transclude(function(clone, scope) {
                for (var i = 0; i < clone.length; i++) {
                    var part = clone[i];
                    if (part !== undefined && angular.isFunction(part.getAttribute)) {
                        var partName = part.getAttribute("w11k-slide-part-source");
                        if (partName !== undefined && partName !== null) {
                            var selector = '[w11k-slide-part-target="' + partName + '"]';
                            var container = iElement[0].querySelector(selector);
                            if (container !== null) {
                                removeChildren(container);
                                container.appendChild(part, container);
                                container.removeAttribute("w11k-slide-part-target");
                            }
                        }
                    }
                }
                transclusionScope = scope;
            });
            scope.$on("$destroy", function() {
                transclusionScope.$destroy();
            });
        }
    };
} ]);

angular.module("w11k.slides").directive("w11kSlides", [ "$location", "$window", "$document", "SlidesService", "$rootScope", "slidesConfig", function($location, $window, $document, SlidesService, $rootScope, slidesConfig) {
    return {
        restrict: "EA",
        templateUrl: slidesConfig.directiveTemplateUrl || "slides/slides.tpl.html",
        replace: true,
        link: function(scope, element) {
            var goToNext = function() {
                var next = SlidesService.getActiveSlide().next;
                if (angular.isDefined(next)) {
                    SlidesService.navigateTo(next.name);
                }
            };
            var goToPrevious = function() {
                var previous = SlidesService.getActiveSlide().previous;
                if (angular.isDefined(previous)) {
                    SlidesService.navigateTo(previous.name);
                }
            };
            var localStorageModeKey = "w11k-slides.mode";
            var mode = "export";
            function toggleMode() {
                if (mode === "export") {
                    mode = "screen";
                } else if (mode === "screen") {
                    mode = "export";
                }
                setMode(mode);
                if (angular.isDefined($window.localStorage)) {
                    $window.localStorage[localStorageModeKey] = mode;
                }
            }
            function setMode(mode) {
                if (mode === "export") {
                    element.removeClass("screen");
                    element.addClass("export");
                } else if (mode === "screen") {
                    element.removeClass("export");
                    element.addClass("screen");
                }
            }
            function toggleOverlay() {
                element[0].querySelector("div.overlay").classList.toggle("active");
            }
            if (angular.isDefined($window.localStorage)) {
                if (angular.isDefined($window.localStorage[localStorageModeKey])) {
                    mode = $window.localStorage[localStorageModeKey];
                    setMode(mode);
                }
            }
            $document.bind("keydown", function(event) {
                var action;
                if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
                    return;
                }
                if (event.keyCode === 39 || event.keyCode === 34) {
                    action = goToNext;
                } else if (event.keyCode === 37 || event.keyCode === 33) {
                    action = goToPrevious;
                } else if (event.keyCode === 36) {
                    action = SlidesService.navigateToFirst;
                } else if (event.keyCode === 35) {
                    action = SlidesService.navigateToLast;
                } else if (event.keyCode === 79) {
                    action = SlidesService.navigateToOverview;
                } else if (event.keyCode === 69) {
                    action = toggleMode;
                } else if (event.keyCode === 80 || event.keyCode === 190) {
                    action = toggleOverlay;
                }
                if (action) {
                    $rootScope.$apply(function() {
                        action();
                    });
                }
            });
        }
    };
} ]);