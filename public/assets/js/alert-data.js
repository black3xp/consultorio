(function ($) {
    'use strict';
   $(document).on("click","#generateAlert",function (e) {
       $('.admin-content').alertNotify({
           message: $("#option-message").val(),
           type:  $("#option-type").val(),
           dismiss:  ($("#option-dismiss").prop("checked") )? true : false
       });
   })

})(window.jQuery);