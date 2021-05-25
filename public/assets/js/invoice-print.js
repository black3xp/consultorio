(function ($) {
    'use strict';
    $(document).on("click", "#printDiv", function (e) {
        var printContents = document.querySelector("#printableArea").innerHTML;
        var originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;

        window.print();

        document.body.innerHTML = originalContents;
    });
})(window.jQuery);