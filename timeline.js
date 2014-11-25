function timeline(selector) {

    var svg = null,
        tooltip = null;

    var events = [],
        eventClusters = [],
        minDate = null,
        maxDate = null;

    var UNIT_HEIGHT = 10;
    var TIME_AXIS_HEIGHT = 25;
    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;
    var GAP_ANGLE = 20;
    var CONNECTOR_RADIUS = POINT_RADIUS+6;

    var eventTypeClassMap = {
        'diplomacy': 'diplomacy',
        'revolution': 'revolution',
        'political development': 'political',
        'migration': 'migration',
        'antisemetism':'antisemetism',
        'org founded': 'org-founded',
        'war': 'war',
        'civil unrest': 'civil-unrest',
        'peace process': 'peace-process',
        'uncategorized': 'uncategorized',
        'armstice': 'armstice'
    };

    function createTooltip() {
        var format = d3.time.format("%e %b %Y");
        return d3.tip()
            .attr('class', 'd3-tip')
            .html(function (e) {
                var datestring = format(e.startDate);
                if (e.isExtendedEvent()) {
                    datestring += ' - ' + format(e.endDate);
                }
                return e.title + '<br><span class="dates">' + datestring + '</span>';
            });
    }

    function calcCoordsAndDepthsAndGetMaxDepth(scaleX) {
        var clusterY = function(ec) { return ec.depth * UNIT_HEIGHT + (4*UNIT_HEIGHT); };

        eventClusters.forEach(function (ec) {
            ec.startx = scaleX(ec.startDate) - 2 * POINT_RADIUS;
            ec.starty = clusterY(ec);
            ec.endx = scaleX(ec.endDate) + 2 * POINT_RADIUS;
        });
        events.forEach(function (e) {
            e.startx = scaleX(e.startDate);
            e.endx = scaleX(e.endDate);
        });

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

    function drawGridLines(scaleX, height) {
        var intervals = scaleX.ticks(d3.time.years, 5);
        var gridlines = svg.append('g').attr('class', 'gridlines');
        gridlines.selectAll('.gridline').data(intervals).enter().append('line')
            .attr('class', 'gridline')
            .attr('x1', function (i) {
                return scaleX(i);
            })
            .attr('y1', 0)
            .attr('x2', function (i) {
                return scaleX(i);
            })
            .attr('y2', height - TIME_AXIS_HEIGHT);
    }

    function drawCluster(ec) {
        ec.g = svg.append('g').classed('cluster-g', true);

        if (ec.title != '') {

            var rect = ec.g.append('rect')
                .attr('x', ec.startx)
                .attr('y', ec.starty)
                .attr('rx', 5)
                .attr('ry', 5)
                .attr('width', ec.endx - ec.startx)
                .attr('height', (ec.thickness - 1) * UNIT_HEIGHT)
                .attr('class', 'cluster-rect');

            ec.titleElement = ec.g.append('text')
                .attr('class', 'cluster-title')
                .text(ec.title)
                .attr('x', ec.startx)
                .attr('y', ec.starty - 5);
        }


        ec.g.on('mouseenter', function() {
            ec.g.classed('hovered', true);
            if(ec.title != '') { ec.titleElement.transition().duration(200).style('opacity', 1); }
        })
        .on('mouseleave', function() {
            ec.g.classed('hovered', false);
            if(ec.title != '') { ec.titleElement.transition().duration(200).style('opacity', 0); }
        });

        ec.g.selectAll('.event').data(ec.extendedEvents).enter().append('rect')
            .attr('class', function(e) { return 'extended-event '+eventTypeClassMap[e.eventType]; })
            .attr('x', function(e) { return e.startx; })
            .attr('y', function(e) { return e.getStartY(ec); })
            .attr('rx', POINT_RADIUS)
            .attr('ry', POINT_RADIUS)
            .attr('width', function(e) { return e.endx - e.startx; })
            .attr('height', 2*POINT_RADIUS)
            .on('mouseover', onEventMouseover)
            .on('mouseout', onEventMouseout)
            .on('click', onEventClicked);

        ec.g.selectAll('.event').data(ec.pointEvents).enter().append('circle')
            .attr('class', function(e) { return 'point-event '+eventTypeClassMap[e.eventType]; })
            .attr('cx', function(e) { return e.startx; })
            .attr('cy', function(e) { return e.getStartY(ec); })
            .attr('r', POINT_RADIUS)
            .on('mouseover', onEventMouseover)
            .on('mouseout', onEventMouseout)
            .on('click', onEventClicked);

        function onEventMouseover(e) {
            var dir = '';
            var offset = [0, 0];
            var sortedParents = e.parentClusters.sort(function(ec1, ec2) { return ec1.depth - ec2.depth; });
            if(sortedParents[sortedParents.length-1] == ec) {
                dir = 's'; offset = [10, 0];
            } else if(sortedParents[0] == ec) {
                dir = 'n'; offset = [-10, 0];
            } else {
                dir = 'e'; offset = [0, 10];
            }
            tooltip.offset(offset).show(e, dir);

            e.connector.transition().duration(200).style('opacity', 1);
            e.parentClusters.forEach(function(pc) {
                if(pc!=ec) {
                    pc.titleElement.transition().duration(200).style('opacity', 1);
                }
            });
        }

        function onEventMouseout(e) {
            tooltip.hide();
            if(!e.clicked) {
                var op = (e.parentClusters.length < 2) ? 0 : 0.1;
                e.connector.transition().duration(200).style('opacity', op);
                e.parentClusters.forEach(function(pc) {
                    if(pc!=ec) {
                        pc.titleElement.transition().duration(200).style('opacity', 0);
                    }
                });
            }
        }

        function onEventClicked(e) {
            e.clicked = !e.clicked;
            e.connector.classed('clicked', e.clicked);
        }
    }

    function drawEventConnector(e) {
        var path = '';

        if(e.parentClusters.length < 2) {
            path = getSingleEventConnectorPath(e);
        } else if(e.isExtendedEvent()) {
            path = getExtendedEventConnectorPath(e);
        } else {
            path = getPointEventConnectorPath(e);
        }

        var clazz = 'connector' + (e.parentClusters.length < 2 ? ' single-cluster' : '');
        e.connector = svg.append('path')
            .attr('class', clazz)
            .attr('d', path);
    }

    function getSingleEventConnectorPath(e) {
        if(e.isExtendedEvent()) {
            var eventY = e.getStartY(e.parentClusters[0]);

            return arc(e.startx+POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 0, 180) + ' '+
                hline(e.startx+POINT_RADIUS, e.endx - POINT_RADIUS, eventY+POINT_RADIUS-CONNECTOR_RADIUS) + ' ' +
                arc(e.endx-POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 180, 360) + ' '+
                hline(e.startx+POINT_RADIUS, e.endx - POINT_RADIUS, eventY+POINT_RADIUS+CONNECTOR_RADIUS);
        } else {
            return arc(e.startx, e.getStartY(e.parentClusters[0]), CONNECTOR_RADIUS, 0,180)+ ' ' +
                arc(e.startx, e.getStartY(e.parentClusters[0]), CONNECTOR_RADIUS, 180, 360);
        }
    }

    function getPointEventConnectorPath(e) {

        var sortedParents = e.parentClusters.sort(function(ec1, ec2) { return ec1.depth - ec2.depth; });
        var numParents = sortedParents.length;

        var path = arc(e.startx, e.getStartY(sortedParents[0]), CONNECTOR_RADIUS, -180+GAP_ANGLE, 180-GAP_ANGLE)
            + ' ' + connectorVlines(e.startx, e.getStartY(sortedParents[0]), e.getStartY(sortedParents[1]), CONNECTOR_RADIUS, GAP_ANGLE) + ' ';

        for(var i=1; i<numParents-1; i++) {
            var pointY = e.getStartY(sortedParents[i]);
            path += arc(e.startx, pointY, CONNECTOR_RADIUS, GAP_ANGLE, 180-GAP_ANGLE) + ' ' +
                arc(e.startx, pointY, CONNECTOR_RADIUS, 180+GAP_ANGLE, 360-GAP_ANGLE) + ' '+
                connectorVlines(e.startx, e.getStartY(sortedParents[i]), e.getStartY(sortedParents[i+1]), CONNECTOR_RADIUS, GAP_ANGLE) + ' ';
        }

        path += arc(e.startx, e.getStartY(sortedParents[numParents-1]), CONNECTOR_RADIUS, GAP_ANGLE, 360-GAP_ANGLE);

        return path;
    }

    function getExtendedEventConnectorPath(e) {
        var sortedParents = e.parentClusters.sort(function(ec1, ec2) { return ec1.depth - ec2.depth; });
        var numParents = sortedParents.length;

        var W = 2 * CONNECTOR_RADIUS * Math.sin(GAP_ANGLE * Math.PI/180);

        var eventY = e.getStartY(sortedParents[0]);
        var path =
            arc(e.startx+POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 0, 180) + ' '+
            hline(e.startx+POINT_RADIUS, (e.startx+e.endx-W)/2, eventY+POINT_RADIUS+CONNECTOR_RADIUS) + ' ' +
            hline((e.startx+e.endx+W)/2, e.endx - POINT_RADIUS, eventY+POINT_RADIUS+CONNECTOR_RADIUS) + ' ' +
            arc(e.endx-POINT_RADIUS, e.getStartY(sortedParents[0])+POINT_RADIUS, CONNECTOR_RADIUS, 180, 360) + ' '+
            hline(e.startx+POINT_RADIUS, e.endx - POINT_RADIUS, eventY+POINT_RADIUS-CONNECTOR_RADIUS) + ' ';

        path += connectorVlines((e.startx+ e.endx)/2, eventY+POINT_RADIUS, e.getStartY(sortedParents[1])+POINT_RADIUS, CONNECTOR_RADIUS, GAP_ANGLE) + ' ';

        for(var i=1; i<numParents-1; i++) {
            eventY = e.getStartY(sortedParents[i]);
            path +=
                arc(e.startx+POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 0, 180) + ' '+
                hline(e.startx+POINT_RADIUS, (e.startx+e.endx-W)/2, eventY+POINT_RADIUS+CONNECTOR_RADIUS) + ' ' +
                hline((e.startx+e.endx-W)/2, e.endx - POINT_RADIUS, eventY+POINT_RADIUS+CONNECTOR_RADIUS) + ' ' +
                arc(e.endx-POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 180, 360) + ' '+
                hline(e.startx+POINT_RADIUS, (e.startx+e.endx-W)/2, eventY+POINT_RADIUS-CONNECTOR_RADIUS) + ' ' +
                hline((e.startx+e.endx-W)/2, e.endx - POINT_RADIUS, eventY+POINT_RADIUS-CONNECTOR_RADIUS) + ' ';

            path += connectorVlines((e.startx+ e.endx)/2, eventY+POINT_RADIUS, e.getStartY(sortedParents[i+1])+POINT_RADIUS, CONNECTOR_RADIUS, GAP_ANGLE) + ' ';
        }

        eventY = e.getStartY(sortedParents[numParents-1]);
        path +=
            arc(e.startx+POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 0, 180) + ' '+
            hline(e.startx+POINT_RADIUS, e.endx-POINT_RADIUS, eventY+POINT_RADIUS+CONNECTOR_RADIUS) + ' ' +
            arc(e.endx-POINT_RADIUS, eventY+POINT_RADIUS, CONNECTOR_RADIUS, 180, 360) + ' '+
            hline(e.startx+POINT_RADIUS, (e.startx+e.endx-W)/2, eventY+POINT_RADIUS-CONNECTOR_RADIUS) + ' ' +
            hline((e.startx+e.endx+W)/2, e.endx - POINT_RADIUS, eventY+POINT_RADIUS-CONNECTOR_RADIUS);

        return path;;
    }

    function arc(cx, cy, r, deg1, deg2) {
        var x1 = cx - r * Math.sin(deg1 * Math.PI/180);
        var y1 = cy - r * Math.cos(deg1 * Math.PI/180);
        var x2 = cx - r * Math.sin(deg2 * Math.PI/180);
        var y2 = cy - r * Math.cos(deg2 * Math.PI/180);

        var largeArc = (Math.abs(deg1-deg2) > 180) ? 1 : 0;
        return "M "+x1+' '+y1+' A '+r+' '+r+' 0 '+largeArc+' 0 '+x2+' '+y2;
    }

    function connectorVlines(cx, cy1, cy2, r, deg) {
        var x1 = cx - r * Math.sin(deg * Math.PI/180);
        var x2 = cx + r * Math.sin(deg * Math.PI/180);
        var y1 = cy1 + r * Math.cos(deg * Math.PI/180);
        var y2 = cy2 - r * Math.cos(deg * Math.PI/180);

        return 'M '+x1+' '+y1+' L '+x1+' '+y2+' M '+x2+' '+y1+' L '+x2+' '+y2;
    }

    function drawTimeAxis(scaleX, height) {
        var xticks = function (gap) {
            return d3.svg.axis().scale(scaleX).orient("bottom").ticks(d3.time.years, gap);
        };
        var xAxis = xticks(5);
        svg.append("g").attr("class", "xaxis")
            .attr("transform", "translate(0," + (height - TIME_AXIS_HEIGHT) + ")")
            .call(xAxis);
    }

    function hline(x1, x2, y) {
        return 'M '+x1+' '+y+' L '+x2+' '+y;
    }

    return timeline = {

        events: function (items, getClusterKeys) {

            events = items;

            console.log(d3.set(items.map(function(e) { return e.eventType; })).values());

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
            var width = (maxDate.getFullYear() - minDate.getFullYear() + 2) * 60; // 1 year = 30 px
            var yearMillis = 365 * 24 * 60 * 60 * 1000;
            var scaleX = d3.time.scale()
                .domain([new Date(minDate.getTime() - yearMillis), new Date(maxDate.getTime() + 10*yearMillis)])
                .range([0,width]);

            var maxDepth = calcCoordsAndDepthsAndGetMaxDepth(scaleX);

            var height = (maxDepth+3) * UNIT_HEIGHT + TIME_AXIS_HEIGHT;

            svg = d3.select(selector).append("svg").attr("width", width).attr("height", height);
            tooltip = createTooltip();
            svg.call(tooltip);

            drawGridLines(scaleX, height);
            eventClusters.forEach(drawCluster);
            events.forEach(drawEventConnector);
            drawTimeAxis(scaleX, height);

            return timeline;
        }
    };
}
