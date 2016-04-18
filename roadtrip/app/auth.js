	DEF.modules.users.Initialize();

	window.U = new DEF.modules.users.Model(window.User);
	APP.models.users.once('sync', function() {

		window.U = APP.models.users.get(window.User._id); // assign 0 to the U.
		APP.trigger("auth_user");
		window.U.set({
			last_login: Date.now()
		}, {
			trigger: false
		});
	}, this);
