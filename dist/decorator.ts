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

!function ($) {
	"use strict";

	$.fn.decorate = function(plugin){

		plugin = plugin || 'bootstrap';

		var form = $(this);
		var exists = ($.isFunction($.fn[plugin]));

		if (!exists) return console.warn('Decorator plugin ($.fn.' + plugin + ') was not found.');

		// decorate the form
		form.on('status.input.prove', function(event, data){
			var input = $(event.target);
			if (exists) input[plugin](data);
		});
	};

}(window.jQuery);

!function ($) {
	"use strict";

	$.fn.decorateErrors = function(errors){

		errors = errors || {};
		var form = $(this);

		$.each(errors, function(name, message){
			var selector = '[name="' + name + '"]';
			var data = {
				field: name,
				validator: 'server',
				status: 'validated', //validated on server
				validation: 'danger',
				message: message
			};
			var input = form.find(selector);
			input.trigger('status.input.prove', data);
		});
	};

}(window.jQuery);

(function($) {

	$.fn.feedback = function (options) {

		options = options || {};

		var input = $(this);
		var klass = options.classFeedback || 'has-default';
		var group, feedback;

		if (!input.is('input')) return;
		if (input.is(':radio')) return;
		if (input.is(':checkbox')) return;

		group = input.closest('.form-group');
		feedback = input.parent().find('.form-control-feedback');

		//toggle
		if (options.state === false) {
			feedback.remove();
			group.removeClass(klass);
			group.removeClass('has-feedback');
		} else if (options.state === true){
			if (!group.hasClass('has-feedback')) {
				group.addClass(klass);
				group.addClass('has-feedback');
				input.parent().append('<span class="form-control-feedback fa fa-spinner fa-spin"></span>');
			}
		}
	};
})(window.jQuery);

!function ($) {
	"use strict";

	$.fn.garland = function(options){

		options = options || {};
		var input = $(this);

		if (options.debug){
			console.groupCollapsed('Decorators.garland()');
				console.log('input', input);
				console.log('validation', options.validation);
				console.log('wrapper', options.wrapper);
				console.log('placement', options.placement);
				console.log('message', options.message);
			console.groupEnd();
		}

		function setup(container){
			var garland = $(options.wrapper);
			garland.addClass('garland-wrapper');
			garland.text(options.message);
			container.append(garland);
		}

		function teardown(container){
			container.find('.garland-wrapper').remove();
		}

		if (options.validation === 'success') {
			teardown(input);
			setup(input, options);
		} else {
			teardown(input);
		}
	};
}(window.jQuery);

!function ($) {
	"use strict";

	$.fn.tinsel = function(options){

		options = options || {};
		var input = $(this);

		if (options.debug){
			console.groupCollapsed('Decorators.tinsel()', options.validation);
				console.log('input', input);
				console.log('validation', options.validation);
				console.log('classSuccess', options.classSuccess);
				console.log('classFailure', options.classFailure);
				console.log('classWarning', options.classWarning);
			console.groupEnd();
		}

		function decorate(container, validation){

			container.removeClass(options.classSuccess);
			container.removeClass(options.classFailure);
			container.removeClass(options.classWarning);

			if (validation === 'success') {
				container.addClass(options.classSuccess);
			} else if (validation === 'danger') {
				container.addClass(options.classFailure);
			} else if (validation === 'warning'){
				container.addClass(options.classWarning);
			}
		}

		decorate(input, options.validation);
	};
}(window.jQuery);
