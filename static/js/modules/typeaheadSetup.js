const initTypeAhead = (list, css_sel, name, callback) => {
	const bh = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: list,
		sufficient: 20,
		identify(obj) {
			return obj;
		},
	});

	function bhDefaults(q, sync) {
		if (q === "" && name === "session") {
			sync(bh.all()); // This is the only change needed to get 'ALL' items as the defaults
		} else {
			bh.search(q, sync);
		}
	}

	// remove old
	$(css_sel).typeahead("destroy").off("keydown").off("typeahead:selected");
	// .val("");

	$(css_sel)
		.typeahead(
			{
				hint: false,
				highlight: true /* Enable substring highlighting */,
				minLength: 0 /* Specify minimum characters required for showing suggestions */,
			},
			{ source: bhDefaults, limit: 100 }
		)
		.on("typeahead:selected", function (evt, item) {
			callback(evt, item);
		});

	$(`${css_sel}_clear`).on("click", function () {
		$(css_sel).val("");
		callback(null, "");
	});
};
