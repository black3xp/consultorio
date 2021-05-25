(function ($) {
    'use strict';
    $(document).on("click", ".kanban-item", function (e) {
        var kanbantitle =$(this).find(".kanban-item-title").text();
        $(".js-copy-title").val(kanbantitle)
        $(".js-modal-title").text(kanbantitle)
        $(".js-copy-board").text($(this).parents('.kanban-list').find(".kanban-board-title").text())
        $("#kanbanItemModal").modal("show");
    });
    $(document).on("click", ".js-delete-list", function (e) {
        e.preventDefault();
        $(this).parents('.kanban-list').remove();
    });

    $(document).on("keypress", ".kanban-board-title", function (e) {
        if (e.keyCode == '13') {
            e.preventDefault();
        }
    });
    $(document).on("click", ".js-addCard", function (e) {
        e.preventDefault();
        $(this).parents('.kanban-list').find(".kanban-list-wrapper").append('<div class="kanban-item-create"> ' +
            '<div class="card"> <div class="card-body"> <textarea class=" form-control kaban-name"' +
            ' placeholder="Enter title here"></textarea> <div class="p-t-10 text-right"> <a href="#" ' +
            'class="btn-sm btn-white m-r-10 js-kaban-cancel">cancel</a>' +
            ' <a href="#" class="btn-sm btn-primary js-kaban-save">save</a> ' +
            '</div> </div> </div> </div>');
    });
    $(document).on("click", ".js-kaban-save", function (e) {
        e.preventDefault();
        var list = $(this).parents('.kanban-list');
        list.find(".kanban-list-wrapper").append('<div class="kanban-item">' +
            ' <div class="card"> <div class="card-header"> ' +
            '<span class="kanban-item-title"> ' + $(this).parents('.kanban-item-create').find('textarea').val() + ' </span>' +
            '</div> </div> </div>');
        list.find(".kanban-item-create").remove();
        kanbanSortable();
    });

    $(document).on("click", ".js-kaban-cancel", function (e) {
        $(this).parents('.kanban-list').find(".kanban-item-create").remove();
        kanbanSortable();
    });

    $(document).on("click", "#js-add-board", function (e) {
        e.preventDefault();
        $(".kanban-workspace").append($("#kanban-list-template").html());
        kanbanSortable()

    });

    function kanbanSortable() {
        $('.kanban-list-wrapper').sortable({
            connectWith: ".kanban-list-wrapper",
            start: function (event, ui) {
                $(ui.item).addClass('tilt');
            },
            stop: function (event, ui) {
                $(ui.item).removeClass('tilt');
            }
        });
        if (window.innerWidth >= 960) {
            $('.kanban-workspace').sortable({
                cancel: '[contenteditable],textarea'
            });
        }

    }

    kanbanSortable();

})(window.jQuery);