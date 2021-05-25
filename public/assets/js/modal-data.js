(function($) {
    'use strict';
    //For demo purpose adding positions to modal for preview

    $(document).on("click","[data-modal-position]",function (e) {
        e.preventDefault();
        //removing previously added classes
        $("#positionModal").removeAttr("class");
        // adding back modal class and the selected position
        $("#positionModal").addClass( "modal fade " + $(this).attr('data-modal-position'));
        //making the modal visible
        $("#positionModal").modal("show");

    })
})(window.jQuery);
