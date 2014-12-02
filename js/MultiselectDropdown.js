function MultiselectDropdown(sel, values, titlemap, selectCb, allValsString) {
    if(titlemap===undefined || titlemap===null) {
        titlemap = function(v) { return v; }
    }

    var $container = $(sel);
    var $sel = $container.closest('.dropdown').find('.selected-vals');
    var $all = $container.find('input.all-vals').prop('disabled', true);

    values.forEach(function(v) {
        var $li = $('<li><label><input type="checkbox" value="'+v+'"/><span>'+titlemap(v)+'</span></label></li>');
        $container.append($li);
    });

    $container.find('label').click(function(e) {
        e.stopPropagation();
    });

    $container.find('input').click(function(e) {
        e.stopPropagation();

        var $me = $(this).closest('li').find('input');

        if($me.hasClass('all-vals')) {
            if ($me.is(":checked")) {
                selectAll();
            }
        } else {
            handleOptionClick();
        }
    });

    function selectAll() {
        $container.find('input:not(.all-vals)').prop('checked', false);
        $all.prop('disabled', true).prop('checked', true);
        selectCb('all');
        $sel.text(allValsString);
        $sel.closest('p').removeClass('hilite');
    }

    function handleOptionClick() {
        if($container.find('input:checked:not(.all-vals)').length == 0) {
            selectAll();
        } else {
            var valuesSelected = [];
            var valsString = [];
            $container.find('input:checked:not(.all-vals)').each(function(i, cb) {
                var val = $(cb).attr('value');
                valuesSelected.push(val);
                valsString.push(titlemap(val))
            });
            $all.prop('disabled', false).prop('checked', false);
            selectCb(valuesSelected);

            valsString = valsString.join(', ');
            $sel.text(valsString);
            $sel.closest('p').addClass('hilite');
        }
    }
}
