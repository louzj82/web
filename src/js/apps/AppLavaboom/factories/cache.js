module.exports = /*@ngInject*/(co) => {
	var Cache = function (opts = {}) {
		var cache = {};
		const self = this;

		this.get = (name) => {
			var r = cache[name];
			if (!r)
				return null;

			var now = new Date();

			if (now - r.time > opts.ttl) {
				if (opts.isInvalidateWholeCache)
					self.invalidateAll();
				else
					self.invalidate(name);

				return null;
			}

			return r.value;
		};

		this.put = (name, value) => {
			cache[name] = {
				value: value,
				time: new Date()
			};
		};

		this.invalidate = (name) => {
			if (cache[name])
				delete cache[name];
		};

		this.invalidateAll = () => {
			cache = {};
		};

		this.call = (promiseInvoker, args) => co(function* (){
			var key = JSON.stringify(args);

			var r = self.get(key);
			if (r)
				return r;

			r = yield promiseInvoker.apply(this, args);

			self.put(key, r);

			return r;
		});
	};

	return Cache;
};