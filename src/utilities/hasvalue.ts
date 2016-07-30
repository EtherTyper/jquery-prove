!function ($) {
	"use strict";

	$.fn.hasValue = function(prefix){

		var input = $(this);
		var value = input.vals();
		var isString, isArray, hasValue;

		isString = (typeof value === 'string');
		isArray = $.isArray(value);

		//trim string input
		value = (isString)? $.trim(value) : value;

		//exclude prefix value from string
		if (isString && typeof prefix === 'string') {
			value = value.substring(prefix.length - 1, value.length+1);
		}

		hasValue = ((isString && !!value.length) || (isArray && !!value.length && !!value[0].length));
		return hasValue;
	};
}(window.jQuery);
