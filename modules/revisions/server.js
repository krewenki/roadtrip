var hooks = {
	beforeSave: function (data) {
		return new Promise(function (success, failure) {
			// Transform author to user_id
			var users = {
				'wck': '56f3f7cb4b88de4618e306c0',
				'may': '56fd29934b88de4618e306c5'
			}

			data.author = users[data.author];
			success(data);
		})
	},
	afterSave: function (data) {
		var self = this;
		return new Promise(function (success, failure) {
			console.log('I am the after save hook')
			self.db.createRecord('events', {
				"module": "revisions",
				"module_id": data._id,
				"event": "Revision committed",
				"datetime": Date.now(),
				"user_id": data.author
			}).then(function (data) {
				success(data)
			}, function (err) {
				failure(err);
			})

		})
	}
}

module.exports = hooks;
