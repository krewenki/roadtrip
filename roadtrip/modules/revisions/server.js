var hooks = {
  beforeSave: function(data){
    console.log('I am the before save hook')
  },
  afterSave: function(data){
    console.log('I am the after save hook')
  }
}

module.exports = hooks;
