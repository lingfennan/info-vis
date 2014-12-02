var Event = function() {
    this.title = '';
	this.eventId = '';

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
    this.outline = null;
    this.arrows = [];
    this.domElements = {};

    this.clickHandler = function() {};
}

Event.prototype.getDurationString = function() {
    var format = d3.time.format("%e %b %Y");
    var datestring = format(this.startDate);
    if (this.isExtendedEvent()) {
        datestring += ' to ' + format(this.endDate);
    }
    return datestring;
};

Event.prototype.setTitle = function(t) {
    this.title = t;
}

Event.prototype.setEventId = function(id) {
	this.eventId = id;
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
        refs[i] = r.replace('çççç', ',').trim();
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

Event.prototype.setDomElement = function(el, ec) {
    this.domElements[ec.title] = el;
}

Event.prototype.getDomElement = function(ec) {
    if(this.domElements[ec.title] === undefined) {
        console.log("WARN no dom element found for event '"+this.title+"' in cluster '"+ec.title+"'");
        return 0;
    } else {
        return this.domElements[ec.title];
    }
}

Event.prototype.draw = function(svg, ec, UNIT_HEIGHT, tooltip) {
    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;

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

    if(this.isExtendedEvent()) {
        var el = ec.g.append('rect')
            .attr('class', 'extended-event ' + eventTypeClassMap[this.eventType])
            .attr('x', this.startx)
            .attr('y', this.getStartY(ec))
            .attr('rx', POINT_RADIUS)
            .attr('ry', POINT_RADIUS)
            .attr('width', this.endx - this.startx)
            .attr('height', 2 * POINT_RADIUS)
            .datum(this)
            .on('mouseover', onEventMouseover)
            .on('mouseout', onEventMouseout)
            .on('click', onEventClicked);

        this.setDomElement(el, ec);
    } else {
        var el = ec.g.append('circle')
            .attr('class', 'point-event '+eventTypeClassMap[this.eventType])
            .attr('cx', this.startx)
            .attr('cy', this.getStartY(ec))
            .attr('r', POINT_RADIUS)
            .datum(this)
            .on('mouseover', onEventMouseover)
            .on('mouseout', onEventMouseout)
            .on('click', onEventClicked);

        this.setDomElement(el, ec);
    }



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

        e.outline.transition().duration(200).style('opacity', 1);
        e.parentClusters.forEach(function(pc) {
            if(pc!=ec) {
                pc.titleElement.transition().duration(200).style('opacity', 1);
            }
        });
    }

    this.onEventMouseout = onEventMouseout; /// HACK!

    function onEventMouseout(e) {
        tooltip.hide();
        if(!e.clicked) {
            var op = (e.parentClusters.length < 2) ? 0 : 0.1;
            e.outline.transition().duration(200).style('opacity', op);
            e.parentClusters.forEach(function(pc) {
                if(pc!=ec) {
                    pc.titleElement.transition().duration(200).style('opacity', 0);
                }
            });
        }
    }

    function onEventClicked(e) {
        e.clickHandler(e);
    }

    this.drawEventOutline(svg, UNIT_HEIGHT);
}

Event.prototype.drawEventOutline = function(svg, UNIT_HEIGHT) {
    var path = '';

    var POINT_RADIUS = UNIT_HEIGHT/2 - 1;
    var GAP_ANGLE = 20;
    var CONNECTOR_RADIUS = POINT_RADIUS+6;


    if(this.parentClusters.length < 2) {
        path = getSingleEventConnectorPath(this);
    } else if(this.isExtendedEvent()) {
        path = getExtendedEventConnectorPath(this);
    } else {
        path = getPointEventConnectorPath(this);
    }

    var clazz = 'connector' + (this.parentClusters.length < 2 ? ' single-cluster' : '');
    this.outline = svg.append('path')
        .attr('class', clazz)
        .attr('d', path);


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

        return path;
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

    function hline(x1, x2, y) {
        return 'M '+x1+' '+y+' L '+x2+' '+y;
    }

}

Event.prototype.drawEventArrows = function(svg, UNIT_HEIGHT) {

    var POINT_RADIUS = UNIT_HEIGHT/2;

    this.causedByEvents.forEach(function (ce) {
        var path = getCausalityPath(ce, this);
        var marker = svg.append('defs').append('marker')
            .attr('id', 'id' + this.eventId)
            .attr('orient', 'auto')
            .attr('markerWidth', '4')
            .attr('markerHeight', '8')
            .attr('refX', POINT_RADIUS)
            .attr('refY', '4')
            .attr('class', 'causedBy');
        marker.append('path')
            .attr('d', 'M0,0 V8 L4,4 Z')
            .attr('class', 'causedByMarker')

        var arrow = svg.append('path')
            .attr('d', path)
            .attr('marker-end', 'url(#id' + this.eventId + ')')
            .attr('id', 'id' + this.eventId)
            .attr('class', 'causedBy')
            .style("visibility", "hidden");

        this.arrows.push(arrow);
    }, this);

    this.causesEvents.forEach(function (ce) {
        var path = getCausalityPath(this, ce);
        var marker = svg.append('defs').append('marker')
            .attr('id', 'id' + this.eventId)
            .attr('orient', 'auto')
            .attr('markerWidth', '4')
            .attr('markerHeight', '8')
            .attr('refX', POINT_RADIUS)
            .attr('refY', '4')
            .attr('class', 'causes');
        marker.append('path')
            .attr('d', 'M0,0 V8 L4,4 Z')
            .attr('class', 'causesMarker')

        var arrow = svg.append('path')
            .attr('d', path)
            .attr('marker-end', 'url(#id' + this.eventId + ')')
            .attr('id', 'id' + this.eventId)
            .attr('class', 'causes')
            .style("visibility", "hidden");

        this.arrows.push(arrow);
    }, this);


    function getCausalityPath(causer, causee) {
		if (causer.startx > causee.endx) {
			console.log("causer id:" + causer.eventId + ", title:" + causer.title + ", start date:" + causer.startDate +  ", causee id:" + causee.eventId + ", title:" + causee.title + ", end date:" + causee.endDate);
		}
        var endx = causee.startx;
        var endy = causee.isExtendedEvent() ? causee.getStartY(causee.parentClusters[0])+POINT_RADIUS : causee.getStartY(causee.parentClusters[0]);
        var startx = causer.isExtendedEvent() && causer.endx < endx ? causer.endx : causer.startx;
        var starty = causer.isExtendedEvent() ? causer.getStartY(causer.parentClusters[0])+POINT_RADIUS : causer.getStartY(causer.parentClusters[0]);
		var xdiff = Math.abs(endx - startx);
		var ydiff = Math.abs(endy - starty);
		var cubic = false;
		if (xdiff < 10 && xdiff + ydiff > 60) {
			var cx1 = startx - Math.max(60 - ydiff / 20, UNIT_HEIGHT * 2);
			var cx2 = endx - Math.max(60 - ydiff / 20, UNIT_HEIGHT * 2);
			var cy1 = starty;
			var cy2 = endy;
			cubic = true;
		} else if (ydiff < 10 && xdiff + ydiff > 60) {
			var cx1 = startx;
			var cx2 = endx;
			var cy1 = starty - Math.max(60 - xdiff / 20, UNIT_HEIGHT * 2);
			var cy2 = endy - Math.max(60 - xdiff / 20, UNIT_HEIGHT * 2);
			cubic = true;
		} else if (xdiff + ydiff < 60) {
			var cx1 = startx - Math.max(60 - ydiff / 20, UNIT_HEIGHT * 2);
			var cx2 = endx - Math.max(60 - ydiff / 20, UNIT_HEIGHT * 2) * (xdiff < ydiff ? 1 : -1);
			var cy1 = starty -  Math.max(60 - xdiff / 20, UNIT_HEIGHT * 2) * (starty < endy ? 1 : -1);
			var cy2 = endy - Math.max(60 - xdiff / 20, UNIT_HEIGHT * 2) * (starty < endy ? 1 : -1) * (xdiff < ydiff ? -1 : 1);
			cubic = true;
		}
		if (cubic) 
			return cCurveTo(startx, starty, endx, endy, cx1, cy1, cx2, cy2);
		else
			return qCurveTo(startx, starty, endx, endy, endx, starty);
    }

    function qCurveTo(x1, y1, x2, y2, cx, cy) {
        // x1, y1 is start
        // x2, y2 is destination
        // cx, cy is control point
        return 'M ' + x1 + ',' + y1 +' Q' + cx + ',' + cy + ' ' + x2 + ',' + y2;
    }

	function cCurveTo(x1, y1, x2, y2, cx1, cy1, cx2, cy2) {
		return 'M' + x1 + ' ' + y1 + ' C' + cx1 + ',' + cy1 + ' ' + cx2 + ',' + cy2 + ' ' + x2 + ',' + y2;
	}
}

Event.prototype.redraw = function(svg, UNIT_HEIGHT) {
    this.outline.remove();

    if(this.isExtendedEvent()) {
        this.parentClusters.forEach(function(ec) {
            this.getDomElement(ec).transition().duration(250).ease('linear')
                .attr('x', this.startx)
                .attr('width', this.endx - this.startx);
        }, this);
    } else {
        this.parentClusters.forEach(function(ec) {
            this.getDomElement(ec).transition().duration(250).ease('linear')
                .attr('cx', this.startx);
        }, this);
    }

    this.drawEventOutline(svg, UNIT_HEIGHT);
}

Event.prototype.setClickHandler = function(handler) {
    this.clickHandler = handler;
}

Event.prototype.isSelected = function() {
    return this.clicked;
}
Event.prototype.selectEvent = function() {
    if (!this.clicked) {
        this.showArrows();
    }
    this.clicked = true;
    this.outline.classed('clicked', true);
}
Event.prototype.toggleSelect = function() {
    if(this.clicked) {
        this.deselectEvent();
    } else {
        this.selectEvent();
    }
}
Event.prototype.deselectEvent = function() {
    if (this.clicked) {
        this.hideArrows();
    }
    this.clicked = false;
    this.outline.classed('clicked', false);
    this.onEventMouseout(this);
}
Event.prototype.showArrows = function() {
    this.arrows.forEach(function(a) {
        a.style("visibility", "visible");
    });
}
Event.prototype.hideArrows = function() {
    this.arrows.forEach(function(a) {
        a.style("visibility", "hidden");
    });
}
