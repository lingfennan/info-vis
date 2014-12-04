function SingleselectDropdown(sel, grp, values, titlemap, selectCb) {
    if(titlemap===undefined || titlemap===null) {
        titlemap = function(v) { return v; }
    }

    var $container = $(sel);
    var $sel = $container.closest('.dropdown').find('.selected-vals');

    values.forEach(function(v) {
        var $li = $('<li><label><input name="'+grp+'" type="radio" value="'+v+'"/><span>'+titlemap[v]+'</span></label></li>');
        $container.append($li);
    });
    $container.find('input:first').prop('checked', true);

    $container.find('input').click(function(e) {
        var $me = $(this).closest('li').find('input');

        if($container.find('input:checked').length !=1) return;

        var valsString = $container.find('input:checked').attr('value');
        $sel.text(titlemap[valsString]);
        selectCb(valsString);
    });

    this.$container = $container;
    this.$sel = $sel;
}
SingleselectDropdown.prototype.disable = function() {
    this.$sel.closest('.dropdown-toggle').addClass('disabled');
    this.$container.addClass('disabled');
}
SingleselectDropdown.prototype.enable = function() {
    this.$sel.closest('.dropdown-toggle').removeClass('disabled');
    this.$container.removeClass('disabled');
}
