!function ($) {
	"use strict";

	$.fn.tinsel = function(options){

		options = options || {};
		var input = $(this);

		if (options.debug){
			console.groupCollapsed('Decorators.tinsel()');
				console.log('input', input);
				console.log('validation', options.validation);
				console.log('placement', options.placement);
				console.log('classSuccess', options.classSuccess);
				console.log('classFailure', options.classFailure);
				console.log('classWarning', options.classWarning);
			console.groupEnd();
		}

		function decorate(container, validation){
			if (validation === 'success') {
				container.addClass(options.classSuccess);
			} else if (validation === 'danger') {
				container.addClass(options.classFailure);
			} else if (validation === 'warning'){
				container.addClass(options.classWarning);
			} else if (validation === 'reset'){
				container.removeClass(options.classSuccess);
				container.removeClass(options.classFailure);
				container.removeClass(options.classWarning);
			}
		}

		decorate(input, options.validation);
	};
}(window.jQuery);
