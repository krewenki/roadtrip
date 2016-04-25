var hooks = {
	beforeSave: function ( data ) {
		console.log( 'this is the before save hook' );
		return data;
	},
	afterSave: function ( data ) {
		console.log( 'I am the after save hook' )
	}
}

module.exports = hooks;
