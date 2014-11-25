function timeline(selector) {

    var svg = null,
        tooltip = null;

    events = [],
        eventClusters = [],
        minDate = null,
        maxDate = null;

    var UNIT_HEIGHT = 10;
    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;
    var clusterY = function(ec) { return ec.depth * UNIT_HEIGHT + (4*UNIT_HEIGHT); }
    var pointEventY = function(e, ec) { return clusterY(ec) + (e.getDepth(ec.title)+1) * UNIT_HEIGHT; }
    var extendedEventY = function(e, ec) { return pointEventY(e,ec) - UNIT_HEIGHT/2; }

    return timeline = {

        events: function (items, getClusterKeys) {

            events = items;

            console.log(d3.set(items.map(function(e) { return e.eventType; })).values())

            var clusterMap = {};
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
                    cn.forEach(function (c) {
                        pushToClustermap(c, e);
                    });
                } else if (typeof cn === 'string') {
                    pushToClustermap(cn, e);
                } else {
                    console.log('unknown threads returned for data item ' + cn, e);
                }
            });

            for (var clusterName in clusterMap) {
                if (!clusterMap.hasOwnProperty(clusterName)) {
                    continue;
                }
                var ec = new EventCluster(clusterName, clusterMap[clusterName])
                eventClusters.push(ec);
                clusterMap[clusterName].forEach(function(e) {
                    e.parentClusters.push(ec);
                });
            }

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

            eventClusters.forEach(function (ec) {
                ec.startx = scaleX(ec.startDate) - 2*POINT_RADIUS;
                ec.endx = scaleX(ec.endDate) + 2*POINT_RADIUS;
            });
            events.forEach(function (e) {
                e.startx = scaleX(e.startDate);
                e.endx = scaleX(e.endDate);
            });

            // calculate y overlaps and "overlap depth"

            eventClusters.sort(function(ec1, ec2) { return ec1.startDate.getTime() - ec2.startDate.getTime(); });
            var depthEnds = [];
            eventClusters.forEach(function (ec) {
                var d = 0;
                for (d = 0; d < depthEnds.length; d++) {
                    var fullSpaceAvail = true;
                    for(var i=0; i<=ec.thickness; i++) {
                        if (ec.startx-10 <= depthEnds[d+i]) { fullSpaceAvail = false; break; }
                    }
                    if(fullSpaceAvail) { break; }
                }
                ec.depth = d;
                for(var i=0; i<=ec.thickness; i++) {
                    depthEnds[d+i] = ec.endx;
                }
            });
            var height = (depthEnds.length+3) * UNIT_HEIGHT;


            svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height);

            tooltip = d3.select(selector)
                .append("div")
                .attr("class", "tooltip")
                .style("visibility", "hidden");

            eventClusters.forEach(drawCluster);
            events
                .filter(function(e) { return !e.isExtendedEvent() && e.parentClusters.length > 1; })
                .forEach(drawPointEventConnector);

            events
                .filter(function(e) { return !e.isExtendedEvent() && e.parentClusters.length > 1; })
                .forEach(drawExtendedEventConnector);

            return timeline;
        }
    };

    function drawCluster(ec) {
        ec.g = svg.append('g').classed('cluster-g', true);

        var rect = ec.g.append('rect')
            .attr('x', ec.startx)
            .attr('y', clusterY(ec))
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('width',ec.endx - ec.startx)
            .attr('height', (ec.thickness-1) * UNIT_HEIGHT)
            .attr('class', 'cluster-rect');

        var title = ec.g.append('text')
            .attr('class', 'cluster-title')
            .text(ec.title)
            .attr('x', ec.startx)
            .attr('y', clusterY(ec)-5);

        ec.g.selectAll('.event').data(ec.extendedEvents).enter().append('rect')
            .attr('class', 'extended-event')
            .attr('x', function(e) { return e.startx; })
            .attr('y', function(e) { return extendedEventY(e,ec); })
            .attr('rx', POINT_RADIUS)
            .attr('ry', POINT_RADIUS)
            .attr('width', function(e) { return e.endx - e.startx; })
            .attr('height', 2*POINT_RADIUS);

        ec.g.selectAll('.event').data(ec.pointEvents).enter().append('circle')
            .attr('class', 'point-event')
            .attr('cx', function(e) { return e.startx; })
            .attr('cy', function(e) { return pointEventY(e, ec); })
            .attr('r', POINT_RADIUS)

        ec.g.on('mouseenter', function() {
            ec.g.classed('hovered', true);
            title.transition().duration(200).style('opacity', 1);
        })

        ec.g.on('mouseleave', function() {
            ec.g.classed('hovered', false);
            title.transition().duration(200).style('opacity', 0);
        })
    }

    function arc(cx, cy, r, deg1, deg2) {
        var x1 = cx - r * Math.sin(deg1 * Math.PI/180);
        var y1 = cy - r * Math.cos(deg1 * Math.PI/180);
        var x2 = cx - r * Math.sin(deg2 * Math.PI/180);
        var y2 = cy - r * Math.cos(deg2 * Math.PI/180);

        var largeArc = (Math.abs(deg1-deg2) > 180) ? 1 : 0;
        return "M "+x1+' '+y1+' A '+r+' '+r+' 0 '+largeArc+' 0 '+x2+' '+y2;
    }

    function lines(cx, cy1, cy2, r, deg) {
        var x1 = cx - r * Math.sin(deg * Math.PI/180);
        var x2 = cx + r * Math.sin(deg * Math.PI/180);
        var y1 = cy1 + r * Math.cos(deg * Math.PI/180);
        var y2 = cy2 - r * Math.cos(deg * Math.PI/180);

        return 'M '+x1+' '+y1+' L '+x1+' '+y2+' M '+x2+' '+y1+' L '+x2+' '+y2;
    }

    function drawPointEventConnector(e) {
        var sortedParents = e.parentClusters.sort(function(ec1, ec2) { return ec1.depth - ec2.depth; });
        var numParents = sortedParents.length;

        var R = POINT_RADIUS+4;
        var gapwidth = 20;

        e.connG = svg.append('g');

        var path = arc(e.startx, pointEventY(e, sortedParents[0]), R, -180+gapwidth, 180-gapwidth)
        + ' ' + lines(e.startx, pointEventY(e, sortedParents[0]), pointEventY(e, sortedParents[1]), R, gapwidth) + ' ';

        for(var i=1; i<numParents-1; i++) {
            var pointY = pointEventY(e,sortedParents[i]);
            path += arc(e.startx, pointY, POINT_RADIUS + 2, gapwidth, 180-gapwidth) + ' ' +
                arc(e.startx, pointY, R, 180-gapwidth, 360-gapwidth) + ' '+
                lines(e.startx, pointEventY(e, sortedParents[i]), pointEventY(e, sortedParents[i+1]), R, gapwidth) + ' ';
        }

        path += arc(e.startx, pointEventY(e,sortedParents[numParents-1]), R, gapwidth, 360-gapwidth);

        e.connG.append('path')
            .attr('class', 'multicluster-connector')
            .attr('d', path);
    }

    function drawExtendedEventConnector(e) {
        // todo
    }
}

//
//.on('mouseenter', function(e) {
//    tooltip.html('<h4>'+ e.title+'</h4><span>'+ e.startDate +'</span>')
//        // .style('visibility', 'visible')
//        .style('left', e.startx+'px')
//        .style('top', clusterY - 10+'px');
//})
//    .on('mouseleave', function() {
//        tooltip.style('visibility', 'hidden');
//    });