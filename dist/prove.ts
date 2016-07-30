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

/**
 * jQuery Prove (https://github.com/dhollenbeck/jquery-prove)
 */
!function ($) {
	"use strict";

	function extend(obj1, obj2){
		return $.extend(true, {}, obj1, obj2);
	}

	// Prove constructor
	function Prove(form, options) {

		this.$form = $(form);
		this.options = extend(this.defaults, options);

		if (options.debug){
			console.groupCollapsed('Prove()');
			console.log('options', options);
			console.groupEnd();
		}

		this.checkOptions();
		this.setupFields();
		this.setupInputs();
		this.setupForm();
		this.setupSubmitIntercept();

		this.$form.trigger('status.form.prove', {
			status: 'setup'
		});
	}

	//$.Prove.prototype.defaults = {
	Prove.prototype = {

		defaults: {
			submit: {
				selector: 'button:submit',
				validate: true, //booleanator, validate on submit, but not if element has class `skip-validation`
				enabled: true //booleanator
			}
		},
		states: {},
		constructor: Prove,
		destroy: function() {
			this.teardownFields();
			this.teardownForm();
			this.$form.data('prove', false);
			this.$form.trigger('status.form.prove', {
				status: 'destroy'
			});
		},
		checkOptions: function(){

			//return early
			//if (!this.options.debug) return;

			//check prove options here
			if (!this.options.fields) console.warn('Missing fields option.');

			$.each(this.options.fields, function(index, field){

				if (!field.validators) console.warn('Missing validators option for field "%s".', index);
			});
		},
		//todo: $.fn.proveIntercept()
		setupSubmitIntercept: function(){

			if (!this.options.submit) return;

			var selector = this.options.submit.selector;
			var handler = $.proxy(this.submitInterceptHandler, this);

			// we intercept the submit by bind `click` rather than ':submit'
			this.$form.on('click', selector, handler);
		},
		submitInterceptHandler: function(event){

			var form = this.$form;
			var options = this.options;
			//console.log('options', options);
			var shouldValidate = form.booleanator(options.submit.validate);
			var enabledSubmit = form.booleanator(options.submit.enabled);
			var validation = (shouldValidate)? form.proveForm() : $.when();
			var alreadySubmitted = !!form.attr('nosubmit');
			var debug = options.submit.debug;

			if (debug){
				console.groupCollapsed('Prove.submitInterceptHandler()');
					console.log('shouldValidate', shouldValidate);
					console.log('enabledSubmit', enabledSubmit);
					console.log('alreadySubmitted', alreadySubmitted);
				console.groupEnd();
			}

			validation.done(function(isValid){

				// The combined deferred returned from $.fn.proveForm() has resolved.
				// The resolved value `isValid` will be either true, false, undefined.
				var addAttr = (isValid && !alreadySubmitted);
				var stop = (isValid === false || !enabledSubmit || alreadySubmitted);

				if (debug){
					console.groupCollapsed('Prove.submitInterceptHandler.done()');
						console.log('isValid', isValid);
						console.log('alreadySubmitted', alreadySubmitted);
						console.log('addAttr', addAttr);
						console.log('stop', stop);
					console.groupEnd();
				}

				if (addAttr) {

					// Add attribute to disable double form submissions.
					form.attr('nosubmit', true);

					// trigger event - for decorator
					form.trigger('status.form.prove', {
						status: 'submit',
						validated: shouldValidate
					});
				}

				// submit the form
				if (!stop) form.submit();
			});

			validation.fail(function(){
			});

			validation.progress(function(){
			});

			// Stop form submit event because we need
			// to wait for the deferreds to resolve.
			event.preventDefault();
		},
		//return jquery selector that represents the element in the DOM
		domSelector: function(field, name){
			return (field.selector)
				? field.selector
				: '[name="' + name + '"]';
		},
		setupForm: function(){
			this.$form.lint();
			this.html5NoValidate(true);
			//this.bindDomFormEvents();
		},
		teardownForm: function(){
			this.html5NoValidate(false);
			//this.unbindDomFormEvents();
		},
		setupFields: function(options){

			var opts = options || this.options;
			var fields = opts.fields || {};
			var that = this;

			$.each(fields, function(name, field){

				var selector = that.domSelector(field, name);
				var input = that.$form.find(selector);
				var trigger = input.proveEvents();

/*				console.groupCollapsed('setupInputs()');
				console.log('field', field);
				console.log('trigger', trigger);
				console.groupEnd();*/


				// augment field
				field.name = name;
				field.selector = that.domSelector(field, name);
				field.trigger = field.trigger || trigger;

				that.bindLiveValidationEvents(field);
				that.bindFieldProveEvent(field);
			});
		},
		teardownFields: function(options){

			var opts = options || this.options;
			var fields = opts.fields || {};
			var that = this;

			//console.log('teardownFields()');

			$.each(fields, function(name, field){
				that.unbindLiveValidationEvents(field);
				that.unbindFieldProveEvent(field);

				that.$form.find(field.selector).trigger('status.input.prove', {
					field: name,
					status: 'destroy'
				});
			});
		},
		html5NoValidate: function(state){
			this.$form.attr("novalidate", state);
		},
		setupInputs: function(){

			var form = this.$form;

			form.provables(this.options.fields).each(function(){

				var input = $(this);
				var field = this.field;

				input.uuid();
				input.trigger('status.input.prove', {
					field: field,
					status: 'setup'
				});
			});
		},
		/**
		* DOM Input Events Listener
		*/
		bindLiveValidationEvents: function(field){

			var el = this.$form;
			var handler = $.proxy(this.liveEventHandler, this);
			var data = clone(field);
			var wait = field.throttle || 0;
			var throttled = window._.throttle(handler, wait, {leading: false});

			// honor request to disable live validation
			if (field.trigger === false) return;

			el.on(field.trigger, field.selector, data, throttled);
		},
		unbindLiveValidationEvents: function(field){

			var el = this.$form;

			// http://api.jquery.com/off/
			el.off(field.trigger, field.selector);
		},
		liveEventHandler: function(event){
			var input = $(event.target);
			var field = event.data;
			var initiator = event.type;
			input.proveInput(field, this.states, initiator);
		},
		/**
		* DOM Form Events Listener
		*/
		//bindDomFormEvents: function(){
		//	var handler = $.proxy(this.proveEventHandler1, this);
		//	this.$form.on('validate.form.prove', handler);
		//},
		//unbindDomFormEvents: function(){
		//	this.$form.off('validate.form.prove');
		//},
		proveEventHandler1: function(event){
			event.preventDefault();
			this.$form.proveForm();
		},
		/**
			Bind Event 'validate.input.prove'
			https://github.com/dhollenbeck/jquery-prove#event-validatefieldprove

			The concern with this code is that for every prove field we bind a new
			event handler on the form container. The reason we do this because we
			also bind the field config (as event data) to the event so the event handler
			knows the field. Could the event handler determine the field config another way?

			Option 1: Can we determine from event target which field config to use?
			1. try the input.attr('name') to match field name.
			2. does any of the field config selectors match this input?
				var name = input.attr('name');
				$.each(fields, function(field, config){
					if (name === field || input.is(config.selector)) // found correct field
				})
			option 2: require the code that triggers the validate event to pass in
			the field name: input.trigger('validate.input.prove', {field: 'fieldName'})

		*/
		bindFieldProveEvent: function(field){

			var handler = $.proxy(this.proveEventHandler2, this);
			var data = clone(field);

			this.$form.on('validate.input.prove', field.selector, data, handler);
		},
		unbindFieldProveEvent: function(field){
			this.$form.off('validate.input.prove', field.selector);
		},
		proveEventHandler2: function(event){
			event.preventDefault();
			var input = $(event.target);
			var field = event.data;
			var initiator = event.type;
			input.proveInput(field, this.states, initiator);
		}
	};

	$.fn.prove = function(option, parameter, extraOptions) {

		return this.each(function() {

			var form = $(this);
			var prove = form.data('prove');
			var options = typeof option === 'object' && option;
			var isInitialized = !!prove;

			// either initialize or call public method
			if (!isInitialized) {
				// initialize new instance
				prove = new Prove(this, options);
				form.data('prove', prove);
				form.trigger('initialized.prove');
			} else if (typeof option === 'string') {
				// call public method
				// todo: warn if public method does not exist
				prove[option](parameter, extraOptions);
			} else {
				throw new Error('invalid invocation.');
			}
		});
	};

	$.fn.prove.Constructor = Prove;

	function clone(obj){
		return $.extend({}, obj);
	}

}(window.jQuery);

!function ($) {
	'use strict';

	//return string of space seperated events used to detect change to the DOM element
	$.fn.proveEvents = function() {

		var input = $(this);
		var type = input.attr('type');

		if (type === 'text') {
			return 'input change keyup blur';
		} else if (type === 'checkbox') {
			return 'input change click blur';
		} else if (type === 'file') {
			return 'input change blur';
		} else if (type === 'email') {
			return 'input change keyup blur';
		} else if (type === 'password') {
			return 'input change keyup blur';
		} else if (type === 'hidden') {
			return 'input change';
		} else if (type === 'radio') {
			return 'input change click blur';
		} else if (type === 'number') {
			return 'input change keyup blur';
		} else if (type === 'range') {
			return 'input change keyup click blur';
		} else if (type === 'button') {
			return 'input change click blur';
		} else if (type === 'tel') {
			return 'input change keyup blur';
		} else if (type === 'url') {
			return 'input change keyup blur';
		} else if (type === 'date') {
			return 'input change keyup blur';
		} else if (type === 'datetime-local') {
			return 'input change keyup blur';
		} else if (type === 'month') {
			return 'vchange keyup blur';
		} else if (type === 'time') {
			return 'input change keyup blur';
		} else if (type === 'week') {
			return 'input change keyup blur';
		} else if (input.is('select')) {
			return 'change blur';
		} else if (input.is('textarea')) {
			return 'input change keyup blur';
		} else {
			return 'input change keyup click blur';
		}
	};

}(window.jQuery);

!function ($) {
	"use strict";

	//isProved can be true, false, undefined.
	function toggleState(isValid, isProved){

		// temp hack
		if (isValid === 'success') isValid = true;
		if (isValid === 'danger') isValid = false;
		if (isValid === 'reset') isValid = undefined;

		if (isProved === false) {
			isValid = false;
		} else {
			if (isProved === true && isValid !== false) isValid = true;
		}
		return isValid;
	}

	function evaluate(results){
		var isProved = undefined;
		$.each(results, function(index, result){
			isProved = toggleState(result, isProved);
		});
		return isProved;
	}

	$.fn.proveForm = function() {

		var form = $(this);
		var prove = form.data('prove');
		var states = prove.states;
		var options = prove.options;
		var fields = options.fields;
		var filter = true;
		var promises = [];
		var dfd = $.Deferred();
		var combined;

		// Loop inputs and validate them. There may be multiple
		// identical inputs (ie radios) for which we do not want to
		// validate twice. Therefore, $.fn.provables() will filter
		// these multiples for us unless less field.group is true.
		form.provables(fields, filter).each(function(){
			var input = $(this);
			var field = fields[this.field];
			var initiator = 'prove';
			var promise = input.proveInput(field, states, initiator);
			promises.push(promise);
		});

		// wait for all field promises to resolve
		combined = $.when.apply($, promises);

		combined.done(function() {
			var results = $.makeArray(arguments);
			var validation = evaluate(results);

			if (options.debug) {
				console.groupCollapsed('Proveform.done()');
				console.log('results', results);
				console.log('validation', validation);
				console.groupEnd();
			}

			// Trigger event indicating validation result
			form.trigger('status.form.prove', {
				status: 'validated',
				validation: validation
			});

			dfd.resolve(validation);
		});
		combined.fail(function() {
			console.log('fail form', arguments);
			dfd.reject();
		});
		combined.progress(function(){
			console.log('progress');
		});

		return dfd;
	};
}(window.jQuery);

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

	//return the first non-undefined result
	function singleResult(results){
		var result;
		$.each(results, function(index, item){
			if (item) {
				result = item;
				return false;
			}
		});
		return result;
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
	$.fn.proveInput = function(field, states, initiator) {

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
			message: undefined
		};
		var dfd = $.Deferred();
		var promises = [];
		var combined;

		if (field.debug){
			console.groupCollapsed('proveInput()', field.name, initiator);
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
				config.initiator = initiator;

				// invoke validator plugin
				if (!isPlugin(validator)) return false;
				var promise = input[validator](config);
				promises.push(promise);

				// break loop at first (non-promise) result.validation ailure
				return (promise.validation === 'danger')? false : true;
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
			combined.fail(function() {
				var results = $.makeArray(arguments);
				var result = singleResult(results);
				result.status = 'errored';
				console.log('fail input', result);
				input.trigger('status.input.prove', result);
				dfd.reject(); //todo: return something here?
			});

			// handle promise progress
			combined.progress(function(){
				var results = $.makeArray(arguments);
				var result = singleResult(results);
				result.status = 'progress';
				console.log('progress input', result);
				input.trigger('status.input.prove', result);
				dfd.notify();  //todo: return something here?
			});

			return dfd;
		}
	};
}(window.jQuery);

!function () {
	"use strict";

	// name space underscore functions under jquery
	window._ = window._ || {};

	// A (possibly faster) way to get the current timestamp as an integer.
	window._.now = window._.now || Date.now || function() {
		return new Date().getTime();
	};

	// Returns a function, that, when invoked, will only be triggered at most once
	// during a given window of time. Normally, the throttled function will run
	// as much as it can, without ever going more than once per `wait` duration;
	// but if you'd like to disable the execution on the leading edge, pass
	// `{leading: false}`. To disable execution on the trailing edge, ditto.
	window._.throttle =  window._.throttle || function(func, wait, options) {
		var timeout, context, args, result;
		var previous = 0;
		if (!options) options = {};

		var later = function() {
			previous = options.leading === false ? 0 : window._.now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};

		var throttled = function() {
			var now = window._.now();
			if (!previous && options.leading === false) previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};

		throttled.cancel = function() {
			clearTimeout(timeout);
			previous = 0;
			timeout = context = args = null;
		};

		return throttled;
	};
}();

!function ($) {
	"use strict";

	$.fn.validate = function() {

		// Currently, it is not possible nor practical to have $.fn.validate()
		// work on a colleciton of elements. The reason is that $.fn.validate()
		// needs to return the form validation status or a (future) deferred.

		var el = $(this);
		var isForm = el.is(':prove-form');
		var isInput = el.is(':prove-input');

		// We trigger events here because the event
		// handlers bound to the form already have the
		// field data bound to the event handlers. These
		// event handlers will call the $.fn.proveForm()
		// or $.fn.proveInput() with the correct field data.
		if (isForm) {
			return el.proveForm();
		} else if (isInput) {
			el.trigger('validate.input.prove');
			return this;
		} else {
			// An input could be dynamically inserted and therefore, it will not pass
			// the is(':prove-input') or is(':prove-form'). Therefore, we need to assume
			// here that it is an input.
			el.trigger('validate.input.prove');
			return this;
		}

	};
}(window.jQuery);

!function ($) {
	"use strict";

	// Custom selectors
	$.extend( $.expr[":"], {

		// http://jqueryvalidation.org/blank-selector/
		blank: function( a ) {
			return !$.trim( "" + $( a ).val() );
		},

		// http://jqueryvalidation.org/filled-selector/
		filled: function( a ) {
			var val = $( a ).val();
			return val !== null && !!$.trim( "" + val );
		},

		// http://jqueryvalidation.org/unchecked-selector/
		unchecked: function( a ) {
			return !$( a ).prop( "checked" );
		},

		//http://www.sitepoint.com/make-your-own-custom-jquery-selector/
		inview: function(el) {
			if ($(el).offset().top > $(window).scrollTop() - $(el).outerHeight(true) && $(el).offset().top < $(window).scrollTop() + $(el).outerHeight(true) + $(window).height()) {
				return true;
			}
			return false;
		},

		multiple: function(el) {
			var name = $(el).attr('name') || '';
			return (name.charAt(name.length - 1) === ']');
		},

		'prove-form': function(el) {
			return ($(el).data('prove'))? true : false;
		},
		'prove-input': function(el) {
			return ($(el).data('prove-uuid'))? true : false;
		}

	});
}(window.jQuery);

!function ($) {
	"use strict";

	//todo: support a `this` context and also a passed in context
	$.fn.booleanator = function(param) {

		var state;

		function evalSelector(selector){
			try {
				return !!$(selector).length;
			} catch (e) {
				console.warn('Invalid jquery selector (`%s`) param for booleanator plugin.', selector);
				return false;
			}
		}

		function evalIs(selector, context){
			try {
				return $(context).is(selector);
			} catch (e) {
				console.warn('Invalid jquery pseudo selector (`%s`) param for booleanator plugin.', selector);
				return false;
			}
		}

		if (typeof param === 'undefined'){
			state = true;
		} else if (typeof param === 'boolean') {
			state = param;
		} else if (typeof param === 'string'){
			state = (param.charAt(0) === ':')
				? evalIs(param, this)
				: evalSelector(param);
		} else if (typeof param === 'function'){
			state = param();
		} else {
			throw new Error('Invalid param for booleanator plugin.');
		}

		return state;
	};
}(window.jQuery);

!function ($) {
	"use strict";

	//http://stackoverflow.com/a/26057776/2620505
	function hashCode (str){
		var hash = 0;
		var i, char;
		if (str.length == 0) return hash;
		for (i = 0; i < str.length; i++) {
			char = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	$.fn.dirty = function(makeDirty) {

		var el = $(this);
		var val = el.val() || '';
		var hash1, hash2, dirty;

		if ($.isArray(val)) val = val.toString();

		hash1 = el.data('prove-hash');
		hash2 = hashCode(val);
		dirty = (hash1 !== hash2);

		// override dirty state
		if (makeDirty) {
			el.data('prove-hash', false);
			return true;
		} else if (el.is(':radio')){
			return true;
		}

		if (dirty) el.data('prove-hash', hash2);
		return dirty;
	};
}(window.jQuery);

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

!function ($) {
	"use strict";

	$.fn.huntout = function(selector){
		var el = $(this);
		var container;

		if (typeof selector === 'string') {
			container = el.closest(selector);
		} else if ($.isArray(selector)){

			// test each array item until we find one
			// loop selectors in array of selectors until
			// we find the closests.
			for (var i = 0; i < selector.length; i++) {
				container = el.closest(selector[i]);
				if (container.length > 0) break;
			}
		} else if (typeof selector === 'function') {
			container = el.parents().filter(selector());
		} else {
			throw new Error('Invalid selector ("%s") param in huntout plugin.', selector);
		}

		return container;
	};

}(window.jQuery);

!function ($) {
	"use strict";

	$.fn.lint = function() {

		var elements = $(this);
		elements.each(function(){
			var el = $(this);
			if (el.is('form')) {

				// http://jibbering.com/faq/names/index.html
				// http://kangax.github.io/domlint/
				// https://api.jquery.com/submit/

				if (!$.isFunction(el.submit)) console.warn('form.submit() is not a function! Forms and their child elements should not use input names or ids that conflict with properties of a form.');

				if (el.find('#submit').length) console.warn('You should not have a form element with an id of `submit`.');
				if (el.find('#method').length) console.warn('You should not have a form element with an id of `method`.');
				if (el.find('#style').length) console.warn('You should not have a form element with an id of `style`.');
				if (el.find('#action').length) console.warn('You should not have a form element with an id of `action`.');

				if (el.find('[name="submit"]').length) console.warn('You should not have a form element with an name of `submit`.');
				if (el.find('[name="method"]').length) console.warn('You should not have a form element with an name of `method`.');
				if (el.find('[name="style"]').length) console.warn('You should not have a form element with an name of `style`.');
				if (el.find('[name="action"]').length) console.warn('You should not have a form element with an name of `action`.');
			}
		});
	};
}(window.jQuery);

!function ($) {
	"use strict";

	/**
	* Fast UUID generator, RFC4122 version 4 compliant.
	* @author Jeff Ward (jcward.com).
	* @license MIT license
	* @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
	**/
	var UUID = (function() {
	var self = {};
	var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
	self.generate = function() {
		var d0 = Math.random()*0xffffffff|0;
		var d1 = Math.random()*0xffffffff|0;
		var d2 = Math.random()*0xffffffff|0;
		var d3 = Math.random()*0xffffffff|0;
		return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
			lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
			lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
			lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
		};
		return self;
	})();


	$.fn.uuid = function() {

		//todo: handle array elements

		var el = $(this);
		var uuid = el.data('prove-uuid');
		if (!uuid) {
			uuid = UUID.generate();
			el.data('prove-uuid', uuid);
		}
		return uuid;
	};
}(window.jQuery);

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

!function ($) {
	"use strict";

	$.fn.proveCallback = function(options){

		var input = $(this);
		var value = input.vals();
		var enabled = $('body').booleanator(options.enabled);
		var validated = (enabled && $.isFunction(options.callback) && options.callback())? 'success' : 'danger';
		var validation = (enabled)? validated : 'reset';

		if (options.debug){
			console.groupCollapsed('Validator.proveCallback()', options.field);
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

!function ($) {
	"use strict";

	$.fn.proveDeferred = function(options){

		var input = $(this);
		var value = input.vals();
		var hasValue = input.hasValue();
		var enabled = $('body').booleanator(options.enabled);
		var dfd = $.Deferred();
		var result = {
			field: options.field,
			validator: options.validator,
			status: 'validated',
			message: options.message
		};
		var progress;


		if (!enabled){
			result.validation = 'reset';
			dfd.resolve(result);
		} else if (!hasValue) {
			// All validators are optional except for `required` validator.
			result.validation = 'success';
			dfd.resolve(result);
		} else {

/*			// fake some progress updates
			progress = setInterval(function(){
				dfd.notify({
					field: options.field,
					validator: options.validator,
					status: 'progress',
					foo: 'bar'
				});
			}, 1000);*/

			// fake async validation on some remote server
			setTimeout(function(){

				// fake async network error
				if (options.error) {
					result.validation = 'danger';
					result.message = 'Fake network error occurred.';
					dfd.reject(result); // or dfd.resolve(result);
				} else {
					result.validation = ($.isFunction(options.validation))? options.validation(value) : options.validation;
					dfd.resolve(result);
				}

				clearInterval(progress);
			}, options.delay);
		}

		if (options.debug){
			console.groupCollapsed('Validator.proveDeferred()', options.field);
				console.log('options', options);
				console.log('input', input);
				console.log('value', value);
				console.log('enabled', enabled);
				console.log('validation', result.validation);
			console.groupEnd();
		}

		return dfd;
	};
}(window.jQuery);

!function ($) {
	"use strict";

	$.fn.proveEqualTo = function( options ) {

		var input = $(this);
		var other = $(options.equalTo);
		var form = input.closest('form');
		var value = input.val();
		var isSetup = input.hasClass('validator-equalto-setup');
		var enabled = $('body').booleanator(options.enabled);
		var has = (value === other.val())? 'success' : 'danger';
		var validation = (enabled)?  has : 'reset';

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

!function ($) {
	"use strict";

	$.fn.proveLength = function(options){

		var input = $(this);
		var value = input.vals();
		var hasValue = input.hasValue();
		var validation = input.hasValue();
		var enabled = $('body').booleanator(options.enabled);
		var okMin = (typeof options.min !== 'undefined')? (value.length >= options.min) : true;
		var okMax = (typeof options.max !== 'undefined')? (value.length <= options.max) : true;

		if (!enabled){
			enabled = 'reset';
		} else if (!hasValue) {
			// All validators are optional except of `required` validator.
			validation = 'success';
		} else if (okMin && okMax) {
			validation = 'success';
		} else {
			validation = 'danger';
		}

		if (options.debug){
			console.groupCollapsed('Validator.proveLength()', options.field);
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

!function ($) {
	'use strict';

	$.fn.proveMax = function(options){

		var input = $(this);
		var value = input.vals();
		var enabled = $('body').booleanator(options.enabled);
		var has = (value <= options.max)? 'success' : 'danger';
		var validation = (enabled)? has : 'reset';

		if (options.debug){
			console.groupCollapsed('Validator.proveMax()', options.field);
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

!function ($) {
	"use strict";

	$.fn.proveMin = function(options){

		var input = $(this);
		var value = input.vals();
		var enabled = $('body').booleanator(options.enabled);
		var has = value >= options.min? 'success' : 'danger';
		var validation = (enabled)? has : 'reset';

		if (options.debug){
			console.groupCollapsed('Validator.proveMin()', options.field);
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

!function ($) {
	"use strict";

	$.fn.proveMissing = function( options ) {

		//return validation result
		return {
			field: options.field,
			validator: options.validator,
			status: 'validated',
			validation: 'danger',
			message: 'Prove validator "' + options.validator+ '" not found.'
		};
	};
}(window.jQuery);

!function ($) {
	"use strict";

	$.fn.provePattern = function(options){

		var input = $(this);
		var value = input.val();
		var hasValue = input.hasValue();
		var enabled = $('body').booleanator(options.enabled);
		var regex = (options.regex instanceof RegExp)
			? options.regex
			: new RegExp( "^(?:" + options.regex + ")$" );
		var validation;

		if (!enabled){
			// Validators should return undefined when there is no value.
			// Decoraters will teardown any decoration when they receive an `undefined` validation result.
			validation = 'reset';
		} else if (!hasValue) {
			// All validators (except proveRequired) should return undefined when there is no value.
			// Decoraters will teardown any decoration when they receive an `undefined` validation result.
			validation = 'reset';
		} else if (regex instanceof RegExp) {
			validation = regex.test(value)? 'success' : 'danger';
		} else {
			validation = 'danger';
		}

		if (options.debug){
			console.groupCollapsed('Validator.provePattern()', options.field);
				console.log('options', options);
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

!function ($) {
	"use strict";

	$.fn.proveRequired = function(options){

		var input = $(this);
		var value = input.vals();
		var enabled = $('body').booleanator(options.enabled);
		var has = input.hasValue(options.prefix)? 'success' : 'danger';
		var validation = (enabled)? has : 'reset';

		if (options.debug){
			console.groupCollapsed('Validator.proveRequired()', options.field, options.initiator);
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