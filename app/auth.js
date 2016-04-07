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
	APP.models.users.add(JSON.parse(cookie.user)); // take the cookie and stuff it into the collection at "0"

	window.U = APP.models.users.at(0); // assign 0 to the U.
}
