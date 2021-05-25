(function ($) {
    'use strict';
    $(document).on("click", "#custom-notification", function (e) {
        e.preventDefault();
        $.notify({
            // options
            icon: 'mdi mdi-alert',
            title: 'Be Alert',
            message: 'Some description about the notification. keep the tone of message concise so user can' +
            'have clear idea about the event causing the notification. '
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },
            showProgressbar: true,
            timer: 500,
            // settings
            type: 'danger',
            template: '<div data-notify="container" class=" bootstrap-notify alert " role="alert">' +
            '<div class="progress" data-notify="progressbar">' +
            '<div class="progress-bar bg-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<div class="media "> <div class="avatar m-r-10 avatar-sm"> <div class="avatar-title bg-{0} rounded-circle"><span data-notify="icon"></span></div> </div>' +
            '<div class="media-body"><div class="font-secondary" data-notify="title">{1}</div> ' +
            '<span class="opacity-75" data-notify="message">{2}</span></div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            ' <button type="button" aria-hidden="true" class="close" data-notify="dismiss"><span>x</span></button></div></div>'

        });
    });
    $(document).on("click", "#notification-02", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Be Alert,',
            message: 'Alert Message'
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },

            timer: 500,
            // settings
            type: 'danger',

        });
    });
    $(document).on("click", "#notification-01", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Be Alert,',
            message: 'Alert Message'
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },

            timer: 500,
            // settings
            type: 'success',

        });
    });
    $(document).on("click", "#notification-03", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Be Alert,',
            message: 'Alert Message'
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },

            timer: 500,
            // settings
            type: 'info',

        });
    });
    $(document).on("click", "#notification-04", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Be Alert,',
            message: 'Alert Message'
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },

            timer: 500,
            // settings
            type: 'warning',

        });
    });
    $(document).on("click", "#custom-notification-01", function (e) {
        e.preventDefault();
        $.notify({
            // options
            icon: 'mdi mdi-alert',
            title: 'Be Alert',
            message: 'Some description about the notification. keep the tone of message concise so user can' +
            'have clear idea about the event causing the notification. '
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },
            showProgressbar: true,
            timer: 500,
            // settings
            type: 'danger',
            template: '<div data-notify="container" class=" bootstrap-notify alert " role="alert">' +
            '<div class="progress" data-notify="progressbar">' +
            '<div class="progress-bar bg-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<div class="media "> <div class="avatar m-r-10 avatar-sm"> <div class="avatar-title bg-{0} rounded-circle"><span data-notify="icon"></span></div> </div>' +
            '<div class="media-body"><div class="font-secondary" data-notify="title">{1}</div> ' +
            '<span class="opacity-75" data-notify="message">{2}</span></div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            ' <button type="button" aria-hidden="true" class="close" data-notify="dismiss"><span>x</span></button></div></div>'

        });
    });
    $(document).on("click", "#custom-notification-02", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Joan Reynolds ',
            message: 'Some description about the notification. keep the tone of message concise so user can' +
            'have clear idea about the event causing the notification. '
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },
            showProgressbar: true,
            timer: 500,
            // settings
            type: 'primary',
            template: '<div data-notify="container" class=" bootstrap-notify alert " role="alert">' +
            '<div class="progress" data-notify="progressbar">' +
            '<div class="progress-bar bg-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<div class="media "> <div class="avatar m-r-10 avatar-sm"> <img src="assets/img/users/user-3.jpg" class="avatar-img bg-{0} rounded-circle"> </div> ' +
            '<div class="media-body"><div class="font-secondary" data-notify="title"> {1}</div> ' +
            '<span class="opacity-75" data-notify="message">{2}</span></div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            ' <button type="button" aria-hidden="true" class="close" data-notify="dismiss"><span>x</span></button></div></div>'

        });
    });
    $(document).on("click", "#custom-notification-03", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Joan Reynolds ',
            message: 'Some description about the notification. keep the tone of message concise so user can' +
            'have clear idea about the event causing the notification. '
        }, {
            placement: {
                align: "right",
                from: "bottom"
            },
            showProgressbar: true,
            timer: 500,
            // settings
            type: 'warning',
            template: '<div data-notify="container" class=" bootstrap-notify alert bg-dark text-white" role="alert">' +
            '<div class="progress" data-notify="progressbar">' +
            '<div class="progress-bar bg-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<div class="media "> <div class="avatar m-r-10 avatar-sm"> <img src="assets/img/users/user-3.jpg" class="avatar-img bg-{0} rounded-circle"> </div> ' +
            '<div class="media-body"><div class="font-secondary" data-notify="title"> {1}</div> ' +
            '<span class="opacity-75" data-notify="message">{2}</span></div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            ' <button type="button" aria-hidden="true" class="close" data-notify="dismiss"><span>x</span></button></div></div>'

        });
    });
    $(document).on("click", "#custom-notification-04", function (e) {
        e.preventDefault();
        $.notify({
            // options
            title: 'Hey this is a toast! Cheers ',

        }, {
            placement: {
                align: "right",
                from: "bottom"
            },
            showProgressbar: true,
            timer: 1000,
            // settings
            type: 'warning',
            template: '<div data-notify="container" class="toast alert " role="alert">' +
            '<button type="button" aria-hidden="true" class="close light" data-notify="dismiss"><span>x</span></button>' +
            '<span data-notify="icon"></span> ' +
            '<div   data-notify="title">{1}</div> ' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            '</div>'
        });
    });
//customizer
    $("#custom-options-btn").click(function () {
        var e = {
            message: "You just created a notification.",
            title: "New Notification",
        };
        $("#custom-options-title").prop("checked"),
        "" != $("#custom-options-icon").val() && (e.icon = "icon " + $("#custom-options-icon").val()),
        $("#custom-options-url").prop("checked") && (e.url = "http://google.com",
            e.target = "_blank");
        var t = $.notify(e, {
            type: $("#custom-options-state").val(),
            allow_dismiss: $("#custom-options-dismiss").prop("checked"),
            newest_on_top: $("#custom-options-top").prop("checked"),
            mouse_over: $("#custom-options-pause").prop("checked"),
            showProgressbar: $("#custom-options-progress").prop("checked"),
            spacing: $("#custom-options-spacing").val(),
            timer: $("#custom-options-timer").val(),
            placement: {
                from: $("#custom-options-placement_from").val(),
                align: $("#custom-options-placement_align").val()
            },
            offset: {
                x: $("#custom-options-offset_x").val(),
                y: $("#custom-options-offset_y").val()
            },
            delay: $("#custom-options-delay").val(),
            z_index: $("#custom-options-zindex").val(),
            template: '<div data-notify="container" class=" bootstrap-notify alert " role="alert">' +
            '<div class="progress" data-notify="progressbar">' +
            '<div class="progress-bar bg-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<div class="media "> <div class="avatar m-r-10 avatar-sm"> <div class="avatar-title bg-{0} rounded-circle"><span data-notify="icon"></span></div> </div>' +
            '<div class="media-body"><div class="font-secondary" data-notify="title">{1}</div> ' +
            '<span class="opacity-75" data-notify="message">{2}</span></div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            ' <button type="button" aria-hidden="true" class="close" data-notify="dismiss"><span>x</span></button></div></div>'
        });

    });
})(window.jQuery);
