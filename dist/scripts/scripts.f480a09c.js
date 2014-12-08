angular.module("ngSlides",["ngAnimate","ngAnimateLayout","ui.ace"]).run(["$rootScope",function(a){a.editorDebounce={debounce:{"default":400}},a.editorOptions=function(a){return{useWrapMode:!0,showGutter:!1,theme:"twilight",mode:a||"html"}}}]).factory("slideComponentStack",["slidesLocation",function(a){var b=this,c=[],d=-1,e=0;return b={fragment:function(b){b.path=a(d,c[d].length),c[d]=c[d]||[],c[d].push(b),b.position=e++,b.leave(0,0)},slide:function(b){d=c.length,b.slide=!0,b.path=a(d,"0");var f=[b];c.push(f),b.position=e++,b.leave(0,0)},next:function(a,d,e){var f=c[a];return f&&(d>=f.length-1?a<c.length-1&&!e&&(a++,d=0):d++),b.go(a,d)},previous:function(a,d,e){var f=c[a];return f&&(0>=d?a>0&&!e?(a--,d=f.length-1):d=a=0:d--),b.go(a,d)},matchIndices:function(a,b){a=Math.max(a,0),a=Math.min(a,c.length-1);var d=c[a];return b=Math.max(b,0),b=Math.min(b,d.length-1),[a||0,b||0]},go:function(a,d){function e(a){a._visible&&(a._visible=!1,a.leave(h.position,a.position))}function f(a){a._visible||(a._visible=!0,a.enter(h.position,a.position))}for(var g=b.matchIndices(a,d),a=g[0],d=g[1],h=c[a][d],i=0;i<c.length;i++)for(var j=0;j<c[i].length;j++){var k=c[i][j];i==a&&d>=j?f(k):e(k)}return h}}}]).factory("slidesLocation",["$location",function(){return function(a,b){return"/"+a+"/"+b+"/"}}]).controller("ngSlidesCtrl",["$rootScope","$location","slideCurrentIndex","slideComponentStack","slidesLocation",function(a,b,c,d,e){a.$watch(function(){return b.path()},function(){var a=c()||[],f=a[0],g=a[1];if(f>=0&&g>=0){var h=d.matchIndices(f,g);if(h[0]==f||h[1]==g)return void d.go(f,g);f=h[0],g=h[1]}else f=g=0;b.path(e(0,0))})}]).factory("slideCurrentIndex",["$location",function(a){return function(){var b=a.path(),c=/^\/(-?\d+)(?:\/(-?\d+))?/,d=c.exec(b);return d&&d.length?[parseInt(d[1],10)||0,parseInt(d[2],10)||0]:null}}]).directive("ngSlides",["$document","$rootScope","slideCurrentIndex","slideComponentStack","slidesLocation","$location",function(a,b,c,d,e,f){var g=32,h=38,i=37,j=40,k=39;return{controller:"ngSlidesCtrl",link:function(e,l){a.on("keydown",function(e){var l=a[0].activeElement;if(l&&"BODY"==l.tagName){var m;switch(e.keyCode){case i:m=-1;break;case g:case j:case k:m=1}if(m){var n=e.keyCode==j||e.keyCode==h,o=c(),p=o[0],q=o[1];b.$apply(function(){next=1==m?d.next(p,q,n):d.previous(p,q,n),f.path(next.path)})}}}),l.addClass("ready")}}}]).directive("slide",["$animate","slideComponentStack","$compile",function(a,b,c){return{require:["^ngSlides"],terminal:!0,controller:function(){},link:function(d,e){b.slide({leave:function(b,c){e.toggleClass("reverse",c>=b),a.addClass(e,"ng-hide",{tempClasses:"ng-hide-animate"})},enter:function(b,c){e.toggleClass("reverse",c>=b),a.removeClass(e,"ng-hide",{tempClasses:"ng-hide-animate"})}});var f=e.find("slide-content");f&&f[0]||(f=angular.element("<slide-content></slide-content>"),f.html(e.html()),e.html("").append(f)),c(e.contents())(d)}}}]).directive("fragment",["$animate","slideComponentStack",function(a,b){return{link:function(c,d){b.fragment({enter:function(){a.removeClass(d,"ng-hide",{tempClasses:"ng-hide-animate"})},leave:function(){a.addClass(d,"ng-hide")}})}}}]).directive("squares",function(){function a(a){var c=Math.ceil(Math.random()*a),d=0==c?0:c/(a-1)+.05,e="#"+(d*b).toString(16);return e=e.replace(/\..*?$/,"")}var b=16581375;return{link:function(b,c,d){for(var e=b.$eval(d.total),f=0;e>f;f++){var g=angular.element("<div></div>"),h=a(e);g.css("background-color",h),c.append(g)}}}}).filter("unsafe",["$sce",function(a){return function(b){return a.trustAsHtml(b)}}]).directive("ngModelHtml",["$parse",function(a){function b(a){return a?(a=a.replace(/&lt;/g,"<"),a=a.replace(/&gt;/g,">"),a=a.replace(/&quot;/g,'"'),a=a.replace(/&amp/g,"&")):a="",a}return{priority:1e3,compile:function(c,d){var e=a(d.ngModel).assign,f=c.html().trim();return function(a){e(a,b(f))}}}}]).directive("slideCodeRender",["$compile",function(a){function b(a){return a?(a=a.replace(/&lt;/g,"<"),a=a.replace(/&gt;/g,">"),a=a.replace(/&quot;/g,'"'),a=a.replace(/&amp/g,"&")):a="",a}return{link:function(c,d,e){var f,g;c.$watch(e.source,function(e){f&&f.$destroy(),g&&g.remove(),f=c.$new(),g=angular.element("<div></div>"),e=b(e),g.html(e),d.append(g),a(g)(f)})}}}]).directive("htmlTrim",[function(){return{priority:1e3,compile:function(a){a.html(a.html().trim())}}}]),angular.module("ngAnimateLayout",["ngAnimate"]).factory("$$compileInlineTemplate",["$compile","$rootScope",function(a,b){var c={};return function(d){var e,f=angular.element(d[0].querySelector("ng-animation"));return f&&f.length&&(a(f)(b),e=f.data("$ngAnimationController")),e||c}}]).factory("$animateViewPort",["$$animateSequence","$animate","$$animateChildren","$$compileInlineTemplate","$$animateKeep",function(a,b,c,d,e){function f(c,d){return b.enabled(!0,c),angular.forEach(d,function(a){if(!a.keep){var b=c[0].querySelectorAll(a.selector)||[];angular.forEach(b,function(a){angular.element(a).addClass(h)})}}),a(c,d,function(a,d){var f=b.animate(a,d.from,d.to,"ng-enter",{tempClasses:h});return d.keep&&f.then(function(){var a=c.querySelector(d.selector);e.attach(d.selector,a)}),f})}function g(c,d,f){return b.enabled(!0,c),angular.forEach(f,function(a){var b=c[0].querySelector(a.selector);b&&e.detach(a.selector,b)}),a(c,d,function(a,c){return a[0].$$NG_REMOVED=!0,a.addClass(h),c.keep?b.animate(a,c.from,c.to,"ng-leave-keep","ng-animate-leave-keep"):b.animate(a,c.from,c.to,"ng-leave","ng-animate-leave")})}var h="ng-animate-queued";return function(a,e){b.enabled(!1,a),c(a,!0);var h=d(a);return{async:h.async,enter:function(c,d,g){function i(){var f=b.enter(a,c,d,g);return!e.$$phase&&e.$digest(),f}var j=h.enter?h.enter.steps:[];if(j.length){var k=f(a,j,h.keeps);return i().then(function(){return k()})}return i()},leave:function(c){function d(){return b.leave(a,c)}var f=h.leave?h.leave.steps:[];if(f.length){var i=g(a,f,h.keeps);return i().then(function(){var a=d();return!e.$$phase&&e.$digest(),a})}return d()}}}}]).factory("$$animateKeep",["$document",function(a){var b,c={};return b={calculate:function(a){return(a.length?a[0]:a).getBoundingClientRect()},detach:function(d,e){var f=e.clone(),g=b.calculate(e);g.position="fixed",f.css(g),f.addClass("ng-animate-anchor"),b.proxy(e,!0);var h=angular.element(a[0].body);return h.append(f),c[d]={element:f,details:g},f},proxy:function(a,b){a[b?"addClass":"removeClass"]("ng-animate-proxied")},attach:function(a){b.proxy(element,!1),clone.remove(),delete c[a]},query:function(a){return c[a]}}}]).factory("$$animateSequence",["$$q","$timeout","$filter","$rootScope","$$animateKeep",function(a,b,c,d,e){function f(a){for(var b=[],c=0;c<a.length;c++){var d=a[c];"NG-ANI"!=d.tagName.substr(0,6)&&b.push(d)}return b}function g(a){for(var b=[],c=0;c<a.length;c++)b.push(a[c]);return b}return function(h,i,j){var k=[];return angular.forEach(i,function(i){var l,m=i.stagger||0;if(i.keep){var n=e.query(i.selector);if(!n)return;var o=h[0].querySelector(i.selector),p=e.calculate(o);l=[n.element],i.from=n.details,i.to=p}else l=h[0].querySelectorAll(i.selector),l=f(g(l));i.filter&&(l=c(i.filter)(l)),i.applyClasses&&angular.forEach(l,function(a){angular.element(a).addClass(i.applyClasses)}),k.push(function(){var c=[];return angular.forEach(l,function(a,e){function f(){var b=j(a,i,e);return!d.$$phase&&d.$digest(),b}if(a&&!a.$$NG_REMOVED){a=angular.element(a);var g=m*e,h=g?b(angular.noop,g,!0).then(f):f();c.push(h)}}),a.all(c)})}),function(){var a;return angular.forEach(k,function(b){a=a?a.then(b):b()}),a}}}]).factory("$$animateTemplates",["$cacheFactory",function(a){return a()}]).factory("$$findSequenceOrGroup",function(){return function(a){for(var b=a;1==(b=b.parent()).length&&b.data("$animateDirective");){var c=b.data("$ngAnimateSequenceController")||b.data("$ngAnimateGroupController");if(c)return c}}}).directive("ngAnimation",["$$animateTemplates",function(a){return{controllerAs:"animation",controller:["$attrs","$element",function(b,c){c.addClass("ng-animation"),b.id&&a.put(b.id,this),this.async=angular.isDefined(b.async)}]}}]).directive("ngAnimateSequence",[function(){return{controllerAs:"animateSequence",controller:["$element","$attrs",function(a,b){if(a.length){a.data("$animateDirective",!0);var c=a.inheritedData("$ngAnimationController");this.event=b.on;var d=c[this.event]=this;this.steps=[],this.keeps=[],this.register=function(a){d.steps.push(a)},this.keep=function(a){d.keeps.push(a),d.steps.push(a)}}}]}}]).directive("ngAnimateGroup",["$$findSequenceOrGroup",function(a){return{controller:["$element","$attrs",function(b,c){b.data("$animateDirective",!0);var d=a(b),e=c;e.steps=[],d.register(e),this.register=function(a){e.steps.push(a)}}]}}]).directive("ngAnimate",["$$findSequenceOrGroup",function(a){return{link:function(b,c,d){a(c).register(d),c.data("$animateDirective",!0)}}}]).directive("ngAnimateKeep",["$$findSequenceOrGroup",function(a){return{link:function(b,c,d){d.keep=!0,a(c).keep(d),c.data("$animateDirective",!0)}}}]),angular.module("angularKdgApp",["ngAnimate","ngAnimateLayout","ngAria","ngCookies","ngMessages","ngResource","ngSanitize","ngTouch","ngSlides"]),angular.module("angularKdgApp").controller("MainCtrl",["$scope",function(a){a.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}]),angular.module("angularKdgApp").controller("AboutCtrl",["$scope",function(a){a.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}]);