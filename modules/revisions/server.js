var hooks = {
	beforeSave: function (self, data) {
		return new Promise(function (success, failure) {
			// Transform author to user_id
			var users = {
				'wck': '56f3f7cb4b88de4618e306c0',
				'may': '56fd29934b88de4618e306c5'
			};

			data.author = users[data.author];
			success(data);
		});
	},
	afterXSave: function (self, data) {
		return new Promise(function (success, failure) {
			var eventRecord = {
				"module": "revisions",
				"module_id": data._id,
				"event": "Revision committed",
				"datetime": Date.now(),
				"user_id": data.author
			};
			self.db.createRecord(eventRecord, 'events').then(function (data) {
				success(data);
			}, function (err) {
				failure(err);
			});
		});
	}
};

module.exports = hooks;
