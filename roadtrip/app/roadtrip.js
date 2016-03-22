/**
 * Project-wide prototypes for convenience.
 * 
 */
window.Roadtrip = {
	View: Backbone.Marionette.ItemView.extend({
		tagName: "table",
		className: "table table-full table-left",
		onShow: function () {
			this.model.set('views', this.model.get('views') + 1);
		}
	}),
	Edit: Backbone.Marionette.ItemView.extend({
		tagName: "table",
		className: "table table-full table-left",
		ui: {
			"field": ".field",
			"save": "#save",
			"cancel": "#cancel",
			"delete": "#delete"
		},
		events: {
			"change @ui.field": "MakeDirty",
			"click @ui.save": "Save",
			"click @ui.cancel": "Cancel",
			"click @ui.delete": "Delete"
		},
		onBeforeRender: function () {
			if (!this.model) {
				this.model = new DEF.modules.contacts.Model({})
			}
		},
		MakeDirty: function (e) {
			console.log(e);
			if (e.currentTarget.value == this.model.get(e.currentTarget.id))
				$(e.currentTarget).removeClass("dirty");
			else
				$(e.currentTarget).addClass("dirty");
		},
		Save: function (e) {
			var model = this.model;
			$(".field.dirty").each(function (i, $el) {
				console.log($el.id, $el.value)
				model.set($el.id, $el.value);
			})
			if (!this.model.id)
				APP.models.contacts.create(model);
			else
				this.model.set('edits', this.model.get('edits') + 1);
			this.triggerMethod('main:list');
		},
		Cancel: function (e) {
			this.triggerMethod('main:list');
		},
		Delete: function (e) {
			APP.models.contacts.remove(this.model);
			this.triggerMethod('main:list');
		}
	})

}