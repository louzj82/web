module.exports = /*@ngInject*/($delegate, $q, $injector) => {
	$delegate.schedule = (timeoutVariable, action, timeout, invokeApply) => {
		const co = $injector.get('co');
		if (timeoutVariable)
			$delegate.cancel(timeoutVariable);
		return $delegate(angular.isGeneratorFunction(action) ? () => {
			co(action);
		} : action, timeout, invokeApply);
	};

	$delegate.schedulePromise = (timeoutVariable, action, timeout, invokeApply) => {
		if (timeoutVariable)
			$delegate.cancel(timeoutVariable);
		const deferred = $q.defer();

		const t = $delegate(() => {
			try {
				const r = action();

				if (r.then) {
					r
						.then(res => deferred.resolve(res))
						.catch(err => deferred.reject(err));
				} else
					deferred.resolve(r);
			} catch (err) {
				deferred.reject(err);
			}
		}, timeout, invokeApply);

		return [t, deferred.promise];
	};

	return $delegate;
};