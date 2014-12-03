function SearchBar(searchCb, clearCb) {

    var $searchbar = $('#search-bar input');
    var $clearsearchbutton = $('#search-bar span.clear-button');

    $searchbar.change(function() {
        var val = $searchbar.val();

        if(val!='') {
            $clearsearchbutton.fadeIn('fast');
            $searchbar.addClass('hilite');
            searchCb(val);

        } else {
            $clearsearchbutton.fadeOut('fast');
            $searchbar.removeClass('hilite');
            $searchbar.val('');
            clearCb();
        }
    });

    $clearsearchbutton.click(function() {
        $clearsearchbutton.fadeOut('fast');
        $searchbar.removeClass('hilite');
        $searchbar.val('');
        clearCb();
    })
}