// extend angular JS object with useful is* routines to better support ES6
angular.isGenerator = (obj) => 'function' == typeof obj.next && 'function' == typeof obj.throw;

angular.isGeneratorFunction = (obj) => {
	const constructor = obj.constructor;

	if (!constructor)
		return false;
	if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName)
		return true;

	return angular.isGenerator(constructor.prototype);
};