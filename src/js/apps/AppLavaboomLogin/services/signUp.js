module.exports = /*@ngInject*/function (LavaboomAPI, co, user) {
	const self = this;

	this.reserve = null;
	this.plan = null;
	this.tokenSignup = null;
	this.details = null;
	this.password = null;

	this.register = (username, altEmail, isNews) => {
		var transformedUsername = user.transformUserName(username);

		self.reserve = {
			originalUsername: username,
			username: transformedUsername,
			altEmail: altEmail,
			isNews: isNews
		};
		user.altEmail = altEmail;

		return co(function * (){
			if (isNews)
				yield user.subscribeToNews();

			var res = yield LavaboomAPI.accounts.create.register({
				username: transformedUsername,
				alt_email: altEmail
			});

			return res.body;
		});
	};

	this.verifyInvite = (username, token, isNews) => {
		username = user.transformUserName(username);

		self.tokenSignup = {
			username: username,
			token: token,
			isNews: isNews
		};

		return co(function * (){
			var res = yield LavaboomAPI.accounts.create.verify({
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token
			});

			return res.body;
		});
	};

	this.setup = (password) => {
		self.password = password;
		return co(function * (){
			yield LavaboomAPI.accounts.create.setup({
				username: self.tokenSignup.username,
				invite_code: self.tokenSignup.token,
				password: user.calculateHash(password)
			});

			yield user.signIn(self.tokenSignup.username, password, true);

			var settings = angular.extend({},
				self.details,
				user.defaultSettings, {
					isSubscribedToNews: (self.reserve ? self.reserve.isNews : false) || self.tokenSignup.isNews,
					state: 'incomplete'
				});

			yield user.update(settings);

			if (user.settings.isSubscribedToNews)
				yield user.subscribeToNews();
		});
	};
};