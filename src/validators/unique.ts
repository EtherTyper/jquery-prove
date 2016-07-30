!function ($) {
	"use strict";

	$.fn.proveUnique = function(options){

		var input = $(this);
		var value = input.val();
		var hasValue = input.hasValue();
		var enabled = $('body').booleanator(options.enabled);
		var others = $(options.uniqueTo).not(input);
		var validation = 'success';

		if (!enabled){
			// Validators should return undefined when there is no value.
			// Decoraters will teardown any decoration when they receive an `undefined` validation result.
			validation = 'reset';
		} else if (!hasValue) {
			// All validators (except proveRequired) should return undefined when there is no value.
			// Decoraters will teardown any decoration when they receive an `undefined` validation result.
			validation = 'reset';
		} else {
			// compare against other input values
			others.each(function(){
				var other = $(this);
				if (other.hasValue() && other.val() === value) validation = 'danger';
			});
		}

		if (options.debug){
			console.groupCollapsed('Validator.proveUnique()', options.field);
				console.log('options', options);
				console.log('value', value);
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
