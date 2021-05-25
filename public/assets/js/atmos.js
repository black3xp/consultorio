(function($) {
    'use strict';

    /**
     * @property colors
     * @description SET colors for charts includes system colors and pastel colors for charts
     * @returns {array} - array of colors/colours
     */
    var body = $("body") , windowWidth = window.innerWidth;
    window.colors = [
        "#687ae8",
        "#12bfbb",
        "#ffb058",
        "#2991cf",
        "#87b8d4",
        "#109693",
        "#f29494",
        "#527cf9",
        "#7140d1",
        "#e79e4e",
        "#52b4ee",
        "#6ed7e0",
        "#8fa6b4",
        "#ffcfcf",
        "#28304e",
        "#95aac9",
        "#f2545b",
        "#f7bc06",
        "#00cc99",
        "#19b5fe",
        "#E3EBF6"
    ];

    /**
     * @description Initialize Bootstrap tooltip
     * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires bootstrap.js, Popper.js
     */
    $('[data-toggle="tooltip"]').tooltip();

    /**
     * @description sidebar operations like sliding sidebar,toggle and responsive options
     * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires jQuery
     */

    // sidebar mouse events
    $(document).on("mouseenter", "body:not(.sidebar-pinned) .admin-sidebar", function (e) {
        if (windowWidth >= 1200) {
            $(this).addClass("sidebar-show");
        }
    });
    $(document).on("mouseleave", "body:not(.sidebar-pinned) .admin-sidebar", function (e) {
        if (windowWidth >= 1200) {
            $(this).removeClass("sidebar-show");
        }
    });

    //sidebar pin - toggle sidebar pin
    $(document).on("click", ".admin-pin-sidebar", function (e) {
        e.preventDefault();
        body.toggleClass("sidebar-pinned");
        $(this).toggleClass("pinned");
        // trigger resize event for charts to redraw if required
        window.dispatchEvent(new Event('resize'));
    });

    // append backdrop for mobile
    body.append('<div class="sidebar-backdrop "></div>');

    // close event on mobile by clicking close button or backdrop
    $(document).on("click", " .admin-close-sidebar ,.sidebar-backdrop", function (e) {
        e.preventDefault();
        body.removeClass("sidebar-open");

    });


    /**
     * @description Sidebar Multilevel Menu
     * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires jQuery
     */
    $(document).on("click", ".open-dropdown", function (e) {
        e.preventDefault();
        if (!$(this).next().is(":visible")) {
            //opens the adjacent list to the target
            $(this).next().slideDown();
            $(this).parent().addClass("opened");
        }
        else {
            //closes the adjacent list to the target
            $(this).next().slideUp();
            $(this).parent().removeClass("opened");
        }
    });
    /**
     * @description card Options for fullscreen , close and refresh
     * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires jQuery
     */
    $(document).on("click", ".js-card-fullscreen", function (e) {
        e.preventDefault();
        $(this).closest('.card').toggleClass('is-fullscreen');
    });
    $(document).on("click", ".js-card-close", function (e) {
        e.preventDefault();
        $(this).closest('.card').remove();
    });
    $(document).on("click", ".js-card-refresh", function (e) {
        e.preventDefault();
        $(this).closest('.card').append("<div class='loading-container'></div> ");
        //write your code here

        //once done remove the loading
    });
    /**
     * @description Override Default Behaviour for scroll
     * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires jquery.bootstrap
     */
    $('.modal').on('show.bs.modal', function (e) {
        if($(e.currentTarget).attr("data-popup")){
            body.addClass("body-scrollable");
        }
    });
    $('.modal').on('hidden.bs.modal', function (e) {
        body.removeClass("body-scrollable");
    });
    /**
     * @description Initialize custom scrollbar
     * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires jquery.scrollbar plugin
     */
    $(".js-scrollbar, .card-scroll").scrollbar();

    /**
     * @description Initialize bootstrap datepicker
     * @param {(Element|jQuery)} [context] - A DOM Element, input tag  to use as context.
     * @requires bootstrap datepicker plugin by uxsolutions
     */
    $(".js-datepicker").datepicker();

    /**
     * @description Initialize daterangepicker
     * @param {(Element|jQuery)} [context] - A DOM Element, input tag  to use as context.
     * @requires daterangepicker plugin by dangrossman
     */
    $('.input-daterange').daterangepicker();

    /**
     * @description Initialize select2
     * @param {(Element|jQuery)} [context] - A DOM Element, input tag  to use as context.
     * @requires select2 plugin
     */
    $(".js-select2").select2();


    /**
     * @description floating label transformations - making the label visible when input is provided
     * @param {(Element|jQuery)} [context] - A Form input or select to use as context.
     * @requires jQuery
     */
    $(document).on('input', '.floating-label input', function (e) {
        var  item =$(this).parents('.floating-label');
        $(this).val() ? item.addClass('show-label') : item.removeClass('show-label');
    });

    $(document).on('blur', '.floating-label input', function (e) {
        var  item =$(this).parents('.floating-label');
        $(this).val() ? item.addClass('show-label') : item.removeClass('show-label');
    });

    //checking for pre-filled forms
    $(".floating-label input").each(function () {
        var  item =$(this).parents('.floating-label');
        $(this).val() ? item.addClass('show-label') : item.removeClass('show-label');
    });

    /**
     * @description toggles the target class with class given in toggleclass attr
     * * @param {(Element|jQuery)} [context] - A DOM Element, Document, or jQuery to use as context.
     * @requires jQuery
     */
    $(document).on("click", "[data-toggleclass]", function (e) {
        e.preventDefault();
        $($(this).attr("data-target")).toggleClass($(this).attr("data-toggleClass"));
    });

    /**
     * @description Initialize listjs - searchable list
     * @param (DOM Element), values as DOM Selector.
     * @requires listjs plugin
     */
    //creates searchable list for site search modal
    new List('site-search', {
        valueNames: [
            'name',
        ]
    });
    //creates searchable list for contacts page
    new List('contact-search', {
        valueNames: [
            'searchBy-name',
        ]
    });


    /* ============================================================
     *  DEMO CONTENT BELOW
     *  @description Demo Content Can be Removed if not required
     * ============================================================ */

    //For creating greetings on page
    var today = new Date();
    var curHr = today.getHours();
    var greeting_container = $(".js-greeting");
    if (curHr < 12) {
        greeting_container.text('Good Morning');
    } else if (curHr < 18) {
        greeting_container.text('Good Afternoon');
    } else {
        greeting_container.text('Good Evening');
    }

    //create a trigger for removing the loading after 500 ms
    $(document).on("click", ".js-card-refresh", function (e) {
        hideLoading();
    });
    /**
     * @function hideLoading
     * @description hideLoading for cards after timeout
     */
    function hideLoading() {
        var containers = $(".loading-container");
        setTimeout(function () {
            containers.parents('.card').removeClass("is-loading");
            containers.fadeOut(500, function () {
                containers.remove();

            });
        }, 1000)
    }


})(window.jQuery);

/**
 * @plugin alertNotify
 * @param {string | html} message - message text or html
 * @param {string} alert_type - primary,danger,info,warning,default,light,dark
 * @param {boolean} dismiss - close button
 * @description to pin  alert on top of page
 */
(function ( $ ) {

    $.fn.alertNotify = function( options ) {

        // Default options
        var settings = $.extend({
            message: 'Alert Message',
            type: 'primary',
            dismiss: true
        }, options );
        var dismissBtn =   '<button type="button" class="close" data-dismiss="alert" aria-label="Close"> ' +
            '<span aria-hidden="true">&times;</span> </button> ';
        // Apply options
        if(this.find(".alert-container").length === 0){
            this.append("<div class='alert-container'></div>");
        }
        if(!settings.dismiss){
            dismissBtn = '';
        }
        this.find(".alert-container").append('<div class="alert alert-'+settings.type+' alert-dismissible fade show" role="alert">' +
            settings.message + dismissBtn +
            '</div>' );

    };

}( jQuery ));

