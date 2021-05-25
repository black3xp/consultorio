(function ($) {
    'use strict';
// override these in your code to change the default behavior and style
$.blockUI.defaults = {
    // message displayed when blocking (use null for no message)
    message:  '<div class="spinner-border text-dark  spinner-border-sm" role="status">\n' +
    '  <span class="sr-only">Loading...</span>  \n' +
    '</div>' +
    '<span class="ml-2">Loading..</span>',

    title: null,        // title string; only used when theme == true
    draggable: true,    // only used when theme == true (requires jquery-ui.js to be loaded)

    theme: false, // set to true to use with jQuery UI themes

    // styles for the message when blocking; if you wish to disable
    // these and use an external stylesheet then do this in your code:
    // $.blockUI.defaults.css = {};
    css: {
        padding:        "15px",
        margin:         0,
        width:          'auto',
        top:            '50%',
        left:           '50%',
        textAlign:      'center',
        color:          'inherit',
        border:         '1px solid #aaa',
        backgroundColor:'#fff',
        cursor:         'wait',
        borderRadius:   '0.25rem',
    },

    // minimal style set used when themes are used
    themedCSS: {
        width:  '30%',
        top:    '40%',
        left:   '35%'
    },

    // styles for the overlay
    overlayCSS:  {
        backgroundColor: 'rgba(67, 90, 111, 0.5);',
        opacity:         1,
        cursor:          'default'
    },

    // style to replace wait cursor before unblocking to correct issue
    // of lingering wait cursor
    cursorReset: 'default',

    // styles applied when using $.growlUI
    growlCSS: {
        width:    '350px',
        top:      '10px',
        left:     '',
        right:    '10px',
        border:   'none',
        padding:  '5px',
        opacity:   0.6,
        cursor:    null,
        color:    '#fff',
        backgroundColor: '#000',
        '-webkit-border-radius': '10px',
        '-moz-border-radius':    '10px'
    },

    // IE issues: 'about:blank' fails on HTTPS and javascript:false is s-l-o-w
    // (hat tip to Jorge H. N. de Vasconcelos)
    iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank',

    // force usage of iframe in non-IE browsers (handy for blocking applets)
    forceIframe: false,

    // z-index for the blocking overlay
    baseZ: 1000,

    // set these to true to have the message automatically centered
    centerX: true, // <-- only effects element blocking (page block controlled via css above)
    centerY: true,

    // allow body element to be stetched in ie6; this makes blocking look better
    // on "short" pages.  disable if you wish to prevent changes to the body height
    allowBodyStretch: true,

    // enable if you want key and mouse events to be disabled for content that is blocked
    bindEvents: true,

    // be default blockUI will supress tab navigation from leaving blocking content
    // (if bindEvents is true)
    constrainTabKey: true,

    // fadeIn time in millis; set to 0 to disable fadeIn on block
    fadeIn:  200,

    // fadeOut time in millis; set to 0 to disable fadeOut on unblock
    fadeOut:  400,

    // time in millis to wait before auto-unblocking; set to 0 to disable auto-unblock
    timeout: 0,

    // disable if you don't want to show the overlay
    showOverlay: true,

    // if true, focus will be placed in the first available input field when
    // page blocking
    focusInput: true,

    // suppresses the use of overlay styles on FF/Linux (due to performance issues with opacity)
    // no longer needed in 2012
    // applyPlatformOpacityRules: true,

    // callback method invoked when fadeIn has completed and blocking message is visible
    onBlock: null,

    // callback method invoked when unblocking has completed; the callback is
    // passed the element that has been unblocked (which is the window object for page
    // blocks) and the options that were passed to the unblock call:
    //   onUnblock(element, options)
    onUnblock: null,

    // don't ask; if you really must know: http://groups.google.com/group/jquery-en/browse_thread/thread/36640a8730503595/2f6a79a77a78e493#2f6a79a77a78e493
    quirksmodeOffsetHack: 4,

    // class name of the message block
    blockMsgClass: 'blockMsg shadow-lg',

    // if it is already blocked, then ignore it (don't unblock and reblock)
    ignoreIfBlocked: false
};

$(document).on("click", "#trigger-content-01" , function (e) {
        $("#content-demo").block({
            timeout:   2000,
        });
});
$(document).on("click", "#trigger-content-02" , function (e) {
    $("#content-demo").block({
        timeout:   2000,
        message:'<div class="spinner-grow spinner-grow-sm" role="status">\n' +
        '  <span class="sr-only">Loading...</span>\n' +
        '</div> <span class="ml-2">Please wait processing</span>'
    });
});
$(document).on("click", "#trigger-content-03" , function (e) {
    $("#content-demo").block({
        timeout:   2000,
        message:'<span class=" h6"><span class="mdi  mdi-message"></span> <span class="ml-2"> Loading with icon</span></span>'
    });
});

$(document).on("click", "#trigger-content-04" , function (e) {
    $("body").block({
        timeout:   2000,
    });
});
$(document).on("click", "#trigger-content-05" , function (e) {
    $(".admin-content").block({
        timeout:   2000,
        message:'<div class="spinner-grow " role="status">\n' +
        '  <span class="sr-only">Loading...</span>\n' +
        '</div> <span class="ml-2">Please wait processing</span>'
    });
});

$(document).on("click", "#trigger-content-06" , function (e) {
    $(".admin-sidebar").block({
        timeout:   2000,
        message:'<div class="spinner-border-sm spinner-border text-dark " role="status">\n' +
        '  <span class="sr-only">Loading...</span>\n' +
        '</div> <div class="text-muted">Loading</div>'
    });
});

$(document).on("click", "#trigger-content-07" , function (e) {
    $("#modal-loading").block({
        timeout:   2000,
    });
});
$(document).on("click", "#trigger-content-08" , function (e) {
    $("#example-card").block({
        timeout:   2000,
    });
});

})(window.jQuery);