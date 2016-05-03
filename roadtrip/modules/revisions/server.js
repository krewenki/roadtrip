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
		console.log('I am the after save hook')
		return data;
	}
}

module.exports = hooks;
