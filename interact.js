// The interactive part for timeline. And util functions.

// Global variables, initialized by init()
var type = [];
var organizations = [];
var globalDataset;
var cluster = ["Type", "Orgs Involved"];

function addOptions(select, data) {
	select.selectAll("option").remove();
	select.selectAll("option").data(data).enter().append("option").text(function(d) {
		return d;
	})
	.attr("value", function(d) {
	    return d;
	});
}

function init() {
	d3.csv(mysourceFile, function(dataset) {
		globalDataset = dataset;
		type.push("All Events");
		organizations.push("All Organizations");
		dataset.forEach(function(d) {
			if ((typeof d["Type"] != "undefined") &&
				(d["Type"] != "")) {
				type.push(d["Type"]);
			}
			if ((typeof d["Orgs Involved"] != "undefined") &&
				(d["Orgs Involved"] != "")) {
				organizations.push(d["Orgs Involved"]);
			}
		});
		type = d3.set(type).values();  // On init, showing is default to type
		organizations = d3.set(organizations).values();
		addOptions(d3.select("#showing"), type);
		addOptions(d3.select("#cluster"), cluster);
		updateSelectedDataset();
		console.log(type);
		console.log(globalDataset);
	});
}

function updateSelectedDataset() {
	//	showingSelection = "allevents";
	//	clusterSelection = cluster[0];
	// None	
	// selectedDataset = d3.nest()
	// .key()
	// .rollup()
	// .rollup(Date)
	// .rollup(DateEnded)
	// .entries()
	var showing_choice = d3.select("#showing").node().value;
	var cluster_choice = d3.select("#cluster").node().value;
	console.log(showing_choice);
	console.log(cluster_choice);
	var data = globalDataset.nest()
		.key(function(d) {
			if (d[cluster_choice] == showing_choice) {
				return d[cluster_choice];
			}
		.rollup(function(d) {
			d.start = d["Date"];
			d.end = d["DateEnded"];
		}

}

function updateSelected(id, value) {
	// update cluster, affects options in showing
	// update showing, doesn't affect options
	if (id == "cluster") {
		if (value == cluster[0]) {
			addOptions(d3.select("#showing"), type);
		} else {
			addOptions(d3.select("#showing"), organizations); 
		}
		clusterSelection = value;
	} else {
		showingSelection = value;
	}
	updateSelectionDataset();
	timeline(domElement)
		.data(selectedDataset)
	    .band("mainBand", 0.82)
        .band("naviBand", 0.08)
        .xAxis("mainBand")
        .tooltips("mainBand")
        .xAxis("naviBand")
        .labels("mainBand")
        .labels("naviBand")
        .brush("naviBand", ["mainBand"])
        .redraw();
}
