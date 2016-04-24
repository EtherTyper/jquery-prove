# DEVELOPER NOTES

## Stateful Validation

Prove saves the validation state of inputs in memory, but does this without saving a DOM reference. The reason we save the validation states of input is so that async validations do not need to be re-evaluated. Instead of saving a DOM reference we create a UUID that is saved as a data attribute (data-prove-uuid) on each form input. Later when that input should be validated we read the input's uuid and use the uuid to retreive the validation state of the input.

### Initialization

On initialization of each input we create and save an uuid as data attribute:
```javascript
var uuid = input.uuid();
```
### On Validation

During input validation we can retrieve the previous validation result using the uuid.

```javascript
var uuid = input.uuid();
var previous = prove.states[uuid];
```
We also make use of a plugin to detect dirty inputs where the value has changed. The dirty plugin uses a hash algorithm to save a hash of the previous input's value to determine between validation attempts if the value has changed.
```javascript
var dirty = input.dirty();
```
## Deferred Validation

All validators would return a jQuery deferred. The deferred will resolve with a value result object:
```javascript
var input = $('#email');
var validation = input.proveRequired({
	field: 'fieldName',
	enabled: true,
	debug: true
});

validation.done(function(result){
	console.log(result); // {"field": "fieldName", "uuid": "3df419ec-4c6b-4ba7-9b9f-68df0673714e", "valid": true}
});

```

When validating a field we need to iterate over multiple validators which will result in array of promises/deferreds.

```javascript
//Loop validators collecting an array of promises.
var master = $.Deferred();
var promises = [];
$.each(validators, function(name, config){
	var isValidator, promise;
	isValidator = (typeof $.fn[name] === 'function');
	if (isValidator) {
		promise = input[name](config);
		promises.push(promise);
	}
});

// Combine promises into a single promise
var combined = $.when.apply($, promises);
combined.done(function() {
	var results = arguments; // The array of resolved objects as a pseudo-array
	var isValid = evaluate(results);
	master.resolve(isValid);
	console.log('resolved', isValid, results);
});
combined.fail(function() {
	console.log("async code failed so validation failed");
});
combined.progress(function(){
	console.log('progress');
});

// return master promise, which will resolve with true, false, undefined
return master;
```

## Cheap And Cheerful Async Validation

One option is to use submit handler to submit the form data to the remote server for validation and display async validation results using a decorator. In other words, it is not required to have async validators if we handle it ourselves in the submit handler.

```javascript
form.submit(function(event){
	event.preventDefault(); //stop form submit
	
	var dfd = $.ajax({
	    url: '/your/server',
	    data: $form.serialize(),
	    dataType: 'json'
	});
	dfd.done(done);
	dfd.fail(fail);
	dfd.always(always);
	
	function fail(res){
		$.each(res.fields, function(name){
			//trigger decorator, with custom message if want
			form.trigger('validated.field.prove', {
				field: name,
				state: false,
				message: 'some message from server'
			});
			
			//do we mark the field field/input as being invalid in prove?
			form.find(name).valid(false);
		});	
	}
});
```