/**
 * w11k-slides - v0.1.2 - 2014-03-05
 * https://github.com/w11k/w11k-slides
 *
 * Copyright (c) 2014 WeigleWilczek GmbH
 */
"use strict";

angular.module("w11k.slides", []);

"use strict";

angular.module("w11k.slides").service("UnloadConfirm", function($window) {
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
});

"use strict";

angular.module("w11k.slides").directive("w11kOpenOnce", function($window, UnloadConfirm) {
    return {
        restrict: "A",
        scope: {
            name: "@"
        },
        link: function(scope, element, attrs) {
            element.bind("click", function(event) {
                var noNamedWindowOpen = scope.namedWindow === undefined || scope.namedWindow === null || scope.namedWindow.closed;
                var linkAttrSet = attrs.href !== undefined && attrs.href !== null && attrs.target !== undefined && attrs.target !== null;
                var openOnceSet = attrs.openOnce !== undefined && attrs.openOnce !== null && attrs.openOnce === "true";
                if (noNamedWindowOpen && linkAttrSet && openOnceSet) {
                    element.removeClass("example-shown");
                    UnloadConfirm.increment();
                    scope.namedWindow = $window.open(attrs.href, attrs.target);
                    event.preventDefault();
                } else if (noNamedWindowOpen === false && openOnceSet) {
                    scope.namedWindow.focus();
                    element.addClass("example-shown");
                    event.preventDefault();
                }
            });
        }
    };
});

"use strict";

angular.module("w11k.slides").directive("w11kPrettyPrint", function($window) {
    return {
        restrict: "A",
        link: function() {
            if (angular.isFunction($window.prettyPrint)) {
                $window.prettyPrint();
            }
        }
    };
});

"use strict";

angular.module("w11k.slides").constant("slidesConfig", {
    slides: []
});

angular.module("w11k.slides").factory("SlidesService", function(slidesConfig, $location, $rootScope) {
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
});

angular.module("w11k.slides").controller("SlidesCtrl", function($scope, SlidesService) {
    $scope.slides = SlidesService.getSlides();
});

angular.module("w11k.slides").directive("w11kSlides", function($location, $document, SlidesService, $rootScope, slidesConfig) {
    return {
        restrict: "EA",
        templateUrl: slidesConfig.directiveTemplateUrl || "slides/slides.tpl.html",
        replace: true,
        link: function() {
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
            $document.bind("keydown", function(event) {
                if (event.keyCode === 39) {
                    $rootScope.$apply(function() {
                        goToNext();
                    });
                } else if (event.keyCode === 37) {
                    $rootScope.$apply(function() {
                        goToPrevious();
                    });
                } else if (event.keyCode === 36) {
                    $rootScope.$apply(function() {
                        SlidesService.navigateToFirst();
                    });
                } else if (event.keyCode === 35) {
                    $rootScope.$apply(function() {
                        SlidesService.navigateToLast();
                    });
                } else if (event.keyCode === 79) {
                    $rootScope.$apply(function() {
                        SlidesService.navigateToOverview();
                    });
                }
            });
        }
    };
});