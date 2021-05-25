(function ($) {
    'use strict';
    $.each(colors, function (i, d) {
        $("#chart-color").append('<div class="col col-md-4 col-lg-2 m-b-30">' +
            ' <div class="card"> <div class="color-preview p-t-80 p-b-80 text-center rounded-top" style="background-color: ' + d + '">' +
            ' <div class="color-description badge bg-white-translucent text-white small text-uppercase ">#' + i + '</div> </div>' +
            ' <div class="card-body">' +
            ' <div class="font-secondary color-text text-center"> ' + d + ' </div>' +
            ' </div> </div> </div>')
    });
    var gray = ["100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
    ];
    $.each(gray, function (i, d) {
        $("#gray-color").append('<div class="col col-md-4 col-lg-2 m-b-30">' +
            ' <div class="card"> <div class="color-preview p-t-80 p-b-80 text-center rounded-top bg-gray-' + d + ' ">' +
            ' <div class="color-description badge bg-white-translucent text-white small text-uppercase ">gray-' + d + '</div> </div>' +
            ' <div class="card-body">' +
            ' <div class="font-secondary color-text text-center"> ' + d + ' </div>' +
            ' </div> </div> </div>')
    });

    var site_colors = ["primary", "secondary", "danger", "warning", "info", "success"]
    $.each(site_colors, function (i, d) {
        $("#site-color").append('<div class="col col-md-4 col-lg-2 m-b-30">' +
            ' <div class="card"> <div class="color-preview p-t-80 p-b-80 text-center rounded-top bg-' + d + ' ">' +
            ' <div class="color-description badge bg-white-translucent text-white small text-uppercase ">' + d + '</div> </div>' +
            ' <div class="card-body">' +
            ' <div class="font-secondary color-text text-center"> ' + d + ' </div>' +
            ' </div> </div> </div>')
    });
    $(".color-text ").each(function () {
        $(this).text(rgb2hex($(this).parents(".card").find(".color-preview").css("backgroundColor")));
    });

    function rgb2hex(rgb) {
        if (rgb.search("rgb") == -1) {
            return rgb;
        } else {
            rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);

            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }

            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }
    }

})(window.jQuery);