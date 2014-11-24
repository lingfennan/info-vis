var Event = function() {
    this.title = '';

    this.startDate = new Date();
    this.endDate = new Date();
    this.extendedEvent = false;

    this.eventChains = [];
    this.causedByEvents = [];
    this.causedByOrganizations = [];
    this.peopleInvolved = [];
    this.narrative = '';
    this.eventType = '';
    this.references = '';

    this.parentClusters = [];

    this.startx = 0;
    this.endx = 0;
    this.depths = {};
}

Event.prototype.setTitle = function(t) {
    this.title = t;
}

Event.prototype.setStartDate = function(dateString) {
    var date = parseDate(dateString);
    if (date !== null) {
        this.startDate = date;
        if(!this.extendedEvent) { this.endDate = date; }
    } else {
        console.log("error parsing start date '"+dateString+"'");
    }
}

Event.prototype.setEndDate = function(dateString) {
    var date = parseDate(dateString);
    if (date !== null) {
        this.endDate = date;
        this.extendedEvent = true;
    } else {
        console.log("error parsing end date ", dateString);
    }
}

function parseDate(dateString) {
    if(isNaN(dateString)) {
        return d3.time.format("%d-%b-%Y").parse(dateString.trim());
    } else {
        var year = parseInt(dateString);
        if(year < 1800 || year > 3000) return null;
        return new Date(year, 1, 1, 0, 0, 0, 0);
    }
}

Event.prototype.setEventType = function(et) {
    this.eventType = et;
}

Event.prototype.setOrganizations = function(orgs) {
    this.causedByOrganizations = orgs;
}

Event.prototype.setNarrative = function(text) {
    this.narrative = text;
}

Event.prototype.setLocation = function(l) {
    this.location = l;
}

Event.prototype.setPeople = function(p) {
    this.peopleInvolved = p.split(',');
}

Event.prototype.setNarrative = function(text) {
    this.narrative = text;
}

Event.prototype.setCausedByEvents = function(es) {
    this.causedByEvents = es;
}

Event.prototype.setChains = function (chains) {
    var spl = chains.split(',');
    spl.forEach(function(c, i) {
        if(c.trim() != '') {
            this.eventChains.push(c.trim());
        }
    }, this);
}

Event.prototype.isExtendedEvent = function() {
    return this.extendedEvent;
}

Event.prototype.setReferences = function(refs) {
    if(refs === undefined) {
        this.references = [];
        return;
    }
    refs = refs.replace('\\,', 'çççç').split(',');
    refs.forEach(function (r, i) {
        refs[i] = r.replace('çççç', ',');
    })
    this.references = refs;
}

Event.prototype.setDepth = function(d, clusterTitle) {
    this.depths[clusterTitle] = d;
}

Event.prototype.getDepth = function(clusterTitle) {
    if(this.depths[clusterTitle] === undefined) {
        console.log("WARN no depth found for event '"+this.title+"' in cluster '"+clusterTitle+"'");
        return 0;
    } else {
        return this.depths[clusterTitle];
    }
}
