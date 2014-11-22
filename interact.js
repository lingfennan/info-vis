
var allEvents = [];

var eventTypes = [];
var organizations = [];
var clusterBy = ['Event Chains', 'Type', "Orgs Involved"];

function init() {
	d3.csv('data.csv', function(dataset) {
		eventTypes.push("All Events");
		organizations.push("All Organizations");

        var eventsById = {};

		dataset.forEach(function(d) {
            var e = new Event();

			e.setTitle(d["title"]);
			e.setStartDate(d["dateStarted"]);
            if (d["dateEnded"] != "") {
                e.setEndDate(d["dateEnded"]);
            }
			if ((typeof d["eventType"] != "undefined") && (d["eventType"] != "")) {
				eventTypes.push(d["eventType"]);
                e.setEventType(d["eventType"]);
			}
			if ((typeof d["causedByOrgs"] != "undefined") && (d["causedByOrgs"] != "")) {
                var orgs = d["causedByOrgs"].split(',');
				organizations.push.apply(organizations, orgs);
                e.setOrganizations(orgs);
			}

            e.setNarrative(d["narrative"]);
            e.setReferences(d["references"])
            e.setLocation(d['location']);
            e.setPeople(d['peopleInvolved']);
            e.setCausedByEvents(d['causedByEvents']);
            e.setChains(d['chains']);

            allEvents.push(e);
            eventsById[d['eventId']] = e;
		});

        allEvents.forEach(function(e) {
            var deps = [];
            e.causedByEvents.split(',').forEach(function (c) {
                deps.push(eventsById[parseInt(c)]);
            });
            e.setCausedByEvents(deps);
        });

		eventTypes = d3.set(eventTypes).values();
		organizations = d3.set(organizations).values();

        addOptions(d3.select("#showing"), eventTypes);
        addOptions(d3.select("#cluster"), clusterBy);

        timeline('#timeline')
            .events(allEvents, function(e) { return e.eventChains; })
            .draw();
	});
}
//
//function drawTimeline() {
//
//    var clusteringFunction = null;
//
//	var cluster_choice = d3.select("#cluster").node().value;
//    if(cluster_choice == 'Type') {
//        clusteringFunction = function(e) { return e.eventType; }
//    } else if(cluster_choice == 'Event Chains') {
//        clusteringFunction = function(e) { return e.eventChains; }
//    } else {
//        clusteringFunction = function(e) { return e.causedByOrganizations; }
//    }
//
//
//
//}


function addOptions(select, data) {
    select.selectAll("option").remove();
    select.selectAll("option").data(data).enter().append("option").text(function(d) {
        return d;
    })
        .attr("value", function(d) {
            return d;
        });
}


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

