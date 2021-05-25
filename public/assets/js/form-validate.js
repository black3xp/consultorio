(function ($) {
    'use strict';
    //used in signup page
    // Bootstrap 4 used in-valid and valid as classes for error representation
    $(".needs-validation").validate({
        errorClass: "is-invalid",
        validClass: "is-valid",
        //put error message behind each form element
        errorPlacement: function (error, element) {
            //adding error label after select2 wrapper
            if(element.hasClass("select2") == true){
                error.insertAfter(element.next());
            }else{
                error.insertAfter(element)
            }

        },
    });
})(window.jQuery);