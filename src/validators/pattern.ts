!function ($) {
	"use strict";

	$.fn.provePattern = function(options){

		var input = $(this);
		var value = input.val();
		var hasValue = input.hasValue();
		var enabled = $('body').booleanator(options.enabled);
		var regex = (options.regex instanceof RegExp)
			? options.regex
			: new RegExp( "^(?:" + options.regex + ")$" );
		var validation;

		if (!enabled){
			// Validators should return undefined when there is no value.
			// Decoraters will teardown any decoration when they receive an `undefined` validation result.
			validation = 'reset';
		} else if (!hasValue) {
			// All validators (except proveRequired) should return undefined when there is no value.
			// Decoraters will teardown any decoration when they receive an `undefined` validation result.
			validation = 'reset';
		} else if (regex instanceof RegExp) {
			validation = regex.test(value)? 'success' : 'danger';
		} else {
			validation = 'danger';
		}

		if (options.debug){
			console.groupCollapsed('Validator.provePattern()', options.field);
				console.log('options', options);
				console.log('validation', validation);
			console.groupEnd();
		}

		return {
			field: options.field,
			validator: options.validator,
			status: 'validated',
			validation: validation,
			message: options.message
		};
	};

}(window.jQuery);
