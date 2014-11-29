var Event = function() {
    this.title = '';

    this.startDate = new Date();
    this.endDate = new Date();
    this.extendedEvent = false;

    this.eventChains = [];
    this.causedByEvents = [];
	this.causesEvents = [];
    this.causedByOrganizations = [];
    this.peopleInvolved = [];
    this.narrative = '';
    this.eventType = '';
    this.references = '';

    this.parentClusters = [];

    // view related info
    this.startx = 0;
    this.endx = 0;
    this.startys = {};
    this.depths = {};
    this.clicked = false;
    this.connector = null;
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

Event.prototype.addCausesEvents = function(es) {
	this.causesEvents[this.causesEvents.length] = es;
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

Event.prototype.setDepth = function(d, ec) {
    this.depths[ec.title] = d;
}

Event.prototype.getDepth = function(ec) {
    if(this.depths[ec.title] === undefined) {
        console.log("WARN no depth found for event '"+this.title+"' in cluster '"+ec.title+"'");
        return 0;
    } else {
        return this.depths[ec.title];
    }
}

Event.prototype.setStartY = function(y, ec) {
    this.startys[ec.title] = y;
}

Event.prototype.getStartY = function(ec) {
    if(this.startys[ec.title] === undefined) {
        console.log("WARN no start found for event '"+this.title+"' in cluster '"+ec.title+"'");
        return 0;
    } else {
        return this.startys[ec.title];
    }
}
