module.exports = /*@ngInject*/($delegate, $rootScope, $translate, co) => {
	let propsList = ['info', 'accounts', 'files', 'contacts', 'emails', 'labels', 'keys', 'threads', 'tokens'];

	$delegate.formatError = (callName, error) => {
		callName = callName.toUpperCase();

		const translate = (name) => co(function *(){
			let r = yield $translate(name);
			if (r == name)
				throw new Error(`Translation '${name}' not found!`);
			return r;
		});

		return co(function *(){
			try {
				if (error.body && error.body.message == 'Unexpected end of input')
					return yield translate(`LAVABOOM.API.ERROR.DOWN`);

				return yield translate(`LAVABOOM.API.ERROR.${callName}.${error.status}`);
			} catch (err) {
				let def = '';
				try {
					def = yield translate(`LAVABOOM.API.ERROR.${callName}.DEFAULT`);
				} catch (e) {}

				try {
					let genericReason = yield translate(`LAVABOOM.API.ERROR.${error.status}`);
					return def ? `${def} (${genericReason})` : genericReason;
				} catch (err) {
					if (error.body && error.body.message)
						return error.body.message;

					// huh? wtf!
					try {
						return yield translate(`LAVABOOM.API.ERROR.UNKNOWN`);
					} catch (err) {
						// srsly? wtf!
						return 'unknown error';
					}
				}
			}
		});
	};

	let patchApiMethod = (obj, k, callName) => {
		let originalFunction = obj[k];

		obj[k] = (...args) => {
			console.log(`Calling ${callName}`, args ? args : '[no args]', '...');
			return co(function *() {
				try {
					let res = yield originalFunction(...args);

					console.log(`${callName}: `, res);

					return res;
				} catch (err) {
					let formattedError = yield $delegate.formatError(callName, err);
					$rootScope.currentErrorMessage = formattedError;

					console.error(`${callName} error: `, err);

					let error =  new Error(formattedError);
					error.original = err;
					throw error;
				}
			});
		};
	};

	function wrapApiCall (path, obj, k) {
		if (angular.isFunction(obj[k])) {
			let callName = [...path, k].join('.');

			//console.log('patching LavaboomAPI', callName);
			patchApiMethod(obj, k, callName);
		} else
			wrapApiObject([...path, k], obj[k]);
	}

	function wrapApiObject (path, obj) {
		for(let k in obj)
			if (obj.hasOwnProperty(k))
				wrapApiCall(path, obj, k);
	}

	for (let prop of propsList) {
		wrapApiObject([prop], $delegate[prop]);
	}

	return $delegate;
};