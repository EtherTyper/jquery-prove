## Decorators

### Usage

You can decorate your form using the using the prove bootstrap decorator.
```javascript
form.prove(options);
form.decorate('bootstrap');
```
### Server Side Errors

On initial page load you might need to decorate your form with server-side errors.
```javascript
var errors = {
	field1: 'Your server side error message.',
	field2: 'Your server side error message.'
};
form.prove(options);
form.decorate('bootstrap');
form.decorateErrors(errors);
```

### Decorator Design

A decorator is a jQuery plugin which:
- Listens to prove events,
- Decorates the form inputs using event data.

The event data passed to the decorators:
```javascript
{
	field: 'fieldName',
	validator: 'validatorName',
	status: 'validated',
	validation: 'success', // 'success', 'danger', 'warning', 'reset'
	message: "Choose one."
}
```

Where data.validation is:
- `reset`
	- Indicates no validation happened.
	- Decorators should teardown any decoration.
- `success`
	- Indicates the input is valid.
	- Decorators should decorate for success.
- `failure`
	- Indicates the input is not-valid.
	- Decorators should decorate for failure.
- `warning`
	- Indicates the input is valid,
	- Decorators should decorate for warning.

### Utility Decorators

The prove bootstrap decorator uses two ulitity decorators which makes creating decorators easier:
- $.fn.garland - displays messages on form inputs.
- $.fn.tinsel - changes form CSS classes.

If you make your own decorator consider using these utility decorators to aid your development.

### Making Your Own Decorators

Making your own decorator is simple. First create your jQuery plugin decorator.
```javascript
$.fn.myCustomDecorator = function(options){
	//see $.fn.bootstrap decorator for example
};
```
Set your decorator to listen to the validated events:
```javascript
form.decorate('myCustomDecorator');
```
