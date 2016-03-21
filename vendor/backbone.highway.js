(function (Backbone, _) {
	'use strict'; // apparently

	Backbone.Highway = {};

	var SyncCollection = (function () {

		function SyncCollection() {
			this.idAttribute = '_id';
			this._initialSync = {};
			// Add handlers for remote events
			this.io.on('child_added', _.bind(this._childAdded, this));
			this.io.on('child_changed', _.bind(this._childChanged, this));
			this.io.on('child_removed', _.bind(this._childRemoved, this));
			this.io.on('all_records', _.bind(this._initialSyncWithData, this));

			_.defer(_.bind(function () {
				this.io.emit('init', this.table);
			}, this));

			// Handle changes in any local models.
			this.listenTo(this, 'change', this._updateModel, this);
			// Listen for destroy event to remove models.
			this.listenTo(this, 'destroy', this._removeModel, this);
		}


		SyncCollection.protoype = {

			create: function (model, options) {
				options = options ? _.clone(options) : {};
				if (options.wait) {
					this._log('Wait option provided to create, ignoring.');
				}
				if (!model) {
					return false;
				}
				var set = this.add([model], options);
				this.io.emit('create', model);
				return set[0];
			},

			remove: function (models, options) {
				if (!_.isArray(models))
					models = [models]
				for (var i in models) {
					this.io.emit('destroy', models[i].toJSON())
					Backbone.Collection.prototype.remove.call(
						this, [models[i]]
					);
				}
			},

			reset: function (models, options) {
				options = options ? _.clone(options) : {};
				// Remove all models remotely.
				this.remove(this.models, {
					silent: true
				});
				// Add new models.
				var ret = this.add(models, {
					silent: true
				});
				// Trigger 'reset' event.
				if (!options.silent) {
					this.trigger('reset', this, options);
				}
				return ret;
			},

			// This function does not actually fetch data from the server.
			// Rather, the "sync" event is fired when data has been loaded
			// from the server. Since the _initialSync property will indicate
			// whether the initial load has occurred, the "sync" event can
			// be fired once _initialSync has been resolved.
			fetch: function (options) {
				Backbone.Highway._promiseEvent({
					syncPromise: this._initialSync,
					context: this,
					success: function () {
						this.trigger('sync', this, null, options);
					},
					error: function (err) {
						this.trigger('err', this, err, options);
					},
					complete: function () {
						Backbone.Highway._onCompleteCheck(this._initialSync.err, this, options);
					}
				});
			},

			_log: function (msg) {
				if (console && console.log) {
					console.log(msg);
				}
			},

			_childAdded: function (snap) {
				// XXX model prototype broken: this.model.prototype.idAttribute worked around as this.idAttribute
				var model = snap;

				if (this._suppressEvent === true) {
					this._suppressEvent = false;
					Backbone.Collection.prototype.add.call(this, [model], {
						silent: true
					});
				} else {
					Backbone.Collection.prototype.add.call(this, [model]);
				}
				this.findWhere({
					"_id": model[this.idAttribute]
				})._remoteAttributes = model;
			},

			// when a model has changed remotely find differences between the
			// local and remote data and apply them to the local model
			_childChanged: function (snap) {
				// XXX model prototype broken: this.model.prototype.idAttribute worked around as this.idAttribute
				var idAttribute = this.idAttribute;
				var model = snap

				var item = _.find(this.models, function (child) {
					return child.get('_id') == model[idAttribute];
				});

				if (!item) {

					// TODO: Investigate: what is the right way to handle this case?
					//throw new Error('Could not find model with ID ' + model.id);
					this._childAdded(snap);
					return;
				}

				this._preventSync(item, true);
				item._remoteAttributes = model;

				// find the attributes that have been deleted remotely and
				// unset them locally
				var diff = _.difference(_.keys(item.attributes), _.keys(model));
				//console.log(_.keys(item.attributes), _.keys(model));
				_.each(diff, function (key) {
					item.unset(key);
				});

				item.set(model);

				// fire sync since this is a response from the server
				this.trigger('sync', this);
				this._preventSync(item, false);
			},

			// remove an item from the collection when removed remotely
			// provides the ability to remove siliently
			_childRemoved: function (snap) {
				// XXX model prototype broken: this.model.prototype.idAttribute worked around as this.idAttribute
				var model = this.findWhere({
					"_id": snap._id
				});

				if (this._suppressEvent === true) {
					this._suppressEvent = false;
					Backbone.Collection.prototype.remove.call(
						this, [model], {
							silent: true
						}
					);
				} else {
					// trigger sync because data has been received from the server
					this.trigger('sync', this);
					Backbone.Collection.prototype.remove.call(this, [model]);
				}
			},

			// Add handlers for all models in this collection, and any future ones
			// that may be added.
			_updateModel: function (model) {
				var remoteAttributes;
				var localAttributes;
				var updateAttributes;
				var ref;

				// if the model is already being handled by listeners then return
				if (model._remoteChanging) {
					return;
				}

				remoteAttributes = model._remoteAttributes || {};
				localAttributes = model.toJSON();

				this.io.emit('update', localAttributes);

			},

			// set the attributes to be updated to Firebase
			// set any removed attributes to null so that Firebase removes them
			_compareAttributes: function (remoteAttributes, localAttributes) {
				var updateAttributes = {};

				var union = _.union(_.keys(remoteAttributes), _.keys(localAttributes));

				_.each(union, function (key) {
					if (!_.has(localAttributes, key)) {
						updateAttributes[key] = null;
					} else if (localAttributes[key] != remoteAttributes[key]) {
						updateAttributes[key] = localAttributes[key];
					}
				});

				return updateAttributes;
			},

			// Special case if '.priority' was updated - a merge is not
			// allowed so we'll have to do a full setWithPriority.
			_setWithPriority: function (ref, item) {
				var priority = item['.priority'];
				delete item['.priority'];
				ref.setWithPriority(item, priority);
				return item;
			},

			// Triggered when model.destroy() is called on one of the children.
			_removeModel: function (model, collection, options) {
				options = options ? _.clone(options) : {};
				options.success =
					_.isFunction(options.success) ? options.success : function () {};
				var childRef = this.firebase.child(model.id);
				Backbone.Highway._setWithCheck(childRef, null, _.bind(options.success, model));
			},

			_preventSync: function (model, state) {
				model._remoteChanging = state;
			},

			_initialSyncWithData: function (d) {
				// indicate that the call has been received from the server
				// and the data has successfully loaded
				this._initialSync.resolve = true;
				this._initialSync.success = true;
				this.add(d, {
					silent: true
				})

				this.trigger('sync', this, null, null);

			}
		};

		return SyncCollection;
	}());


	var Collection = Backbone.Collection.extend({
		constructor: function (model, options) {
			Backbone.Collection.apply(this, arguments);
			var self = this;
			var BaseModel = self.model;
			switch (typeof this.url) {
			case 'string':
				this.io = io(this.url);
				break;
			case 'function':
				this.io = io(this.url());
				break;
			default:
				throw new Error('url parameter required');
			}

			_.extend(this, SyncCollection.protoype);
			SyncCollection.apply(this, arguments);

			// XXX before breaking model prototype: worked around this.model.prototype.idAttribute with this.idAttribute
			this.idAttribute = this.idAttribute || BaseModel.prototype.idAttribute;
		}
	});
	Backbone.Highway.Collection = Collection;
})(window.Backbone, window._);