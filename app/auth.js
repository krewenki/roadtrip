if (document.cookie == '') {
	window.location.href = '/logout';
} else {
	var c = document.cookie.split(';');
	var co = c.map(function(s) {
		return s.split('=')
	});
	var cookie = {
		user: false
	};
	for (var i in co) {
		cookie[co[i][0].trim()] = decodeURIComponent(co[i][1]);
	}

	// We need to conveniently store the user.
	if (!APP.models.users)
		APP.models.users = new DEF.modules.users.Collection(); // init the collection (since it's needed first)

	window.U = new DEF.modules.users.Model({
		is_anonymous: true
	})
	APP.models.users.once('sync', function() {
		var user = JSON.parse(cookie.user);

		window.U = APP.models.users.get(user._id); // assign 0 to the U.
		APP.trigger("auth_user")
		window.U.set({
			last_login: Date.now()
		})
	}, this)
}
