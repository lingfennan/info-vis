function EventDisplay(e, handler) {
    this.event = e;

    var $t = $('#event-details-template').clone().attr('id', 'event-detail-'+ e.eventId);
    $t.find('.event-title').text(e.title);
    $t.find('.event-duration').text(e.getDurationString());
    $t.find('.event-narrative').text(e.narrative);
    $t.find('.close-button').click(function() { handler(e); });
    var $refs = $t.find('.event-references').empty();
    e.references.forEach(function (ref) {
        if (isUrl(ref)) { $refs.append("<li><a target='_blank' href='" + ref + "'>" + ref + "</a></li>"); }
        else { $refs.append("<li>" + ref + "</li>"); }
    });

    $t.hide().appendTo($('#event-details')).fadeIn();
    var $mb = $('#mainbar');
    $mb.animate({ scrollTop: $mb.prop('scrollHeight') });

    this.$el = $t;

    $t.hover(function() {
        e.onEventMouseover(e);
    }, function () {
        e.onEventMouseout(e);
    });
}

EventDisplay.prototype.remove = function() {
    var $el = this.$el;
    $el.slideUp('fast', function() { $el.remove(); });
}

EventDisplay.prototype.highlight = function(terms) {
    terms.match(/\S+/g).forEach(function(t) {
        this.$el.find('.event-title').highlight(t);
        this.$el.find('.event-narrative').highlight(t);
    }, this);
}
EventDisplay.prototype.clearHighlight = function() {
    this.$el.find('.event-title').removeHighlight();
    this.$el.find('.event-narrative').removeHighlight();
}

function isUrl(s) {
    return s.indexOf("http://") == 0 || s.indexOf("https://")==0;
}