(function ($) {
    'use strict';
    //Timepicker
    $('.timepicker').timepicker({
        showInputs: false
    });


    $('.input-daterange-timepicker').daterangepicker({
        timePicker:true,
        singleDatePicker: true,
        locale: { format: 'MM/DD/YYYY hh:mm A' }
    });
    //datedropper
    $('.datedropper').dateDropper();

    //jQueryUI Slider
    $(".input-slider").slider({
        range: "min",
    });
    $(".input-rangeslider").slider({
        range: true,
        min: 0,
        max: 500,
        values: [75, 300],
    });

    function readFile(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $(input).parents('.avatar-input').find('.avatar-img').attr('src', e.target.result);
            };

            reader.readAsDataURL(input.files[0]);
        }
    }
    $('.avatar-file-picker').on('change', function () {
         readFile(this);
    });

})(window.jQuery);