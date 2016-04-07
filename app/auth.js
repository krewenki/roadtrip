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

	if (!APP.models.users)
		APP.models.users = new DEF.modules.users.Collection();
	APP.models.users.add(JSON.parse(cookie.user));

	window.U = APP.models.users.at(0);
}
