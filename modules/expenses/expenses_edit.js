DEF.modules.expenses.ExpenseLine = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	module: "expenses",
	template: require("./templates/expense_line.html"),
	templateHelpers: function() {
		return {
			line: this.model.collection.indexOf(this.model),
			duration: this.options.duration,
		}
	},
	ui: {
		"sum": ".sum_me",
		"resum": ".resum",
		"total_field": "#total_field",
		"employer_field": "#employer_field",
		"total": "#total",
		"category": "#category",
		"category_icon": "#category_icon",
		"field": ".expense_field",
		"employer": "#paid_by_employer",
		"employee": "#paid_by_employee",
	},
	events: {
		"keyup @ui.sum": "Sum",
		"keyup @ui.resum": "Sum",
		"click @ui.sum": "Sum",
		"click @ui.resum": "Sum",
		"change @ui.category": "ChangeCategory",
		"change @ui.field": "MakeDirty",
		"keyup @ui.field": "MakeDirty",
	},
	Sum: function() {
		total = 0
		this.ui.sum.each(function(i, el) {
			total += Number(el.value)
		})
		this.ui.total.val(total);
		this.ui.total_field.html(APP.Format.money(total));
		this.ui.employer.val(total - this.ui.employee.val())
		this.ui.employer_field.html(APP.Format.money(this.ui.employer.val()))
		this.trigger("sum"); // tell the parent
	},
	ChangeCategory: function() {
		this.ui.category_icon.html(APP.Icon(this.ui.category.val()))
	},
	MakeDirty: function(e) {
		$(e.currentTarget).addClass("dirty");
	},

})


DEF.modules.expenses.views.edit = Backbone.Marionette.CompositeView.extend({
	module: "expenses",
	template: require("./templates/edit.html"),
	id: 'EXPENSES',
	childView: DEF.modules.expenses.ExpenseLine,
	childViewContainer: "#expenses",
	childViewOptions: function() {
		return {
			duration: this.model.get('duration')
		}
	},
	ui: {
		"add": "#add",
		"field": ".field",
		"save": "#save",
		"cancel": "#cancel",
		"delete": "#delete",
		"start_date": "#start_date",
		"duration": "#duration"
	},
	events: {
		"click @ui.add": "AddLine",
		"change @ui.field": "MakeDirty",
		"click @ui.save": "Save",
		"click @ui.cancel": "Cancel",
		"click @ui.delete": "Delete",
		"change @ui.start_date": "UpdateDates",
		"change @ui.duration": "UpdateDays"
	},
	childEvents: {
		"sum": "Sum",
	},
	onBeforeRender: function() {
		if (!this.model) { // create a new model, if needed
			this.model = new DEF.modules[this.module].Model({})
		}

		var expenses = this.model.get('expenses');
		if (expenses.length == 0) {
			cats = ["plane", "hotel", "food", "food", "misc"]
			for (var i = 0; i < cats.length; i++) {
				var rec = this.GetEmptyRecord(cats[i]);
				expenses.push(rec)
			}
		}
		this.collection = new DEF.modules.expenses.ExpenseCollection(expenses);
	},
	GetEmptyRecord: function(cat = "misc") {
		return {
			category: cat,
			total: 0,
			paid_by_employee: 0,
			paid_by_employer: 0,
			days: Array.apply(null, Array(this.model.get('duration') | 0)).map(Number.prototype.valueOf, 0) // generate an array of 0's
		};
	},
	onShow: function() {
		this.Sum();
		APP.SetTitle("Expenses " + this.model.get('expense_id'), "expenses");
	},
	templateHelpers: function() {
		var rs = {
			expense_id: this.GenerateExpenseID()
		}
		return rs;
	},
	GenerateExpenseID: function() {
		if (this.model.id) // this model has been saved
			return this.model.get('expense_id'); // so do not generate a task_id
		var instance = 0;
		var models = APP.models.expenses.where()
		for (var m in models) {
			var model = models[m];
			var expense_id = model.get('expense_id');
			instance = Math.max(instance, expense_id)
		}
		instance++;
		return instance
	},
	MakeDirty: function(e) {
		if (e.currentTarget.value == this.model.get(e.currentTarget.id))
			$(e.currentTarget).removeClass("dirty");
		else
			$(e.currentTarget).addClass("dirty");
	},
	Save: function(e) {
		var model = this.model,
			save = {};
		$(".field.dirty").each(function(i, $el) {
			var val = $el.value;
			save[$el.id] = val;
		})

		var expenses = model.get('expenses');
		for (let el of $(".expense_field")) {
			var day = $(el).data('day'),
				line = $(el).data('line');
			if (!expenses[line])
				expenses[line] = {
					category: $(".categories[data-line=" + line + "]").val(),
					days: [],
					paid_by_employee: 0
				}
			if ($(el).hasClass("sum_me")) {
				if (!expenses[line].days[day])
					expenses[line].days[day] = {}
				expenses[line].days[day] = Number($(el).val())
			} else {
				expenses[line][el.id] = el.value
			}
		}
		// note, the "expenses" object is a reference to the raw data, so no .save is necessary
		save.total = APP.Format.pure($("#total_total").html());
		save.paid_by_employer = APP.Format.pure($("#total_employer").html());
		save.paid_by_employee = APP.Format.pure($("#total_employee").html());

		if (!this.model.id) {
			save["_"] = {
				created_by: U.id,
				created_on: Date.now()
			}
			return APP.models[this.module].create(save, {
				success: function(model) {
					APP.Route("#expenses/view/" + model._id)
				}.bind(this)
			});
		} else {
			console.log("save", save);
			this.model.set(save);
			this.model.SetStats("edit")
				// APP.LogEvent(this.module, this.model.id, "Edited " + Object.keys(save).join(", "), {
				// 	old: orig,
				// 	new: save
				// });
			APP.Route("#expenses/view/" + this.model.get('_id'))
		}
	},
	Sum: function() {
		var sum = {
			days: []
		}
		for (let el of $(".expense_field")) {
			switch (el.id) {
				case "total":
				case "paid_by_employee":
				case "paid_by_employer":
					if (!sum[el.id])
						sum[el.id] = 0;
					sum[el.id] += Number($(el).val())
					break;
				default:
					if ($(el).hasClass("sum_me")) {
						var day = $(el).data('day');
						if (!sum.days[day])
							sum.days[day] = 0;
						sum.days[day] += Number($(el).val());
					}

			}
		}
		$("#total_total").html(APP.Format.money(sum.total))
		$("#total_employer").html(APP.Format.money(sum.paid_by_employer))
		$("#total_employee").html(APP.Format.money(sum.paid_by_employee))
		for (var d = 0; d < sum.days.length; d++) {
			$("#total_" + (d + 1)).html(APP.Format.money(sum.days[d]))
		}
	},
	AddLine: function() {
		this.collection.push(this.GetEmptyRecord())
	},
	Cancel: function(e) {
		APP.Route("#" + this.module + "/" + "view" + "/" + this.model.id);
	},
	Delete: function(e) {
		if (prompt("Are you sure?")) {
			APP.models[this.module].remove(this.model);
			APP.Route("#" + this.module);
		}
	},
	UpdateDates: function() {
		this.model.set({
			start_date: this.ui.start_date.val()
		});

		var start = this.ui.start_date.val() + " 12:00:00" // account for timezone offset, i guess.  it's stupid.
		$(".header_dates").each(function(d, el) {
			$(el).html(APP.Format.date(new Date(start).getTime() + 1000 * 3600 * 24 * d))
		})
	},
	UpdateDays: function() {
		this.model.set({
			duration: this.ui.duration.val()
		});
		this.render(); // might be slightlybetter to just re-render the colleciton

	}

})
