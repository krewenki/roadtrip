if(document.cookie == ''){
	window.location.href = '/logout';
} else {
	var c = document.cookie.split(';');
	var co = c.map(function(s){ return s.split('=')});
	var cookie = {
		user: false
	};
	for(var i in co){
		cookie[co[i][0].trim()] = decodeURIComponent(co[i][1]);
	}
	window.U = new DEF.modules.users.Model(JSON.parse(cookie.user));
}
