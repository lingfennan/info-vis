var EventCluster = function(title, events) {
    this.title = title;

    this.startDate = d3.min(events, function(e) { return e.startDate; });

    this.endDate = d3.max(events, function(e) { return e.isExtendedEvent() ? e.endDate : e.startDate; });

    this.pointEvents = [];
    this.extendedEvents = [];
    this.events = events;

    this.events.sort(function(e1, e2) { return e1.startDate.getTime() - e2.startDate.getTime(); });
    var depthEnds = [];
    this.events.forEach(function (e) {
        var d = 0;
        for (d = 0; d < depthEnds.length; d++) {
            if (e.startDate.getTime() > depthEnds[d]) { break; }
        }
        e.setDepth(d, this);
        depthEnds[d] = e.endDate.getTime()+2592000000;
    }, this);

    // view related info
    this.startx = 0;
    this.starty = 0;
    this.endx = 0;
    this.depth = 1;
    this.thickness = depthEnds.length+2;

    this.g = null;
    this.titleElement = null;
}

EventCluster.prototype.draw = function(svg, tooltip, UNIT_HEIGHT) {
    this.g = svg.append('g').classed('cluster-g', true);

    var me = this;
    if (this.title != '') {
        this.rect = this.g.append('rect')
            .attr('x', this.startx)
            .attr('y', this.starty)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('width', this.endx - this.startx)
            .attr('height', (this.thickness - 1) * UNIT_HEIGHT)
            .attr('class', 'cluster-rect');

        this.titleElement = this.g.append('text')
            .attr('class', 'cluster-title')
            .text(this.title)
            .attr('x', this.startx)
            .attr('y', this.starty - 5);
    }

    this.g.on('mouseenter', function() {
        if(me.title != '') {
            var scrollPos = $('#timeline').scrollLeft(); // HACK!
            if(me.startx-26 < scrollPos) { // HACK! where do "26" and "30" come from?
                me.titleElement.transition().duration(200).style('opacity', 1).attr('x', scrollPos+50);
            } else {
                me.titleElement.transition().duration(200).style('opacity', 1).attr('x', me.startx);
            }
        }
    })
    .on('mouseleave', function() {
        if(me.title != '') { me.titleElement.transition().duration(200).style('opacity', 0); }
    });
}

EventCluster.prototype.redraw = function() {
    if(this.title != '' ) {
        this.rect.transition().duration(250).attr('x', this.startx).attr('width', this.endx - this.startx);
        this.titleElement.transition().duration(250).attr('x', this.startx);
    }
}
