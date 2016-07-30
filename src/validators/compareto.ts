!function ($) {
	"use strict";

	$.fn.proveCompareTo = function( options ) {

		var input = $(this);
		var other = $(options.compareTo);
		var form = input.closest('form');
		var value1 = input.val();
		var value2 = other.val();
		var hasValue = input.hasValue();
		var isSetup = input.hasClass('validator-equalto-setup');
		var enabled = $('body').booleanator(options.enabled);
		var validation;

		if (!enabled) {
			validation = 'reset';
		} else if (!hasValue){
			validation = 'success';
		} else if (value1 === options.ignore) {
			validation = 'success';
		} else if (value2 === options.ignore) {
			validation = 'success';
		} else if (options.comparison === '=') {
			validation = (value1 === value2)? 'success' : 'danger';
		} else if (options.comparison === '!=') {
			validation = (value1 !== value2)? 'success' : 'danger';
		} else if (options.comparison === '>=') {
			validation = (value1 >= value2)? 'success' : 'danger';
		} else if (options.comparison === '>') {
			validation = (value1 > value2)? 'success' : 'danger';
		} else if (options.comparison === '<=') {
			validation = (value1 <= value2)? 'success' : 'danger';
		} else if (options.comparison === '<') {
			validation = (value1 < value2)? 'success' : 'danger';
		} else {
			//
		}

		//setup event to validate this input when other input value changes
		if (!isSetup){
			input.addClass('validator-equalto-setup');
			//on blur of other input
			form.on('focusout', options.equalTo, function(){
				input.validate();
			});
		}

		//return validation result
		return {
			field: options.field,
			validator: options.validator,
			status: 'validated',
			validation: validation,
			message: options.message
		};
	};
}(window.jQuery);
