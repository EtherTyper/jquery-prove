!function ($) {
	"use strict";

	$.fn.decorate = function(plugin){

		plugin = plugin || 'bootstrap';

		var form = $(this);
		var exists = ($.isFunction($.fn[plugin]));

		if (!exists) return console.warn('Decorator plugin ($.fn.' + plugin + ') was not found.');

		// decorate the form
		form.on('validated.input.prove', function(event, data){
			var input = $(event.target);
			if (exists) input[plugin](data);
		});
	};

}(window.jQuery);
