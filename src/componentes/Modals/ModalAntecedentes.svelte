<div class="modal fade modal-slide-right" id="modalAntecedentes" tabindex="-1" role="dialog"
    aria-labelledby="modalAntecedentes" style="display: none;" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalAntecedentes">Antecedentes</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
                <div style="margin-right: 40px;">
                    <div class="guardar-documento">
                        <div class="guardando mr-2 text-success" data-bind="html: content, class: contentClass"><i
                                class="mdi mdi-check-all"></i> <i>listo y guardado</i></div>
                    </div>
                </div>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-lg-12" data-bind="foreach: gruposAntecedentes">

                        <div class="card  m-b-30" style="box-shadow: none; border: #32325d solid 1px;">
                            <div class="card-header">
                                <div class="card-title" data-bind="text: nombre">Antecedentes Patologicos</div>
                            </div>
                            <div class="card-body">
                                <div class="botones-antecedentes" data-bind="foreach: tiposAntecedentesFiltrados">
                                    <button type="button" class="btn btn-outline-primary btn-sm mb-1 mr-2"
                                        style="box-shadow: none;" data-bind="click: $parent.agregar"><i
                                            class="mdi mdi-plus"></i>
                                        <span data-bind="text: nombre">Enfermedades Tiroideas</span>
                                    </button>

                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <div class="row">
                                            <div class="col-lg-12" data-bind="foreach: antecedentesFiltrados"></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        <div class="card  m-b-30" style="box-shadow: none; border: #32325d solid 1px;">
                            <div class="card-header">
                                <div class="card-title" data-bind="text: nombre">Antecedentes no Patologicos</div>
                            </div>
                            <div class="card-body">
                                <div class="botones-antecedentes" data-bind="foreach: tiposAntecedentesFiltrados">
                                    <button type="button" class="btn btn-outline-primary btn-sm mb-1 mr-2"
                                        style="box-shadow: none;" data-bind="click: $parent.agregar"><i
                                            class="mdi mdi-plus"></i>
                                        <span data-bind="text: nombre">Actividad Fisica</span>
                                    </button>

                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <div class="row">
                                            <div class="col-lg-12" data-bind="foreach: antecedentesFiltrados"></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div class="card  m-b-30" style="box-shadow: none; border: #32325d solid 1px;">
                            <div class="card-header">
                                <div class="card-title" data-bind="text: nombre">Antecedentes Psiquiátricos</div>
                            </div>
                            <div class="card-body">
                                <div class="botones-antecedentes" data-bind="foreach: tiposAntecedentesFiltrados">
                                    <button type="button" class="btn btn-outline-primary btn-sm mb-1 mr-2"
                                        style="box-shadow: none;" data-bind="click: $parent.agregar"><i
                                            class="mdi mdi-plus"></i>
                                        <span data-bind="text: nombre">Historia Familiar</span>
                                    </button>

                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <div class="row">
                                            <div class="col-lg-12" data-bind="foreach: antecedentesFiltrados">
                                                <div class="card m-b-20 mt-3" style="box-shadow: none; border: 1px grey solid;">
                                                    <div class="card-header">
                                                        <div class="card-title"><i class="mdi mdi-history mdi-18px"></i> <span data-bind="text: nombre">Historia Familiar</span>
                                                        </div>
                                                    </div>
                                                    <div class="card-controls">
                                                        <div class="dropdown">
                                                            <a href="/" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                <i class="icon mdi  mdi-dots-vertical"></i>
                                                            </a>
                                                            <div class="dropdown-menu dropdown-menu-right">
                                                                <button class="dropdown-item text-danger" data-bind="click: eliminar" type="button"><i class="mdi mdi-trash-can-outline"></i>
                                                                    Eliminar</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="card-body">
                                                        <textarea class="form-control" data-bind="value: descripcion" style="width: 100%; display: block; height: 100px;" id="exampleFormControlTextarea1" rows="5" name="Comentario"></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</div>