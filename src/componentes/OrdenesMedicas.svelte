<div class="alert alert-secondary" role="alert">
    <h4 class="alert-heading">Ordenes Medicas</h4>
    <div class="card m-b-20 mt-3">
        <div class="card-header">
            <div class="card-title">Tratamientos</div>
        </div>
        <div class="card-controls">
            <div class="dropdown">
                <a href="/" class="btn  btn-success btn-sm" data-toggle="modal" data-target="#modalTratamiento"><i
                        class="mdi mdi-plus-box"></i> Agregar
                    tratamientos</a>
                <a type="button" data-original-title="Imprimir tratamientos" href="/Reporte/NotaMedica/110?idAtencion=115"><i
                        class="mdi mdi-printer"></i></a>
                <div class="dropdown-menu dropdown-menu-right">
                    <button class="dropdown-item text-primary" type="button"><i class="mdi mdi-printer"></i>
                        Imprimir estudios</button>
                    <button class="dropdown-item text-success" type="button"><i class="mdi mdi-plus"></i>
                        Agregar nuevo estudio</button>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-12 mb-2">
                    <ul class="list-info" data-bind="foreach: tratamientos">
                        <li>
                                <span data-bind="text: disificacion">10MG de: OLANZAPINA DE 20MG</span> |
                                <span data-bind="text: periodicidad">Una sola vez</span> |
                                <span data-bind="text: 'Vía: ' + via()">Vía: Oral</span> |
                                <span class="badge" style="line-height: 1.7;" data-bind="text: diagnostico">Por diagnostico de: TRASTORNO AFECTIVO BIPOLAR, EPISODIO MIXTO PRESENTE</span>

                                <div class="row mt-3">
                                    <div class="form-group col-md-12">
                                        <input type="text" class="form-control">
                                    </div>
                                </div>

                                <div
                                    style="position: absolute; top: 0; right: 0;padding: 10px; background-color: white; border-bottom-left-radius: 5px;">
                                    <a href="#!" class="text-primary" data-bind="click: modoEditarOn"
                                        title="Agregar comentarios"><i
                                            class="mdi-18px mdi mdi-comment-plus-outline"></i></a>
                                    <a href="/" class="text-danger" data-toggle="tooltip" data-placement="top"
                                        data-original-title="Eliminar tratamiento" data-bind="click: eliminar"><i
                                            class="mdi-18px mdi mdi-trash-can-outline"></i></a>
                                </div>
                        </li>

                        <li>
                                <span data-bind="text: disificacion">400MG de: LITIO 300MG, 50 TAB.</span> |
                                <span data-bind="text: periodicidad">Cada 12 Horas/s</span> |
                                <span data-bind="text: 'Vía: ' + via()">Vía: Oral</span> |
                                <span class="badge" style="line-height: 1.7;" data-bind="text: diagnostico">Por diagnostico de: TRASTORNO AFECTIVO BIPOLAR, EPISODIO MIXTO PRESENTE</span>
                                <div style="position: absolute; top: 0; right: 0;padding: 10px; background-color: white; border-bottom-left-radius: 5px;">
                                    <a href="#!" class="text-primary" data-bind="click: modoEditarOn" title="Agregar comentarios">
                                        <i class="mdi-18px mdi mdi-comment-plus-outline"></i>
                                    </a>
                                    <a href="/" class="text-danger" data-toggle="tooltip" data-placement="top" data-original-title="Eliminar tratamiento" data-bind="click: eliminar">
                                        <i class="mdi-18px mdi mdi-trash-can-outline"></i>
                                    </a>
                                </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <div class="card m-b-20">
        <div class="card-header">
            <div class="card-title">Estudios</div>
        </div>
        <div class="card-controls">
            <div class="dropdown dropdown-vnc">
                <a href="/" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="icon mdi  mdi-dots-vertical"></i> </a>
                <div class="dropdown-menu dropdown-menu-right">
                    <button class="dropdown-item text-primary" type="button"><i class="mdi mdi-printer"></i>
                        Imprimir estudios</button>
                    <button class="dropdown-item text-success" type="button"><i class="mdi mdi-plus"></i>
                        Agregar nuevo estudio</button>
                </div>
            </div>
        </div>

        <div class="card-body">
            <div class="row">
                <div class="col-12">
                    <form class="row" data-bind="submit: agregar">
                        <div class="col-lg-6 col-md-12">
                            <div class="form-group buscardor dropdown dropdown-vnc">
                                <input type="text" class="form-control" name="" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" required="true">
                                <input type="text" class="form-control readonly d-none" name="" readonly="" aria-haspopup="true" aria-expanded="true" data-bind="click: limpiar, value: nombreEstudioSeleccionado, class: (nombreEstudioSeleccionado() =='')? 'd-none' : ''">
                                <ul class="lista-buscador dropdown-menu" id="buscador" x-placement="bottom-start" style="position: absolute; will-change: transform; border-radius: 5px; top: 0px; left: 0px; transform: translate3d(0px, 36px, 0px);">
                                    <div class="contenidoLista" data-bind="foreach: listado"></div>
                                    <li class="defecto">
                                        <a href="/" data-bind="click: agregarManualmente"><i class="mdi mdi-plus"></i> Agregar manualmente</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-lg-5 col-md-12">
                            <div class="form-group ">
                                <select class="form-control" required="" data-bind="options: diagnosticos, 
                                    optionsCaption: '- Diagnostico para el tratamiento -',
                                    optionsText: 'problemaMedico',
                                    value: diagnostico"><option value="">- Diagnostico para el tratamiento -</option><option value="">TRASTORNO AFECTIVO BIPOLAR, EPISODIO MIXTO PRESENTE</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-lg-1 col-md-12">
                            <button type="submit" class="btn btn-success btn-block mb-3" data-toggle="tooltip" data-placement="right" title="" data-original-title="Agregar estudio"><i class="mdi mdi-plus"></i></button>
                        </div>
                    </form>
                </div>

                <div class="col-md-12">
                    <div class="alert border alert-light" role="alert">
                        <p class="alert-body text-center mt-3">No tienes agregado ningún estudio
                        </p>
                    </div>
                    <ul class="list-info" data-bind="foreach: estudios"></ul>
                </div>
            </div>
        </div>
    </div>

    <div class="card m-b-20">
        <div class="card-header">
            <div class="card-title">Intrucciones</div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-12">
                    <form class="row" data-bind="submit: agregar">
                        <div class="col-lg-11 col-md-12">
                            <div class="form-group buscardor dropdown dropdown-vnc">
                                <input type="text" class="form-control" name="" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" required="true">
                                <input type="text" class="form-control readonly d-none" name="" readonly="" aria-haspopup="true" aria-expanded="true" data-bind="click: limpiar, value: nombreEstudioSeleccionado, class: (nombreEstudioSeleccionado() =='')? 'd-none' : ''">
                            </div>
                        </div>
                        <div class="col-lg-1 col-md-12">
                            <button type="submit" class="btn btn-success btn-block mb-3" data-toggle="tooltip" data-placement="right" title="" data-original-title="Agregar estudio"><i class="mdi mdi-plus"></i></button>
                        </div>
                    </form>
                </div>

                <div class="col-md-12">
                    <div class="alert border alert-light" role="alert">
                        <p class="alert-body text-center mt-3">No tienes agregado ningún estudio
                        </p>
                    </div>
                    <ul class="list-info" data-bind="foreach: estudios"></ul>
                </div>
            </div>
        </div>
    </div>
    
</div>