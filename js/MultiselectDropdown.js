function MultiselectDropdown(sel, values, titlemap) {
    if(titlemap===undefined) {
        titlemap = function(v) { return v; }
    }

    var $container = $(sel);
    var $all = $container.find('input.all-vals').prop('disabled', true);

    values.forEach(function(v) {
        var $li = $('<li><label><input type="checkbox" value="'+v+'"/><span>'+titlemap(v)+'</span></label></li>');
        $container.append($li);
    });

    $container.find('input, label').click(function(e) {
        console.log('hi');
        e.stopPropagation();

        var $me = $(this).closest('li').find('input');

        if($me.hasClass('all-vals')) {
            if ($me.is(":checked")) {
                selectAll();
            } else {
                // should not happen - this button is disabled when all are selectede
            }
        } else {
            handleOptionClick($me);
        }
    });

    function selectAll() {
        $container.find('input:not(.all-vals)').prop('checked', false);
        $all.prop('disabled', true).prop('checked', true);;
        // todo affect the timeline
    }

    function handleOptionClick($me) {
        if ($me.is(":checked")) {
            $all.prop('disabled', false).prop('checked', false);
            var valueSelected = $me.val();
            console.log(valueSelected);
            // todo affect timeline
        } else {
            var valueSelected = $me.val();
            console.log(valueSelected);
            // todo affect timeline

            if($container.find('input:checked:not(.all-vals)').length == 0) {
                console.log('none selected, so select all');
                selectAll();
            }
        }

    }
}
