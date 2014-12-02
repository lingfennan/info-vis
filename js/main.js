$(function() {

    var allEvents = [];

    d3.csv('data.csv', function(dataset) {
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
                e.setEventType(d["eventType"]);
            }
            if ((typeof d["causedByOrgs"] != "undefined") && (d["causedByOrgs"] != "")) {
                e.setOrganizations(d["causedByOrgs"]);
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

        var t = timeline('#timeline')
            .events(allEvents, function(e) { return e.eventChains; })
            .onEventClick(onEventClicked)
            .draw();
    });

    $('#start-exploring').click(function() {
        $('#intro').fadeOut('fast', function() { $('#no-event-placeholder').fadeIn('fast'); });
    })

    var eventCount = 0;
    var displays = {};

    function onEventClicked(e) {
        e.toggleSelect();

        if(e.isSelected()) {
            if(eventCount==0) {
                var $el = null;
                if ($('#intro').is(":visible")) { $el = $('#intro'); }
                else { $el = $('#no-event-placeholder'); }
                $el.fadeOut('fast', function () {
                    $('#event-details').show();
                });
            }
            displays[e.eventId] = new EventDisplay(e, closeEventDisplay);
            eventCount++;
        } else {
            closeEventDisplay(e);
        }
    }

    function closeEventDisplay(e) {
        e.deselectEvent();
        if(eventCount==0) return;
        eventCount--;
        displays[e.eventId].remove();
        delete displays[e.eventId];

        if(eventCount==0) {
            $('#event-details').fadeOut('fast', function () {
                $('#no-event-placeholder').fadeIn('fast');
            });
        }
    }

    $(window).resize(onresize);

    function onresize() {
        $('#timeline').animate({'padding-left': $('#mainbar').width()+30});
    }
    setTimeout(onresize, 200);


});
