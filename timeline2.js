function timeline(selector) {

    var svg = null,
        tooltip = null;

    events = [],
        eventClusters = [],
        minDate = null,
        maxDate = null;

    var UNIT_HEIGHT = 10;
    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;

    return timeline = {

        events: function (items, getClusterKeys) {

            events = items;

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
                        if (ec.startx <= depthEnds[d+i]) { fullSpaceAvail = false; break; }
                    }
                    if(fullSpaceAvail) { break; }
                }
                ec.depth = d;
                for(var i=0; i<=ec.thickness; i++) {
                    depthEnds[d+i] = ec.endx;
                }
            });
            var height = (depthEnds.length + 2) * UNIT_HEIGHT;


            svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height);

            tooltip = d3.select(selector)
                .append("div")
                .attr("class", "tooltip")
                .style("visibility", "hidden");

            eventClusters.forEach(drawCluster);

            return timeline;
        }
    };

    function drawCluster(ec) {
        var myg = svg.append('g').classed('cluster-g', true);

        var clusterY = ec.depth * UNIT_HEIGHT + (2*UNIT_HEIGHT);

        var rect = myg.append('rect')
            .attr('x', ec.startx)
            .attr('y', clusterY)
            .attr('width',ec.endx - ec.startx)
            .attr('height', (ec.thickness-1) * UNIT_HEIGHT)
            .attr('class', 'cluster-rect');

        var title = myg.append('text')
            .attr('class', 'cluster-title')
            .text(ec.title + " ("+ec.thickness+")")
            .attr('x', ec.startx)
            .attr('y', clusterY);

        myg.selectAll('.event').data(ec.extendedEvents).enter().append('rect')
            .attr('class', 'extended-event')
            .attr('x', function(e) { return e.startx; })
            .attr('y', function(e) { return clusterY + ((e.getDepth(ec.title)+1) * UNIT_HEIGHT) - (UNIT_HEIGHT/2); })
            .attr('width', function(e) { return e.endx - e.startx; })
            .attr('height', 2*POINT_RADIUS);

        myg.selectAll('.event').data(ec.pointEvents).enter().append('circle')
            .attr('class', 'point-event')
            .attr('cx', function(e) { return e.startx; })
            .attr('cy', function(e) { return clusterY + (e.getDepth(ec.title)+1) * UNIT_HEIGHT; })
            .attr('r', POINT_RADIUS)

        myg.on('mouseenter', function() {
            myg.classed('hovered', true);
            title.classed('hovered', true);
        })

        myg.on('mouseleave', function() {
            myg.classed('hovered', false);
            title.classed('hovered', false);
        })
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