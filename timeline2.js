function timeline(selector) {

    var svg = null,
        tooltip = null;

    var events = [],
        eventClusters = [],
        minDate = null,
        maxDate = null;

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
                ec.startx = scale(ec.startDate);
                ec.endx = scale(ec.endDate);
            });
            events.forEach(function (e) {
                e.startx = scale(e.startDate);
                e.endx = scale(e.endDate);
            });

            // calculate y overlaps and "overlap depth"
            eventClusters.sort(function(ec) { return ec.startDate; });

            var depthEnds = [];
            eventClusters.forEach(function (ec) {
                var d = 0;
                for (d = 0; d < depthEnds.length; d++) {
                    if (ec.startx > depthEnds[d]) { break; }
                }
                ec.depth = d;
                depthEnds[d] = ec.endx;
            });
            var height = 30 * depthEnds.length;

            console.log(selector);
            var svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height);

            var tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("visibility", "visible");

            svg.selectAll('.rect').data(eventClusters).enter().append('rect')
                .attr('x', function(ec) { return ec.startx; })
                .attr('y', function(ec) { return ec.depth*50 + 20; })
                .attr('width', function(ec) { return ec.endx - ec.startx; })
                .attr('height', 40)
                .attr('class', 'cluster');

            return timeline;
        }
    }
}
