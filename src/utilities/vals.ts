!function ($) {
	"use strict";

	$.fn.vals = function(options) {

		options = options || {};

		var input = $(this);
		var type = input.attr('type');
		var isSelect = input.is('select');
		var isCheckbox = (type === 'checkbox');
		var isRadio = (type === 'radio');
		var isNumber = (type === 'number');
		var isFile = (type === 'file');
		var name = input.attr('name');
		var val, idx, selector;

		//todo: why are we not handling multiple values here?

		if (isSelect){
			val = input.val();
		} else if ( isRadio ) {
			// single selection model
			val = input.filter(':checked').val();
		} else if ( isCheckbox){
			// multiple selection model
			selector = '[name="' + name + '"]:checked';
			val = input.closest('form').find(selector).val();
		} else if ( isNumber && typeof input.validity !== 'undefined' ) {
			val = input.validity.badInput ? NaN : input.val();
		} else if ( isFile ) {

			val = input.val();

			// Modern browser (chrome & safari)
			if ( val.substr( 0, 12 ) === 'C:\\fakepath\\' ) val = val.substr( 12 );

			// Legacy browsers, unix-based path
			idx = val.lastIndexOf( '/' );
			if ( idx >= 0 ) val = val.substr( idx + 1 );

			// Windows-based path
			idx = val.lastIndexOf( '\\' );
			if ( idx >= 0 ) val = val.substr( idx + 1 );
		} else if ( input.attr('contenteditable') ) {
			val = input.text();
		} else {
			val = input.val();
		}

		if ( typeof val === 'string' ) return val.replace( /\r/g, '' );

		return val;
	};
}(window.jQuery);
