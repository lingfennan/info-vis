function timeline(selector) {

    var svg = null,
        tooltip = null;

    var events = [],
        eventClusters = [],
        minDate = null,
        maxDate = null;

    var Y = function(d) { return d*60 + 20; }

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

            // find x scale, calculate x coordinates
            var width = (maxDate.getFullYear() - minDate.getFullYear() + 2) * 30;
            var yearMillis = 365 * 24 * 60 * 60 * 1000;
            var scale = d3.time.scale()
                .domain([new Date(minDate.getTime() - yearMillis), new Date(maxDate.getTime() + yearMillis)])
                .range([0,width]);

            eventClusters.forEach(function (ec) {
                ec.startx = scale(ec.startDate)-10;
                ec.endx = scale(ec.endDate)+10;
            });
            events.forEach(function (e) {
                e.startx = scale(e.startDate);
                e.endx = scale(e.endDate);
            });

            // calculate y overlaps and "overlap depth"

            eventClusters.forEach(function(ec) { console.log(ec.title, ec.startDate); });

            var depthEnds = [];
            eventClusters.forEach(function (ec) {
                var d = 0;
                for (d = 0; d < depthEnds.length; d++) {
                    if (ec.startx > depthEnds[d]) { break; }
                }
                ec.depth = d;
                depthEnds[d] = ec.endx;
            });
            var height = Y(depthEnds.length)+40;


            svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height);

            tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("visibility", "hidden");

            eventClusters.forEach(drawCluster);

            return timeline;
        }
    }

    function drawCluster(ec) {
        var myg = svg.append('g').classed('cluster-g', true);

        var clusterY = Y(ec.depth);

        var rect = myg.append('rect')
            .attr('x', ec.startx-10)
            .attr('y', clusterY)
            .attr('width',ec.endx - ec.startx+20)
            .attr('height', 30)
            .attr('class', 'cluster-rect');

        var title = myg.append('text')
            .attr('class', 'cluster-title')
            .text(ec.title)
            .attr('x', ec.startx-10)
            .attr('y', clusterY-2);

        myg.selectAll('.event').data(ec.pointEvents).enter().append('circle')
            .attr('class', 'point-event')
            .attr('cx', function(e) { return e.startx; })
            .attr('cy', clusterY+15)
            .attr('r', 5)
            .on('mouseenter', function(e) {
                tooltip.html('<h4>'+ e.title+'</h4><span>'+ e.startDate +'</span>')
                    .style('visibility', 'visible')
                    .style('left', e.startx+'px')
                    .style('top', clusterY - 10+'px');
            })
            .on('mouseleave', function() {
                tooltip.style('visibility', 'hidden');
            });

        myg.on('mouseenter', function() {
            rect.classed('hovered', true);
            title.classed('hovered', true);
        })

        myg.on('mouseleave', function() {
            rect.classed('hovered', false);
            title.classed('hovered', false);
        })
    }
}
