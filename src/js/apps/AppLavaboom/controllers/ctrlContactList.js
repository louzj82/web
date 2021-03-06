module.exports = /*@ngInject*/($rootScope, $scope, $translate, $state, $stateParams, co, contacts, user, hotkey) => {
	$scope.selectedContactId = null;
	$scope.searchText = '';

	const translations = {
		LB_NEW_CONTACT_SHORT: '',
		LB_EMPTY_CONTACT_SHORT: ''
	};

	$translate.bindAsObject(translations, 'MAIN.CONTACTS');

	const findContact = (cid) => {
		let letterIndex = 0;
		for(let letter of $scope.letters) {
			let index = $scope.people[letter].findIndex(c => c.id == cid);
			if (index < 0) {
				letterIndex++;
				continue;
			}
			return {
				letterIndex: letterIndex,
				index: index
			};
		}

		return null;
	};

	const nextContactId = (pos, delta = 0) => {
		let peopleByLetter;

		if ($scope.letters.length < 1)
			return null;

		if (pos.letterIndex > $scope.letters.length - 1) {
			pos.letterIndex = $scope.letters.length - 1;

			peopleByLetter = $scope.people[$scope.letters[pos.letterIndex]];
			pos.index = peopleByLetter.length - 1;
		} else peopleByLetter = $scope.people[$scope.letters[pos.letterIndex]];

		pos.index += delta;

		if (pos.index > peopleByLetter.length - 1) {
			if (pos.letterIndex < $scope.letters.length - 1) {
				peopleByLetter = $scope.people[$scope.letters[pos.letterIndex + 1]];
				return peopleByLetter[0].id;
			}
			return peopleByLetter[peopleByLetter.length - 1].id;
		}
		if (pos.index < 0) {
			if (pos.letterIndex > 0) {
				peopleByLetter = $scope.people[$scope.letters[pos.letterIndex - 1]];
				return peopleByLetter[peopleByLetter.length - 1].id;
			}
			return peopleByLetter[0].id;
		}

		return peopleByLetter[pos.index].id;
	};

	$scope.$bind('contacts-changed', () => {
		let oldContactPosition = $scope.selectedContactId !== null ? findContact($scope.selectedContactId) : null;

		$scope.list = [...contacts.people.values()].filter(c => !c.isPrivate());

		const group = (map, letter, item) => {
			if (!map[letter])
				map[letter] = [];
			map[letter].push(item);
			return map;
		};

		$scope.people = $scope.list.reduce((a, contact) => {
			if (contact.isNew)
				return group(a, '+', contact);

			if (!contact.name)
				return group(a, '?', contact);

			return group(a, contact.getSortingField(user.settings.contactsSortBy)[0], contact);
		}, {});

		Object.keys($scope.people).forEach(letter => {
			$scope.people[letter].sort((a, b) => {
				a = a.getFullName();
				b = b.getFullName();
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			});
		});

		$scope.letters = Object.keys($scope.people).sort();

		if (oldContactPosition !== null)
			$state.go('main.contacts.profile', {contactId: nextContactId(oldContactPosition)});
	});

	$scope.newContact = () => co(function *(){
		yield $state.go('main.contacts.profile', {contactId: 'new'});
	});

	$scope.deleteContact = (contactId) => co(function *(){
		return yield contacts.deleteContact(contactId);
	});

	const stateChangeSuccess = $scope.$bind('$stateChangeSuccess', () => {
		$scope.selectedContactId = $stateParams.contactId;

		const addHotkeys = () => {
			const moveContacts = delta => {
				let oldContactPosition = $scope.selectedContactId !== null ? findContact($scope.selectedContactId) : null;

				if (oldContactPosition) {
					let cid = nextContactId(oldContactPosition, delta);
					$state.go('main.contacts.profile', {contactId: cid});
				}
			};

			const moveUp = (event, key) => {
				event.preventDefault();
				moveContacts(-1);
			};

			const moveDown = (event, key) => {
				event.preventDefault();
				moveContacts(1);
			};

			hotkey.addHotkey({
				combo: ['h', 'k', 'left', 'up'],
				description: 'HOTKEY.MOVE_UP',
				callback: moveUp
			});

			hotkey.addHotkey({
				combo: ['j', 'l', 'right', 'down'],
				description: 'HOTKEY.MOVE_DOWN',
				callback: moveDown
			});
		};

		addHotkeys();
	});

	$scope.$on('$destroy', () => {
		stateChangeSuccess();
	});
};
