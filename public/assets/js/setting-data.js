(function ($) {
    'use strict';
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