!function ($) {
	"use strict";

	// Called at input setup and while validating entire form.
	// The `filter` param is a bool.
	// During input setup filter will be undefined.
	// During form validation it will be true.
	$.fn.provables = function(fields, filter) {

		var inputs = $();
		var form = $(this);
		fields = fields || {};

		// build selector
		$.each(fields, function(name, field){

			var found = form.find(field.selector);
			var filtered = (filter)? found.filterables(field) : found;

			filtered.each(function(){
				this.field = name;
				inputs.push(this);
			});
		});
		return inputs;
	};

	// Any field for which you might have multiple inputs of the same name (checkbox, radio, name="fields[]")
	// for which you want to be validated individually, you can set the field.group = true.
	$.fn.filterables = function(field){

		var found = $(this);
		var isRadio = found.is(':radio');
		var hasAtLeastOneChecked = (found.filter(':checked').length > 0);

		// determine how to handle multiple found
		var filtered = found.filter(function(index, element){

			if (found.length === 0){
				// No inputs found. Expect this is an unreachable condition, but
				// seems ok to filter out the not found input.
				return false;
			} else if (found.length === 1) {
				// We are only interested in filter multiple inputs,
				// so with a single found input nothing to filter here.
				return true;
			} else if (field.group === false){
				// Field config indicates we should validate these inputs individually.
				return true;
			} else if (field.group === true) {
				// Field config indicates we should validate these inputs as a collection.
				// Therefore, only validate the firsts element.
				return (index === 0);
			} else if (isRadio){
				if (hasAtLeastOneChecked){
					// Since radio has at least one checked just validate the checked input.
					return $(element).is(':checked');
				} else {
					// Since radio has no checked inputs just validate the first radio input.
					return (index === 0);
				}
			} else {
				return true;
			}
		});

		return filtered;
	};
}(window.jQuery);
