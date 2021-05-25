(function ($) {
    'use strict';
    $(document).on("click", ".js-compose-toggle", function (e) {
        e.preventDefault();
        $("body").addClass("show-compose-window");
    });
    $(document).on("click", ".js-compose-close", function (e) {
        e.preventDefault();
        $("body").removeClass("show-compose-window");
    });


    $(document).on("click", ".mail-item td:not(.mailbox-name) , .mail-item .mailbox-sender", function (e) {
        e.preventDefault();
        window.location = $(this).parents('.mail-item').attr("data-href");
    });


    $(document).on("click", ".js-mail-bulk-action", function (e) {
        var items = $(".js-mail-bulk-check");
        if ($(this).prop("checked")) {
            items.prop("checked", true);
        }
        else {
            items.prop("checked", false);

        }
        items.trigger("change");
    });
    $(document).on("change", ".js-mail-bulk-check", function (e) {
        var ele = $(this).parents('.mail-item');
        if ($(this).prop("checked")) {
            ele.addClass("active");
        }
        else {
            ele.removeClass("active");
        }
    });
    if ($.trumbowyg) {
        $.trumbowyg.svgPath = 'assets/vendor/trumbowyg/ui/icons.svg';


        $("#trumbowyg-compose").trumbowyg({
            btns: [
                ['strong', 'em', 'del'],
                ['link'],
                ['unorderedList', 'orderedList'],
                ['fullscreen']
            ]
        });
        $("#trumbowyg-reply").trumbowyg({
            btns: [
                ['formatting'],
                ['strong', 'em', 'del'],
                ['superscript', 'subscript'],
                ['link'],
                ['insertImage'],
                ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                ['unorderedList', 'orderedList'],
                ['horizontalRule'],
                ['removeformat'],
            ]
        });
        $(".trumbowyg-box").css("marginTop", "0px")

    }


})(window.jQuery);