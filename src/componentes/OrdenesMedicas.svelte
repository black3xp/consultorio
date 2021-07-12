<script>
    import { createEventDispatcher } from "svelte";
    let dispatch = createEventDispatcher();

    export let instrucciones;
    
</script>
<div class="alert alert-secondary" role="alert">
    <h4 class="alert-heading">Ordenes Medicas</h4>
    <div class="card m-b-20 mt-3">
        <div class="card-header">
            <div class="card-title">Medicamentos</div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-12 mb-2">
                    <div class="row">
                        <div class="col-lg-6">
                            <input type="text" class="form-control" placeholder="Buscar medicamentos">
                        </div>
                        <div class="col-lg-12">
                            <div class="col-lg-12 border mt-3">

                            </div>
                        </div>
                    </div>
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
                        <div class="col-lg-11 col-md-12">
                            <div class="form-group buscardor dropdown dropdown-vnc">
                                <input type="text" class="form-control" name="" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <input type="text" class="form-control readonly d-none" name="" readonly="" aria-haspopup="true" aria-expanded="true">
                                <ul class="lista-buscador dropdown-menu" id="buscador" x-placement="bottom-start" style="position: absolute; will-change: transform; border-radius: 5px; top: 0px; left: 0px; transform: translate3d(0px, 36px, 0px);">
                                    <div class="contenidoLista" data-bind="foreach: listado"></div>
                                    <li class="defecto">
                                        <a href="/" data-bind="click: agregarManualmente"><i class="mdi mdi-plus"></i> Agregar manualmente</a>
                                    </li>
                                </ul>
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
            <div class="card-title">Instrucciones</div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-12">
                    <textarea bind:value={instrucciones} on:blur={() => dispatch('modificado')} class="form-control" style="width: 100%;" rows="5"></textarea>
                </div>
            </div>
        </div>
    </div>
    
</div>