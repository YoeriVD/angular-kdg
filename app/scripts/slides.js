angular.module('ngSlides', ['ngAnimate', 'ngAnimateLayout', 'ui.ace'])

  .run(['$rootScope', function($rootScope) {
    $rootScope.editorDebounce = { debounce: { default: 400 }};
    $rootScope.editorOptions = function(mode) {
      return {
        useWrapMode : true,
        showGutter: false,
        theme:'twilight',
        mode: mode || 'html'
      }
    };

  }])

  .factory('slideComponentStack', ['slidesLocation', function(slidesLocation) {
    var self = this;
    var stack = [];
    var checkpointCursor = -1;
    var position = 0;
    return self = {
      fragment : function(obj) {
        obj.path = slidesLocation(checkpointCursor, stack[checkpointCursor].length);
        stack[checkpointCursor] = stack[checkpointCursor] || [];
        stack[checkpointCursor].push(obj);
        obj.position = position++;
        obj.leave(0,0);
      },
      slide : function(obj) {
        checkpointCursor = stack.length;
        obj.slide = true;
        obj.path = slidesLocation(checkpointCursor, '0');
        var entry = [obj];
        stack.push(entry);
        obj.position = position++;
        obj.leave(0,0);
      },
      next : function(a,b,upDown) {
        var item = stack[a];
        if (item) {
          if (b >= item.length - 1) {
            if (a < stack.length - 1 && !upDown) {
              a++;
              b = 0;
            }
          } else {
            b++;
          }
        }
        return self.go(a,b);
      },
      previous : function(a,b,upDown) {
        var item = stack[a];
        if (item) {
          if (b <= 0) {
            if (a > 0 && !upDown) {
              a--;
              b = item.length-1;
            } else {
              b = a = 0;
            }
          } else {
            b--;
          }
        }
        return self.go(a,b);
      },
      matchIndices : function(a,b) {
        a = Math.max(a, 0);
        a = Math.min(a, stack.length-1);

        var item = stack[a];
        b = Math.max(b, 0);
        b = Math.min(b, item.length-1);
        return [a || 0,b || 0];
      },
      go : function(a, b) {
        var indices = self.matchIndices(a,b);
        var a = indices[0];
        var b = indices[1];
        var entry = stack[a][b];

        for(var i=0;i<stack.length;i++) {
          for(var j=0;j<stack[i].length;j++) {
            var item = stack[i][j];
            if (i == a) {
              if (j <= b) {
                show(item);
                continue;
              }
            }
            hide(item);
          }
        }

        return entry;

        function hide(item) {
          if (item._visible) {
            item._visible = false;
            item.leave(entry.position, item.position);
          }
        }

        function show(item, position) {
          if (!item._visible) {
            item._visible = true;
            item.enter(entry.position, item.position);
          }
        }
      }
    }
  }])

  .factory('slidesLocation', ['$location', function($location) {
    return function(a,b) {
      return '/' + a + '/' + b + '/';
    }
  }])

  .controller('ngSlidesCtrl',
           ['$rootScope', '$location', 'slideCurrentIndex', 'slideComponentStack', 'slidesLocation',
    function($rootScope,   $location,   slideCurrentIndex,   slideComponentStack, slidesLocation) {

    var ctrl = this;
    $rootScope.$watch(function() {
      return $location.path();
    }, function(path) {
      var index = slideCurrentIndex() || [];
      var a = index[0];
      var b = index[1];
      if (a >= 0 && b >= 0) {
        var barrierIndex = slideComponentStack.matchIndices(a,b);
        if (barrierIndex[0] == a || barrierIndex[1] == b) {
          slideComponentStack.go(a,b);
          return;
        }

        a = barrierIndex[0];
        b = barrierIndex[1];
      } else {
        a = b = 0;
      }

      $location.path(slidesLocation(0,0));
    });
  }])

  .factory('slideCurrentIndex', ['$location', function($location) {
    return function() {
      var path = $location.path();
      var regex = /^\/(-?\d+)(?:\/(-?\d+))?/;
      var matches = regex.exec(path);
      return matches && matches.length
          ? [parseInt(matches[1], 10) || 0, parseInt(matches[2], 10) || 0]
          : null;
    }
  }])

  .directive('ngSlides',
         ['$document', '$rootScope', 'slideCurrentIndex', 'slideComponentStack', 'slidesLocation', '$location',
  function($document,   $rootScope,   slideCurrentIndex,   slideComponentStack, slidesLocation, $location) {
    var SPACE = 32,
        ESC = 27,
        UP = 38,
        LEFT = 37,
        DOWN = 40,
        RIGHT = 39;
    return {
      controller: 'ngSlidesCtrl',
      link : function(scope, element, attrs) {
        $document.on('keydown', function(e) {
          var active = $document[0].activeElement;
          if (!active || active.tagName != "BODY") {
            return;
          };

          var direction;
          switch(e.keyCode) {
            case LEFT:
              direction = -1;
            break;
            case SPACE:
            case DOWN:
            case RIGHT:
              direction = 1;
            break;
          }

          if (direction) {
            var upDown = e.keyCode == DOWN || e.keyCode == UP;
            var index = slideCurrentIndex();
            var a = index[0];
            var b = index[1];
            $rootScope.$apply(function() {
              next = direction == 1
                ? slideComponentStack.next(a,b,upDown)
                : slideComponentStack.previous(a,b,upDown);

              $location.path(next.path);
            });
          }
        });

        element.addClass('ready');
      }
    };
  }])

  .directive('slide', ['$animate', 'slideComponentStack', '$compile',
               function($animate,   slideComponentStack,   $compile) {
    return {
      require: ['^ngSlides'],
      terminal: true,
      controller : function(){},
      link : function($scope, element, attrs) {
        slideComponentStack.slide({
          leave : function(a,b) {
            element.toggleClass('reverse', a <= b);
            $animate.addClass(element, 'ng-hide', { tempClasses: 'ng-hide-animate' });
          },
          enter : function(a,b) {
            element.toggleClass('reverse', a <= b);
            $animate.removeClass(element, 'ng-hide', { tempClasses: 'ng-hide-animate' });
          }
        });
        var inner = element.find('slide-content');
        if (!inner || !inner[0]) {
          inner = angular.element('<slide-content></slide-content>');
          inner.html(element.html());
          element.html('').append(inner);
        }
        $compile(element.contents())($scope);
      }
    };
  }])

  .directive('fragment',
    ['$animate', 'slideComponentStack', function($animate, slideComponentStack) {

    return {
      link : function(scope, element, attrs, slideCtrl) {
        slideComponentStack.fragment({
          enter : function() {
            $animate.removeClass(element, 'ng-hide', { tempClasses: 'ng-hide-animate' });
          },

          leave : function() {
            $animate.addClass(element, 'ng-hide');
          }
        });
      }
    };
  }])

  .directive('squares', function() {
    var M = 255 * 255 * 255;
    return {
      link : function(scope, element, attrs) {
        var total = scope.$eval(attrs.total);
        for(var i=0;i<total;i++) {
          var elm = angular.element('<div></div>');
          var color = randomColor(total);
          elm.css('background-color', color);
          element.append(elm);
        }
      }
    }

    function randomColor(total) {
      var index = Math.ceil(Math.random() * total);
      var p = index == 0 ? 0 : (index / (total - 1)) + 0.05;
      var color = '#' + (p * M).toString(16);
      color = color.replace(/\..*?$/,'');
      return color;
    }
  })

  .filter('unsafe', function($sce) {
      return function(val) {
          return $sce.trustAsHtml(val);
      };
  })

  .directive('ngModelHtml', ['$parse', function($parse) {
    return {
      priority : 1000,
      compile : function(element, attrs) {
        var setter = $parse(attrs.ngModel).assign;
        var html = element.html().trim();
        return function(scope) {
          setter(scope, htmlUnescape(html));
        }
      }
    }

    function htmlUnescape(code) {
      if (code) {
        code = code.replace(/&lt;/g, '<');
        code = code.replace(/&gt;/g, '>');
        code = code.replace(/&quot;/g, '"');
        code = code.replace(/&amp/g, '&');
      } else {
        code = '';
      }
      return code;
    }
  }])

  .directive('slideCodeRender', ['$compile', function($compile) {
    return {
      link : function(scope, element, attrs) {
        var newScope, content;
        scope.$watch(attrs.source, function(code) {
          if (newScope) newScope.$destroy();
          if (content) content.remove();
          newScope = scope.$new();
          content = angular.element('<div></div>');

          code = htmlUnescape(code);
          content.html(code);
          element.append(content);
          $compile(content)(newScope);
        });
      }
    }

    function htmlUnescape(code) {
      if (code) {
        code = code.replace(/&lt;/g, '<');
        code = code.replace(/&gt;/g, '>');
        code = code.replace(/&quot;/g, '"');
        code = code.replace(/&amp/g, '&');
      } else {
        code = '';
      }
      return code;
    }
  }])

  .directive("htmlTrim", [function() {
    return {
      priority: 1000,
      compile: function(element, attrs) {
        element.html(element.html().trim());
      }
    };
  }])

