if (document.cookie == '') {
	window.location.href = '/logout';
} else {
	var c = document.cookie.split(';');
	var co = c.map(function(s) {
		return s.split('=');
	});
	var cookie = {
		user: APP.anon
	};
	for (var i in co) {
		cookie[co[i][0].trim()] = co[i][1];
	}

	// We need to conveniently store the user.
	DEF.modules.users.Initialize();

	window.U = new DEF.modules.users.Model({
		is_anonymous: true
	});
	APP.models.users.once('sync', function() {
		var user = cookie.user;

		window.U = APP.models.users.get(user); // assign 0 to the U.
		APP.trigger("auth_user");
		window.U.set({
			last_login: Date.now()
		}, {
			trigger: false
		});
	}, this);
}
