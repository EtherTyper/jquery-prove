!function ($) {
	"use strict";

	$.fn.proveDeferred = function(options){

		var input = $(this);
		var value = input.vals();
		var hasValue = input.hasValue();
		var enabled = $('body').booleanator(options.enabled);
		var dfd = $.Deferred();
		var result = {
			field: options.field,
			validator: options.validator,
			status: 'validated',
			message: options.message
		};
		var progress;


		if (!enabled){
			result.validation = 'reset';
			dfd.resolve(result);
		} else if (!hasValue) {
			// All validators are optional except for `required` validator.
			result.validation = 'success';
			dfd.resolve(result);
		} else {

/*			// fake some progress updates
			progress = setInterval(function(){
				dfd.notify({
					field: options.field,
					validator: options.validator,
					status: 'progress',
					foo: 'bar'
				});
			}, 1000);*/

			// fake async validation on some remote server
			setTimeout(function(){

				// fake async network error
				if (options.error) {
					result.validation = 'danger';
					result.message = 'Fake network error occurred.';
					dfd.reject(result); // or dfd.resolve(result);
				} else {
					result.validation = ($.isFunction(options.validation))? options.validation(value) : options.validation;
					dfd.resolve(result);
				}

				clearInterval(progress);
			}, options.delay);
		}

		if (options.debug){
			console.groupCollapsed('Validator.proveDeferred()', options.field);
				console.log('options', options);
				console.log('input', input);
				console.log('value', value);
				console.log('enabled', enabled);
				console.log('validation', result.validation);
			console.groupEnd();
		}

		return dfd;
	};
}(window.jQuery);
