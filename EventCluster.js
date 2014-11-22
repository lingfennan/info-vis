var EventCluster = function(title, events) {
    this.title = title;

    this.startDate = d3.min(events, function(e) { return e.startDate; });

    this.endDate = d3.max(events, function(e) { return e.isExtendedEvent() ? e.endDate : e.startDate; });

    this.events = events;

    // view related info
    this.startx = 0;
    this.endx = 0;
    this.depth = 1;
}