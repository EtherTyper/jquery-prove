!function ($) {
	"use strict";

	$.fn.provePrecision = function(options){

		var regex = /^(.)*(\.[0-9]{1,2})?$/;
		var input = $(this);
		var value = input.vals();
		var enabled = $('body').booleanator(options.enabled);
		var has = regex.test(value)? 'success' : 'danger';
		var validation = (enabled)? has : 'reset';

		if (options.debug){
			console.groupCollapsed('Validator.provePrecision()', options.field);
				console.log('options', options);
				console.log('input', input);
				console.log('value', value);
				console.log('enabled', enabled);
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
