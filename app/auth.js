if(document.cookie == ''){
	// fall back to a $.getJSON
	window.U = false;
} else {
	var c = document.cookie.split(';');
	var co = c.map(function(s){ return s.split('=')});
	var cookie = {
		user: false
	};
	for(var i in co){
		cookie[co[i][0].trim()] = decodeURIComponent(co[i][1]);
	}
	window.U = JSON.parse(cookie.user);
}
