// The interactive part for timeline. And util functions.

// Global variables, initialized by init()
var type = [];
var organizations = [];
var globalDataset;	// This can be used for plotting dots.
var cluster = ["Type", "Orgs Involved"];

// Use by timeline_init
var domElement = "#timeline";
var mysourceFile = "datasample.csv";
var sourceFile = "philosophers.csv";



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
		type.push("All Events");
		organizations.push("All Organizations");
		dataset.forEach(function(d) {
			d.title = d["Title"];  // Used for plotting dots.
			d.start = parseDate(d["Date"]);
            if (d["DateEnded"] == "") {
                d.end = "";
            } else {
				d.end = parseDate(d["DateEnded"]);
            }
			if ((typeof d["Type"] != "undefined") &&
				(d["Type"] != "")) {
				type.push(d["Type"]);
			}
			if ((typeof d["Orgs Involved"] != "undefined") &&
				(d["Orgs Involved"] != "")) {
				organizations.push(d["Orgs Involved"]);
			}
			console.log(d.title);
			console.log(d.start);
			console.log(d.end);
		});
		type = d3.set(type).values();  // On init, showing is default to type
		organizations = d3.set(organizations).values();
		addOptions(d3.select("#showing"), type);
		addOptions(d3.select("#cluster"), cluster);
		globalDataset = dataset;
		updateSelectedDataset();
	});

//    d3.csv(sourceFile, function(dataset) {
//        timeline(domElement)
//            .data(dataset)
//            .band("mainBand", 0.82)
//            .band("naviBand", 0.08)
//            .xAxis("mainBand")
//            .tooltips("mainBand")
//            .xAxis("naviBand")
//            .labels("mainBand")
//            .labels("naviBand")
//            .brush("naviBand", ["mainBand"])
//            .redraw();
//
//    });


}

function updateSelectedDataset() {
	var showing_choice = d3.select("#showing").node().value;
	var cluster_choice = d3.select("#cluster").node().value;
	console.log(showing_choice);
	console.log(cluster_choice);
	// Set label
	globalDataset.forEach(function(d) {
		d.label = d[cluster_choice];
	});
	var selectedDataset = d3.nest()
		.key(function(d) {
			if (showing_choice == "All Events") {
				return d.label;
			} else if (d.label == showing_choice) {
				return d.label;
			}
		})
		.rollup(function(d) {
			return {"start": d3.min(d, function (g) { return g.start; }),
			   	"end": d3.max(d, function(g) { return (g.end == "" ? g.start : g.end); })};
		})
		.entries(globalDataset);
	selectedDataset.forEach(function(d) {
		d.label = d.key;
		d.start = d.values.start;
		d.end = d.values.end;
		console.log(d.label);
		console.log(d.start);
		console.log(d.end);
	});


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


function timelint_init() {
    /*  You need a domElement, a sourceFile and a timeline.

        The domElement will contain your timeline.
        Use the CSS convention for identifying elements,
        i.e. "div", "p", ".className", or "#id".

        The sourceFile will contain your data.
        If you prefer, you can also use tsv, xml, or json files
        and the corresponding d3 functions for your data.


        A timeline can have the following components:

        .band(bandName, sizeFactor
            bandName - string; the name of the band for references
            sizeFactor - percentage; height of the band relation to the total height
            Defines an area for timeline items.
            A timeline must have at least one band.
            Two bands are necessary, to change the selected time interval.
            Three and Bands are allowed.

        .xAxis(bandName)
            bandName - string; the name of the band the xAxis will be attached to
            Defines an xAxis for a band to show the range of the band.
            This is optional, but highly recommended.

        .labels(bandName)
            bandName - string; the name of the band the labels will be attached to
            Shows the start, length and end of the range of the band.
            This is optional.

        .tooltips(bandName)
            bandName - string; the name of the band the labels will be attached to
            Shows current start, length, and end of the selected interval of the band.
            This is optional.

        .brush(parentBand, targetBands]
            parentBand - string; the band that the brush will be attached to
            targetBands - array; the bands that are controlled by the brush
            Controls the time interval of the targetBand.
            Required, if you want to control/change the selected time interval
            of one of the other bands.

        .redraw()
            Shows the initial view of the timeline.
            This is required.

        To make yourself familiar with these components try to
        - comment out components and see what happens.
        - change the size factors (second arguments) of the bands.
        - rearrange the definitions of the components.
    */

    // Define domElement and sourceFile
	
//<script>
//
//    // Read in the data and construct the timeline
//    d3.csv(sourceFile, function(dataset) {
//        timeline(domElement)
//            .data(dataset)
//            .band("mainBand", 0.82)
//            .band("naviBand", 0.08)
//            .xAxis("mainBand")
//            .tooltips("mainBand")
//            .xAxis("naviBand")
//            .labels("mainBand")
//            .labels("naviBand")
//            .brush("naviBand", ["mainBand"])
//            .redraw();
//
//    });
//
//</script>

}
