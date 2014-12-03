function timeline(selector) {

    var svg = null,
        tooltip = null;

    var zoomFactor = 1;

    var events = [],
        eventClusters = [],
        eventTypes = [],
        organizations = [],
        persons = [],
        minDate = null,
        maxDate = null,
        axis = null;

    var clusterBy = ['event-chains', 'event-type', "orgs"];
    var clusterByTitleMap = {
        'event-chains': 'Chain of events',
        'event-type': 'Event Type',
        'orgs': 'Organizations'
    }


    var eventClickHanders = [];
    var onSearchCb = function() {};

    var UNIT_HEIGHT = 10;
    var TIME_AXIS_HEIGHT = 50;
    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;

    function onEventClicked(e) {
        eventClickHanders.forEach(function(handler) {
            handler(e);
        });
    }

    function calculateChartSize() {
        var w = (maxDate.getFullYear() - minDate.getFullYear() + 2) * 60 * zoomFactor; // 1 year = 30 px
        var yearMillis = 365 * 24 * 60 * 60 * 1000;
        var s = d3.time.scale()
            .domain([new Date(minDate.getTime() - yearMillis), new Date(maxDate.getTime() + 10*yearMillis)])
            .range([0,w]);
        return { width: w, scale: s }
    }

    function createTooltip() {
        return d3.tip()
            .attr('class', 'd3-tip')
            .html(function (e) {
                var tip = e.title + '<br><span class="dates">' + e.getDurationString() + '</span>';
                if(searching && e.matches.length > 0) {
                    tip += '<br><b>Search Results</b><br/>';
                    e.matches.forEach(function (m) {
                        tip += "<span class='match'>"+m+"</span><br/>";
                    })
                }
                return  tip;
            });
    }

    function calculateXCoords(scaleX) {

        eventClusters.forEach(function (ec) {
            ec.startx = scaleX(ec.startDate) - 2 * POINT_RADIUS;
            ec.endx = scaleX(ec.endDate) + 2 * POINT_RADIUS;
        });
        events.forEach(function (e) {
            e.startx = scaleX(e.startDate);
            e.endx = scaleX(e.endDate);
        });
    }

    function calcYCoordsAndDepthsAndGetMaxDepth() {
        var clusterY = function(ec) { return ec.depth * UNIT_HEIGHT + (4*UNIT_HEIGHT); };

        var depthEnds = [];
        eventClusters.forEach(function (ec) {
            for (var d = 0; d < depthEnds.length; d++) {
                var fullSpaceAvail = true;
                for(var i=0; i<=ec.thickness; i++) {
                    if (ec.startx-10 <= depthEnds[d+i]) { fullSpaceAvail = false; break; }
                }
                if(fullSpaceAvail) { break; }
            }
            ec.depth = d;
            for(var j=0; j<=ec.thickness; j++) {
                depthEnds[d+j] = ec.endx;
            }
        });

        eventClusters.forEach(function (ec) {
            ec.starty = clusterY(ec);
        });

        var pointEventY = function(e, ec) { return ec.starty + (e.getDepth(ec)+1) * UNIT_HEIGHT; };
        var extendedEventY = function(e, ec) { return pointEventY(e,ec) - UNIT_HEIGHT/2; };

        events.forEach(function(e) {
            var f = null;
            if(e.isExtendedEvent()) { f = extendedEventY; }
            else { f = pointEventY; }

            for(var i=0; i<e.parentClusters.length; i++) {
                var ec = e.parentClusters[i];
                e.setStartY( f(e,ec), ec );
            }
        });

        return depthEnds.length;
    }

    function drawAxisAndGridLines(scaleX, height, width) {
        var intervals = scaleX.ticks(d3.time.years, 5);
        axis = svg.append('g').attr('class', 'axis');

        axis.append('rect')
            .attr('x', 0).attr('y', height-TIME_AXIS_HEIGHT)
            .attr('height', TIME_AXIS_HEIGHT).attr('width', width)
            .attr('class', 'scale-bbox');

        var lines = axis.selectAll('.gridline').data(intervals).enter().append('g')
            .attr('transform', function(i) { return 'translate('+scaleX(i)+',0)'})
            .attr('class', 'gridline');

        lines.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height - TIME_AXIS_HEIGHT);

        lines.append('text')
            .attr('x', -18)
            .attr('y', height - TIME_AXIS_HEIGHT + 18)
            .text(function(i) { return i.getFullYear(); });
    }

    var evTypeSelector = null;
    var personSelector = null;
    var orgsSelector = null;
    var clusterSelector = null;
    var searchBar = null;

    var showingEventTypes = 'all';
    var showingPersons = 'all';
    var showingOrganizations = 'all';
    var searching = false;

    function eventTypeSelectionUpdate(ets) {
        showingEventTypes = ets;
        updateEventFilter();
    }
    function personSelectionUpdate(ps) {
        showingPersons = ps;
        updateEventFilter();
    }
    function orgSelectionUpdate(orgs) {
        showingOrganizations = orgs;
        updateEventFilter();
    }
    function updateEventFilter() {
        if(searching) { return; }


        events.forEach(function(e) {
            if(matchesFilter(e)) {
                e.show();
            } else {
                e.hide();
            }
        });
    }
    function matchesFilter(e) {
        var matchesET = showingEventTypes==='all' || showingEventTypes.indexOf(e.eventType) != -1;
        var matchesPersons = showingPersons==='all' || arraysIntersect(e.peopleInvolved, showingPersons);
        var matchesOrgs = showingOrganizations==='all' || arraysIntersect(e.causedByOrganizations, showingOrganizations);

        return matchesET && matchesPersons && matchesOrgs;
    }
    function arraysIntersect(arr1,arr2) {
        for(var i=0; i<arr1.length; i++) {
            var a = arr1[i];
            if(arr2.indexOf(a) >= 0) return true;
        }
        return false;
    }

    function clusterByUpdate(cb) {
        // todo - update clustering of events
    }

    function applySearch(terms) {
        onSearchCb(terms);
        evTypeSelector.disable();
        personSelector.disable();
        orgsSelector.disable();
        clusterSelector.disable();
        searching = true;

        events.forEach(function(e) {
            if(e.findMatches(terms)) {
                e.show();
            } else {
                e.hide();
            }
        });
    }

    function clearSearch() {
        onSearchCb(null);
        evTypeSelector.enable();
        personSelector.enable();
        orgsSelector.enable();
        clusterSelector.enable();
        searching = false;
        events.forEach(function (e) {
            e.matches = [];
        });
        updateEventFilter();
    }

    var timeline = {

        events: function (items, getClusterKeys) {

            events = items;

            var clusterMap = {};
            var nonClusterEvents = [];
            var pushToClustermap = function (name, event) { // utility fn, used in next loop
                if (clusterMap[name] != null) {
                    clusterMap[name].push(event);
                } else {
                    clusterMap[name] = [event];
                }
            };

            events.forEach(function (e) {
                var cn = getClusterKeys(e);
                e.setClickHandler(onEventClicked);

                eventTypes.push(e.eventType);
                organizations.push.apply(organizations, e.causedByOrganizations);
                persons.push.apply(persons, e.peopleInvolved);

                if (Object.prototype.toString.call(cn) === '[object Array]') {
                    if(cn.length==0) {
                        nonClusterEvents.push(e);
                    }
                    cn.forEach(function (c) {
                        pushToClustermap(c, e);
                    });
                } else {
                    console.log('unknown threads returned for data item ' + cn, e);
                }
            });

            eventTypes = d3.set(eventTypes).values();
            organizations = d3.set(organizations).values();
            persons = d3.set(persons).values();

            var eventTypeDescMap = {
                'diplomacy': 'Diplomacy',
                'revolution': 'Revolution',
                'political development': 'Political Development',
                'migration': 'Migration',
                'antisemetism':'Antisemetism',
                'org founded': 'Org-founded',
                'war': 'War',
                'civil unrest': 'Civil Unrest',
                'peace process': 'Peace Process',
                'uncategorized': 'Uncategorized',
                'armstice': 'Armstice'
            };

            evTypeSelector = new MultiselectDropdown('#event-types-selector', eventTypes, function(et) { return eventTypeDescMap[et]; }, eventTypeSelectionUpdate, 'all event types');
            personSelector = new MultiselectDropdown('#persons-selector', persons, null, personSelectionUpdate, 'all persons');
            orgsSelector = new MultiselectDropdown('#orgs-selector', organizations, null, orgSelectionUpdate, 'all organizations');

            clusterSelector = new SingleselectDropdown('#cluster-by-selector', 'cluster-by', clusterBy, clusterByTitleMap, clusterByUpdate);
            searchBar = new SearchBar(applySearch, clearSearch);

            for (var clusterName in clusterMap) {
                if (!clusterMap.hasOwnProperty(clusterName)) {
                    continue;
                }
                var ec = new EventCluster(clusterName, clusterMap[clusterName]);
                eventClusters.push(ec);
                clusterMap[clusterName].forEach(function(e) {
                    e.parentClusters.push(ec);
                });
            }

            nonClusterEvents.forEach(function(e) {
                var ec = new EventCluster('', [e]);
                eventClusters.push(ec);
                e.parentClusters.push(ec);
            });

            eventClusters.sort(function(ec1, ec2) { return ec1.startDate.getTime() - ec2.startDate.getTime(); });

            minDate = d3.min(events, function (e) {
                return e.startDate;
            });
            maxDate = d3.max(events, function (e) {
                return e.isExtendedEvent() ? e.endDate : e.startDate;
            });

            return timeline;
        },

        draw: function () {
            var size = calculateChartSize();

            var scaleX = size.scale;
            var width = size.width;
            calculateXCoords(scaleX);
            var maxDepth = calcYCoordsAndDepthsAndGetMaxDepth();

            var height = (maxDepth+3) * UNIT_HEIGHT + TIME_AXIS_HEIGHT;

            svg = d3.select(selector).append("svg").attr("width", width).attr("height", height);
            tooltip = createTooltip();
            svg.call(tooltip);

            drawAxisAndGridLines(scaleX, height, width);
            eventClusters.forEach(function(ec) { ec.draw(svg, tooltip, UNIT_HEIGHT); });
            events.forEach(function(e) { e.drawEventArrows(svg, UNIT_HEIGHT); });

            return timeline;
        },

        onEventClick: function(handler) {
            eventClickHanders.push(handler);

            return timeline;
        },

        zoom: function(zf) {
            zoomFactor = zf;

            var size = calculateChartSize();
            calculateXCoords(size.scale);

            svg.attr('width', size.width);

            eventClusters.forEach(function(ec) { ec.redraw(); });
            events.forEach(function(e) { e.redraw(svg, UNIT_HEIGHT); });

            var $container = $(selector);
            var s = $container.scrollLeft();
            var w = $container.width();
            var s2 = (zf*s + w/2);

            $({s: s}).animate({ s: s2 }, {
                duration: 250
                ,easing: 'linear',
                step: function() {
                    $container.scrollLeft(this.s);
                }
            });

            axis.selectAll('.gridline').each(function(d) {
                d3.select(this).transition().duration(250).ease('linear')
                    .attr('transform', 'translate('+size.scale(d)+',0)');
            });

            axis.select('.scale-bbox').attr('width', size.width);
        },

        onSearch: function(cb) {
            onSearchCb = cb;
            return timeline;
        }
    };

    return timeline;
}
