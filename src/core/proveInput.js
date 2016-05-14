!function ($) {
	"use strict";

	function clone(obj){
		return $.extend({}, obj);
	}

	function last(arr){
		return arr[arr.length - 1];
	}

	// pick validation result to return:
	// - the first result where result.validation === 'danger'
	// - or the last result in array
	function pickResult(results){
		var pick = clone(last(results));
		$.each(results, function(index, result){
			warnIncorrectResult(result);
			if (result.validation === 'danger') pick = clone(result);
		});
		return pick;
	}

	function isPlugin (plugin){
		var exist = ($.isFunction($.fn[plugin]));
		if (!exist) console.error('Missing validator plugin "%s".', plugin);
		return exist;
	}

	function warnIncorrectResult(result){
		if (!('field' in result)) console.warn('Missing `field` property in validator ($.fn.' + result.validator + ') result.');
		if (!('validator' in result)) console.warn('Missing `validator` property in validator ($.fn.' + result.validator + ') result.');
		if (!('status' in result)) console.warn('Missing `status` property in validator ($.fn.' + result.validator + ') result.');
		if (!('validation' in result)) console.warn('Missing `validation` property in validator ($.fn.' + result.validator + ') result.');
		if (!('message' in result)) console.warn('Missing `message` property in validator ($.fn.' + result.validator + ') result.');
	}

	// validate a single input
	$.fn.proveInput = function(field, states) {

		var validators = field.validators || {};
		var input = $(this);
		var enabled = input.booleanator(field.enabled);
		var stateful = input.booleanator(field.stateful);
		var dirty = input.dirty(field.group);
		var uuid = input.uuid();
		var state = states[uuid];
		var result = {
			field: field.name,
			validator: undefined,
			status: 'validated',
			validation: 'reset',
			message: undefined
		};
		var dfd = $.Deferred();
		var promises = [];
		var combined;

		if (field.debug){
			console.groupCollapsed('proveInput()', field.name);
			console.log('enabled', enabled);
			console.log('state', state);
			console.log('dirty', dirty);
			console.groupEnd();
		}

		//trigger event to mark the begining of validation
		input.trigger('status.input.prove', {
			field: field.name,
			status: 'validating'
		});

		// return early
		if (!enabled) {
			input.trigger('status.input.prove', result);
			states[uuid] = false;
			dfd.resolve('reset');
			return dfd;
		} else if (stateful && state && !dirty) {
			input.trigger('status.input.prove', state); //clone here?
			dfd.resolve(state.validation);
			return dfd;
		} else {

			// loop validators
			$.each(validators, function(validator, config){

				config.field = field.name;
				config.validator = validator;

				// invoke validator plugin
				if (!isPlugin(validator)) return false;
				var promise = input[validator](config);
				promises.push(promise);

				// break loop at first (non-promise) result.validation failure
				return (promise.validation === 'failure')? false : true;
			});

			// wait for the validator promises to resolve
			combined = $.when.apply($, promises);

			combined.done(function() {
				var results = $.makeArray(arguments);
				var result = pickResult(results);

				if (field.debug) {
					console.groupCollapsed('ProveInput.done()');
					console.log('results', results);
					console.log('result', result);
					console.groupEnd();
				}

				dfd.resolve(result.validation);

				//save state
				if (stateful) states[uuid] = result;

				// Trigger event indicating validation result
				input.trigger('status.input.prove', result);
			});

			//handle promise failure
			combined.fail(function(obj) {
				dfd.reject(obj);
				//todo: input.trigger('status.input.prove', obj);
			});

			// handle promise progress
			combined.progress(function(obj){
				console.log('progress', obj);
				//todo: input.trigger('status.input.prove', obj);
			});

			return dfd;
		}
	};
}(window.jQuery);
