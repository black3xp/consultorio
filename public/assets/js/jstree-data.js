(function ($) {
    'use strict';
    $('#jstree').jstree({
        "core" : {
            // so that create works
            "check_callback" : true
        },
        "plugins" : [ "dnd"]
    });
    $("#jstree-02").jstree({
        "core" : {
            // so that create works
            "check_callback" : true
        },
        "checkbox" : {
            "keep_selected_style" : false
        },
        "plugins" : [ "checkbox" ,"dnd"]
    });
    $("#jstree-03").jstree({
        "core" : {
            // so that create works
            "check_callback" : true
        },

        "plugins" : [ "contextmenu" ]
    });
    $("#jstree-04").jstree({
        "core" : {
            // so that create works
            "check_callback" : true
        },
        "plugins" : [ "dnd"]
    });
})(window.jQuery);