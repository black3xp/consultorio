<div class="modal fade" id="modalTratamiento" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLongTitle">Agregue el tratamiento</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <form data-bind="submit: agregar" id="formularioTratamiento">
                <div class="modal-body">
                    <div class="col-12">
                        <div class="form-group buscardor dropdown dropdown-vnc">
                            <input type="text" class="form-control" placeholder="Medicamento"
                                data-toggle="dropdown">

                            <input type="text" class="form-control readonly" readonly data-bind="click: limpiarMedicamentoSeleccionado, 
                            class: (idMedicamentoSeleccionado() == '')? 'd-none': '',
                            value: nombreMedicamentoSeleccionado" />
                            <ul class="lista-buscador dropdown-menu" x-placement="bottom-start"
                                style="position: absolute; will-change: transform; border-radius: 5px; top: 0px; left: 0px; transform: translate3d(0px, 36px, 0px);">
                                <div class="contenidoLista" data-bind="foreach: medicamentos">
                                    <li>
                                        <a href="#!"
                                            data-bind="text: descripcion, click: $parent.seleccionarMedicamento ">Acetaminofen</a>
                                    </li>
                                </div>
                                <li class="defecto">
                                    <a href="#!"><i class="mdi mdi-plus"></i> Agregar nuevo medicamento</a>
                                </li>
                            </ul>
                        </div>

                    </div>

                    <div class="col-12">
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group buscardor dropdown">
                                    <input type="number" class="form-control" data-bind="value: dosis" required
                                        placeholder="Cantidad dosis" name="">
                                </div>
                            </div>

                            <div class="col-6">
                                <div class="form-group ">
                                    <select required class="form-control" data-bind="options: unidades, 
                                    optionsCaption: '- Unidad de dosis -',
                                    optionsValue: 'id',
                                    optionsText: 'nombre',
                                    value: unidadSeleccionada">
                                        <option value="">- Unidad de dosis -</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12">
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group ">
                                    <select class="form-control" required
                                        data-bind="options: vias, value: viaSeleccionada, optionsCaption: 'Vía'">
                                        <option value="">Via</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class=" m-b-10">
                                    <label class="cstm-switch mt-2">
                                        <input type="checkbox" name="option" data-bind="checked: monodosis"
                                            value="1" class="cstm-switch-input">
                                        <span class="cstm-switch-indicator bg-success "></span>
                                        <span class="cstm-switch-description">Monodosis</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12">
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group buscardor dropdown">
                                    <input type="number" class="form-control" required 
                                        placeholder="Intervalo (Tiempo)" max="100000" name="">
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="m-b-10">
                                    <label class="cstm-switch mt-2">
                                        <input type="radio" name="Tiempo" value="H"
                                            class="cstm-switch-input" checked="checked">
                                        <span class="cstm-switch-indicator "></span>
                                        <span class="cstm-switch-description">Horas </span>
                                    </label>
                                    <label class="cstm-switch mt-2">
                                        <input type="radio" value="M"
                                            class="cstm-switch-input">
                                        <span class="cstm-switch-indicator "></span>
                                        <span class="cstm-switch-description">Minutos </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12">
                        <div class="form-group ">
                            <select required class="form-control" data-bind="options: parent.diagnosticos, 
                                optionsCaption: 'Diagnostico para el tratamiento',
                                optionsText: 'problemaMedico',
                                value: diagnostico">
                                <option selected disabled>Diagnostico para el tratamiento</option>
                            </select>
                        </div>
                    </div>

                    <div class="col-12">
                        <div class="form-group">
                            <textarea class="form-control mt-2" data-bind="value: comentario"
                                placeholder="Comentarios" style="width: 100%; display: block;" rows="3"
                                name="Comentario"></textarea>
                        </div>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">
                        Cerrar
                    </button>
                    <button type="submit" class="btn btn-primary">Agregar</button>
                </div>
            </form>
        </div>
    </div>
</div>