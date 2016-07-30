!function ($) {
	"use strict";

	function inverse(valid){
		switch (valid) {
			case 'success': return 'danger';
			case 'warning': return 'danger';
			case 'danger': return 'success';
			case 'reset': return 'reset';
		}
		return (valid === undefined)? valid : !valid;
	}

	$.fn.bootstrap = function(options){

		options = options || {};
		var input = $(this);
		var parent1, parent2, parent3, el1, el2, group, garland, tinsel;

		if (options.status === 'progress') return;

		// manage feedback
		if (options.status === 'validating') {
			input.feedback({state: true});
		} else if (options.status === 'validated'){
			input.feedback({state: false});
		}

		if (options.status === 'validating') return;


		var tinsel = {
			validation: options.validation,
			classSuccess: 'has-success',
			classFailure: 'has-error',
			classWarning: 'has-warning'
		};

		parent1 = input.parent();
		parent2 = parent1.parent();
		parent3 = parent2.parent();
		garland = input.closest('.garland');
		tinsel = input.closest('.tinsel');

		//placement
		if (garland.length && tinsel.length) {
			el1 = garland;
			el2 = tinsel;
		} else if (parent1.hasClass('form-group')){
			el1 = parent1;
			el2 = parent1;
		} else if (parent1.is('[class^="col-"]')){
			el1 = parent1;
			el2 = parent2;
		} else if (parent1.is('td')) {
			el1 = parent1;
			el2 = parent1;
		} else if (parent1.hasClass('checkbox') || parent1.hasClass('radio')){
			el1 = parent2;
			el2 = parent2;
		} else if (parent1.hasClass('input-group')){
			el1 = parent2;
			if (parent2.is('[class^="col-"]')) {
				el2 = parent3;
			} else {
				el2 = parent2;
			}
		} else if (parent3.is('[class^="col-"]')){
			el1 = parent3;
			el2 = input.closest('.form-group');
		} else {
			group = input.closest('.form-group');
			if (group.length) {
				el1 = input.closest('.form-group');
				el2 = input.closest('.form-group');
			} else {
				el1 = parent3;
				el2 = parent3;
			}
		}

		// show message on options.validation = 'danger'.
		// remove message on options.valid = 'success'.
		// remove message on options.valid = 'reset'.
		el1.garland({
			validation: inverse(options.validation),
			wrapper: '<span class="help-block"></span>',
			message: options.message
		});

		// add success class on options.validation = 'success'.
		// add failure class on options.validation = 'danger'.
		// remove success and failure classes on options.validation = 'reset'
		el2.tinsel({
			validation: options.validation,
			classSuccess: 'has-success',
			classFailure: 'has-error',
			classWarning: 'has-warning'
		});
	};
}(window.jQuery);
