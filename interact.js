
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
			e.setEventId(d["eventId"]);
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
                if (parseInt(c)) {
                    deps.push(eventsById[parseInt(c)]);
                    eventsById[parseInt(c)].addCausesEvents(e);
                }
            });
            e.setCausedByEvents(deps);
        });

        eventTypes = d3.set(eventTypes).values();
        organizations = d3.set(organizations).values();

        addOptions(d3.select("#showing"), eventTypes);
        addOptions(d3.select("#cluster"), clusterBy);

        var t = timeline('#timeline')
            .events(allEvents, function(e) { return e.eventChains; })
            .draw();

        setTimeout(function() {t.zoom(2); }, 2000);
    });
}

function addOptions(select, data) {
    select.selectAll("option").remove();
    select.selectAll("option").data(data).enter().append("option").text(function(d) {
        return d;
    })
        .attr("value", function(d) {
            return d;
        });
}
