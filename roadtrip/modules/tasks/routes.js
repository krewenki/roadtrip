var routes = [{
	"path": "/tasks/files",
	"method": "get",
	"handler": function (request, response) {
		// Here's where we handle stuff like file uploads specifically for tasks
		response.send('this is my file handler');
		//next();
	}
}];

module.exports = routes;
