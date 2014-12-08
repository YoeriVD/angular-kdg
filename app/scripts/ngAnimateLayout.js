
angular.module('ngAnimateLayout', ['ngAnimate'])

  .factory('$$compileInlineTemplate', ['$compile', '$rootScope',
    function($compile,   $rootScope) {
      var noOpAnimationCtrl = {};
      return function(element) {
        var animationCtrl;
        var templateElement = angular.element(element[0].querySelector('ng-animation'));
        if (templateElement && templateElement.length) {
          $compile(templateElement)($rootScope);
          animationCtrl = templateElement.data('$ngAnimationController');
        }
        return animationCtrl || noOpAnimationCtrl;
      }
    }])

  .factory('$animateViewPort', ['$$animateSequence', '$animate', '$$animateChildren', '$$compileInlineTemplate', '$$animateKeep',
    function($$animateSequence,   $animate,   $$animateChildren, $$compileInlineTemplate, $$animateKeep) {
      var NG_ANIMATE_QUEUED_CLASS_NAME = 'ng-animate-queued';

      return function(element, scope) {
        // this flag needs to be set such that all child animations can work
        $animate.enabled(false, element);
        $$animateChildren(element, true);
        var animationCtrl = $$compileInlineTemplate(element);

        return {
          async : animationCtrl.async,
          enter : function(parent, after, options) {
            var steps = animationCtrl.enter ? animationCtrl.enter.steps : [];
            if (steps.length) {
              var startSequence = enterAnimation(element, steps, animationCtrl.keeps);
              return enter().then(function() {
                return startSequence();
              });
            } else {
              return enter();
            }

            function enter() {
              var promise = $animate.enter(element, parent, after, options);
              !scope.$$phase && scope.$digest();
              return promise;
            }
          },
          leave : function(options) {
            var steps = animationCtrl.leave ? animationCtrl.leave.steps : [];
            if (steps.length) {
              var startSequence = leaveAnimation(element, steps, animationCtrl.keeps);
              return startSequence().then(function() {
                var promise = leave();
                !scope.$$phase && scope.$digest();
                return promise;
              });
            } else {
              return leave();
            }

            function leave() {
              return $animate.leave(element, options);
            }
          }
        }
      }

      function enterAnimation(container, steps, keeps) {
        $animate.enabled(true, container);
        angular.forEach(steps, function(step) {
          if (!step.keep) {
            var elements = container[0].querySelectorAll(step.selector) || [];
            angular.forEach(elements, function(element) {
              angular.element(element).addClass(NG_ANIMATE_QUEUED_CLASS_NAME);
            });
          }
        });
        return $$animateSequence(container, steps, function(element, step, index) {
          // this is a fake animation event to emulate an enter animation
          var promise = $animate.animate(element, step.from, step.to, 'ng-enter', {
            tempClasses: NG_ANIMATE_QUEUED_CLASS_NAME
          });
          if (step.keep) {
            promise.then(function() {
              var target = container.querySelector(step.selector);
              $$animateKeep.attach(step.selector, target);
            });
          }
          return promise;
        })
      }

      function leaveAnimation(container, steps, keeps) {
        $animate.enabled(true, container);
        angular.forEach(keeps, function(keep) {
          var element = container[0].querySelector(keep.selector);
          if (element) {
            $$animateKeep.detach(keep.selector, element);
          }
        });
        return $$animateSequence(container, steps, function(element, step, index) {
          element[0].$$NG_REMOVED = true;
          element.addClass(NG_ANIMATE_QUEUED_CLASS_NAME);
          // this is a fake animation event to emulate a leave animation. By doing this we
          // avoid reordering the DOM when the animations are complete since leave deletes nodes
          if (step.keep) {
            return $animate.animate(element, step.from, step.to, 'ng-leave-keep', 'ng-animate-leave-keep');
          } else {
            return $animate.animate(element, step.from, step.to, 'ng-leave', 'ng-animate-leave');
          }
        })
      }

      function detachElement(element) {
      }
    }])

  .factory('$$animateKeep', ['$document', function($document) {
    var self, lookup = {};
    return self = {
      calculate : function(element) {
        return (element.length ? element[0] : element).getBoundingClientRect();
      },
      detach : function(selector, element) {
        var clone = element.clone();
        var details = self.calculate(element);
        details.position='fixed';
        clone.css(details);
        clone.addClass('ng-animate-anchor');
        self.proxy(element, true);
        var body = angular.element($document[0].body);
        body.append(clone);

        lookup[selector] = {
          element: clone,
          details: details
        }
        return clone;
      },
      proxy : function(element, bool) {
        element[bool ? 'addClass' : 'removeClass']('ng-animate-proxied');
      },
      attach : function(selector, target) {
        self.proxy(element, false);
        clone.remove();
        delete lookup[selector];
      },
      query : function(selector) {
        return lookup[selector];
      }
    }
  }])

  .factory('$$animateSequence', ['$$q', '$timeout', '$filter', '$rootScope', '$$animateKeep',
    function($$q,   $timeout,   $filter,   $rootScope, $$animateKeep) {
      return function(container, steps, animateFn) {
        var sequence = [];
        angular.forEach(steps, function(step) {
          var elements, stagger = step.stagger || 0;
          if (step.keep) {
            var matchingKeep = $$animateKeep.query(step.selector);
            if (!matchingKeep) return; //continue

            var matchingTarget = container[0].querySelector(step.selector);
            var destinationStyles = $$animateKeep.calculate(matchingTarget);
            elements = [matchingKeep.element];
            step.from = matchingKeep.details;
            step.to = destinationStyles;
          } else {
            elements = container[0].querySelectorAll(step.selector);
            elements = filterAnimationElements(toArray(elements));
          }

          if (step.filter) {
            elements = $filter(step.filter)(elements);
          }
          if (step.applyClasses) {
            angular.forEach(elements, function(elm) {
              angular.element(elm).addClass(step.applyClasses);
            });
          }
          sequence.push(function() {
            var promises = [];
            angular.forEach(elements, function(element, index) {
              if (!element || element.$$NG_REMOVED) { return };
              element = angular.element(element);
              var delay = stagger * index;
              var promise = delay
                ? $timeout(angular.noop, delay, true).then(animate)
                : animate();

              promises.push(promise);
              function animate() {
                var x = animateFn(element, step, index);
                !$rootScope.$$phase && $rootScope.$digest();
                return x;
              }
            });
            return $$q.all(promises);
          });
        });

        return function() {
          var promise;
          angular.forEach(sequence, function(entry) {
            promise = promise ? promise.then(entry) : entry();
          });
          return promise;
        }
      }

      function filterAnimationElements(arr) {
        var vals = [];
        for(var i=0;i<arr.length;i++) {
          var val = arr[i];
          if (val.tagName.substr(0,6) == 'NG-ANI') {
            continue;
          }
          vals.push(val);
        }
        return vals;
      }

      function toArray(arr) {
        var vals = [];
        for(var i=0;i<arr.length;i++) {
          vals.push(arr[i]);
        }
        return vals;
      }
    }])

  .factory('$$animateTemplates', ['$cacheFactory', function($cacheFactory) {
    return $cacheFactory();
  }])

  .factory('$$findSequenceOrGroup', function() {
    return function(element) {
      var parent = element;
      while((parent = parent.parent()).length == 1) {
        if (!parent.data('$animateDirective')) break;

        var ctrl = parent.data('$ngAnimateSequenceController') ||
          parent.data('$ngAnimateGroupController');
        if (ctrl) {
          return ctrl;
        }
      }
    };
  })

  .directive('ngAnimation', ['$$animateTemplates', function($$animateTemplates) {
    return {
      controllerAs: 'animation',
      controller : ['$attrs', '$element', function($attrs, $element) {
        $element.addClass('ng-animation');
        if ($attrs.id) {
          $$animateTemplates.put($attrs.id, this);
        }
        this.async = angular.isDefined($attrs.async);
      }]
    };
  }])

  .directive('ngAnimateSequence', [function($$animateTemplates) {
    return {
      controllerAs: 'animateSequence',
      controller : ['$element', '$attrs', function($element, $attrs) {
        if(!$element.length) return;
        $element.data('$animateDirective', true);

        var animationCtrl = $element.inheritedData('$ngAnimationController');

        this.event = $attrs.on;
        var self = animationCtrl[this.event] = this;
        this.steps = [];
        this.keeps = [];
        this.register = function(data) {
          self.steps.push(data);
        };
        this.keep = function(data) {
          self.keeps.push(data);
          self.steps.push(data);
        };
      }]
    };
  }])

  .directive('ngAnimateGroup', ['$$findSequenceOrGroup', function($$findSequenceOrGroup) {
    return {
      controller : ['$element', '$attrs', function($element, $attrs) {
        $element.data('$animateDirective', true);

        var parent = $$findSequenceOrGroup($element);
        var group = $attrs;
        group.steps = [];

        parent.register(group);
        this.register = function(data) {
          group.steps.push(data);
        }
      }]
    }
  }])

  .directive('ngAnimate', ['$$findSequenceOrGroup', function($$findSequenceOrGroup) {
    return {
      link : function($scope, element, $attrs) {
        $$findSequenceOrGroup(element).register($attrs);
        element.data('$animateDirective', true);
      }
    }
  }])

  .directive('ngAnimateKeep', ['$$findSequenceOrGroup', function($$findSequenceOrGroup) {
    return {
      link : function($scope, element, $attrs) {
        $attrs.keep = true;
        $$findSequenceOrGroup(element).keep($attrs);
        element.data('$animateDirective', true);
      }
    }
  }]);
