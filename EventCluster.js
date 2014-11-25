var EventCluster = function(title, events) {
    this.title = title;

    this.startDate = d3.min(events, function(e) { return e.startDate; });

    this.endDate = d3.max(events, function(e) { return e.isExtendedEvent() ? e.endDate : e.startDate; });

    this.pointEvents = [];
    this.extendedEvents = [];

    events.sort(function(e1, e2) { return e1.startDate.getTime() - e2.startDate.getTime(); });
    var depthEnds = [];
    events.forEach(function (e) {
        var d = 0;
        for (d = 0; d < depthEnds.length; d++) {
            if (e.startDate.getTime() > depthEnds[d]) { break; }
        }
        e.setDepth(d, title);
        depthEnds[d] = e.endDate.getTime()+2592000000;
    });

    events.forEach(function(e) {
        if(e.isExtendedEvent()) {
            this.extendedEvents.push(e);
        } else {
            this.pointEvents.push(e);
        }
    }, this)

    // view related info
    this.startx = 0;
    this.starty = 0;
    this.endx = 0;
    this.depth = 1;
    this.thickness = depthEnds.length+2;
}