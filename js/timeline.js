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

    var currentClustering = 'event-chains';
    var clusterBy = ['event-chains', 'event-type', "orgs"];
    var clusterByTitleMap = {
        'event-chains': 'Chain of events',
        'event-type': 'Event Type',
        'orgs': 'Organizations'
    }

    var clusteringFnMap = {
        'event-chains': function(e) { return e.eventChains; },
        'event-type': function(e) { return [e.eventType]; },
        'orgs': function(e) { return e.causedByOrganizations; }
    }


    var eventClickHanders = [];
    var onSearchCb = function() {};

    var UNIT_HEIGHT = 10;
    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;

    function onEventClicked(e) {
        d3.event.stopPropagation();
        eventClickHanders.forEach(function(handler) {
            handler(e);
        });
    }

    function calculateChartSize() {
        var w = (maxDate.getFullYear() - minDate.getFullYear()) * 60 * zoomFactor; // 1 year = 30 px
        var yearMillis = 365 * 24 * 60 * 60 * 1000;
        var s = d3.time.scale()
            .domain([new Date(minDate.getTime() - yearMillis), new Date(maxDate.getTime() + 3*yearMillis)])
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

        var lines = axis.selectAll('.gridline').data(intervals).enter().append('g')
            .attr('transform', function(i) { return 'translate('+scaleX(i)+',0)'})
            .attr('class', 'gridline');

        lines.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height);

        lines.append('text')
            .attr('class', 'gridline-label')
            .attr('x', 5)
            .attr('y', 20)
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

    function clusterByUpdate(clusterBy) {
        currentClustering = clusterBy;
        timeline.redraw();
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

    var dragoutline = null;
    var dragStartX = -1;

    $('#zoom-reset').click(function() {
        $('#zoom-reset').hide();
        timeline.zoom(null); // reset
    })

    function onDrag() {
        var x = d3.mouse(this)[0];

        if(dragStartX == -1) {
            dragStartX = x;
            dragoutline.attr('x', dragStartX);
            dragoutline.transition().duration(200).attr('opacity', 0.2);
        } else {
            var w = x - dragStartX;

            if (w < 0) {
                dragoutline.attr('width', -w).attr('x', x);
            } else {
                dragoutline.attr('width', w);
            }
        }
    }
    function onDragEnd() {
        var x = parseInt(dragoutline.attr('x'));
        var w = parseInt(dragoutline.attr('width'));

        var fullw = $(window).width(); // HACK!
        var zf = fullw / w;

        if(w > 20) {
            timeline.zoom(zf, x + w / 2);
            $('#zoom-reset').fadeIn();
        }
        dragStartX = -1;
        dragoutline.transition().duration(200).attr('opacity', 0);
    }

    function buildClusters() {
        var clusterMap = {};
        var nonClusterEvents = [];
        var pushToClustermap = function (name, event) { // utility fn, used in next loop
            if (clusterMap[name] != null) {
                clusterMap[name].push(event);
            } else {
                clusterMap[name] = [event];
            }
        };

        var getClusterKeys = clusteringFnMap[currentClustering];

        events.forEach(function (e) {
            e.parentClusters = [];
            var cn = getClusterKeys(e);
            if (Object.prototype.toString.call(cn) === '[object Array]') {
                if (cn.length == 0) {
                    nonClusterEvents.push(e);
                }
                cn.forEach(function (c) {
                    pushToClustermap(c, e);
                });
            } else {
                console.log('unknown threads returned for data item ' + cn, e);
            }
        });

        for (var clusterName in clusterMap) {
            if (!clusterMap.hasOwnProperty(clusterName)) {
                continue;
            }
            var ec = new EventCluster(clusterName, clusterMap[clusterName]);
            eventClusters.push(ec);
            clusterMap[clusterName].forEach(function (e) {
                e.parentClusters.push(ec);
            });
        }

        nonClusterEvents.forEach(function (e) {
            var ec = new EventCluster('', [e]);
            eventClusters.push(ec);
            e.parentClusters.push(ec);
        });

        eventClusters.sort(function (ec1, ec2) {
            return ec1.startDate.getTime() - ec2.startDate.getTime();
        });
    }

    var timeline = {

        events: function (items, getClusterKeys) {

            events = items;

            events.forEach(function (e) {
                eventTypes.push(e.eventType);
                organizations.push.apply(organizations, e.causedByOrganizations);
                persons.push.apply(persons, e.peopleInvolved);
                e.setClickHandler(onEventClicked);
            });

            eventTypes = d3.set(eventTypes).values();
            organizations = d3.set(organizations).values();
            persons = d3.set(persons).values();



            buildClusters(getClusterKeys);

            var eventTypeDescMap = {
                'diplomacy': 'Diplomacy',
                'revolution': 'Revolution',
                'political development': 'Political Development',
                'migration': 'Migration',
                'antisemetism':'Antisemetism',
                'org founded': 'Organization founded',
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

            minDate = d3.min(events, function (e) {
                return e.startDate;
            });
            maxDate = d3.max(events, function (e) {
                return e.isExtendedEvent() ? e.endDate : e.startDate;
            });

            return timeline;
        },

        redraw: function() {
            eventClusters.forEach(function(ec) { ec.remove(); })
            events.forEach(function(e) { e.erase(); })
            eventClusters = [];

            buildClusters();

            svg.select('g.axis').remove();
            dragoutline.remove();
            dragoutline = null;
            timeline.draw();
        },

        draw: function () {
            var size = calculateChartSize();

            var scaleX = size.scale;
            var width = size.width;
            calculateXCoords(scaleX);
            var maxDepth = calcYCoordsAndDepthsAndGetMaxDepth();

            var height = (maxDepth+3) * UNIT_HEIGHT;
            $(selector).css('height', height);

            if(tooltip==null) {
                tooltip = createTooltip();
            }

            if(svg == null) {
                var dragbehaviour = d3.behavior.drag()
                    .on("drag", onDrag)
                    .on("dragend", onDragEnd);

                svg = d3.select(selector).append("svg");
                svg.call(tooltip);
                svg.call(dragbehaviour);
            }
            svg.attr("width", width).attr("height", height);

            drawAxisAndGridLines(scaleX, height, width);

            eventClusters.forEach(function(ec) { ec.draw(svg, tooltip, UNIT_HEIGHT); });
            events.forEach(function(e) {
                e.drawEventOutline(svg, UNIT_HEIGHT);
                e.drawEventArrows(svg, UNIT_HEIGHT);
                e.parentClusters.forEach(function(ec) {
                    e.draw(svg, ec, UNIT_HEIGHT, tooltip);
                })
            });


            dragoutline = svg.append('rect')
                .attr('x', 0).attr('y', 1)
                .attr('height', height - 2).attr('width', 0)
                .attr('class', 'drag-outline')
                .attr('opacity', 0);


            return timeline;
        },

        onEventClick: function(handler) {
            eventClickHanders.push(handler);

            return timeline;
        },

        zoom: function(zf, newCenter) {
            var $container = $(selector);
            var newNewCenter = 0;
            if(zf===null) {
                zoomFactor = 1;
                newNewCenter = $container.scrollLeft() + ($container.width()/2);
                $('#zoom-reset').fadeOut();
            } else {
                var oldZoom = zoomFactor;
                zoomFactor = zoomFactor * zf;
                if(zoomFactor > 20) zoomFactor = 20;
                newNewCenter = newCenter * (zoomFactor/oldZoom)
            }

            var size = calculateChartSize();
            calculateXCoords(size.scale);

            svg.attr('width', size.width);

            eventClusters.forEach(function(ec) { ec.redraw(); });
            events.forEach(function(e) { e.redraw(svg, UNIT_HEIGHT, tooltip); });


            var s = $container.scrollLeft();
            var w = $container.width() - parseInt($container.css('padding-left').replace('px', ''));
            var s2 = (newNewCenter - w/2);

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
        },

        onSearch: function(cb) {
            onSearchCb = cb;
            return timeline;
        }
    };

    return timeline;
}
