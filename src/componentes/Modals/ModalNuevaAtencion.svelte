<div class="modal fade bd-example-modal-lg" tabindex="-1" id="modalNuevaAtencion" role="dialog"
        aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content">
                <form data-bind="submit: crearAtencion" id="frmCreacionAtencion">
                    <div class="modal-header">
                        <h5 class="modal-title" id="myLargeModalLabel">Nueva atenci&oacute;n </h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div class="modal-body">
                        <h6>Tipo de atenci&oacute;n</h6>
                        <div class="col-md-12">
                            <div class="row">
                                <div class=" m-b-10 ml-2">
                                    <label class="cstm-switch cursor-hover">
                                        <input type="radio" checked name="TipoAtencion"
                                            data-bind="checked: tipoAtencion" value="A" class="cstm-switch-input">
                                        <span class="cstm-switch-indicator "></span>
                                        <span class="cstm-switch-description">Ambulatoria </span>
                                    </label>
                                </div>

                                <div class=" m-b-10 ml-2">
                                    <label class="cstm-switch">
                                        <input type="radio" name="TipoAtencion" data-bind="checked: tipoAtencion"
                                            value="E" class="cstm-switch-input">
                                        <span class="cstm-switch-indicator "></span>
                                        <span class="cstm-switch-description">Emergencia </span>
                                    </label>
                                </div>
                                <div class=" m-b-10 ml-2">
                                    <label class="cstm-switch">
                                        <input type="radio" name="TipoAtencion" data-bind="checked: tipoAtencion"
                                            value="H" class="cstm-switch-input">
                                        <span class="cstm-switch-indicator "></span>
                                        <span class="cstm-switch-description"> Hospitalizaci&oacute;n </span>
                                    </label>
                                </div>
                            </div>

                        </div>
                        <br>
                        <div data-bind="visible: puedeCrear()">
                            <h6>Motivo de Consulta</h6>
                            <textarea class="form-control" required style="width: 100%; display: block; height: 150px;"
                                id="exampleFormControlTextarea1" rows="3"
                                 name="MotivoConsulta"></textarea>
                            <br>
                        </div>

                        <div class="alert alert-border-warning"
                            data-bind="visible: !puedeCrear(), using: warningMessage">
                            <div class="d-flex">
                                <div class="icon">
                                    <i class="mdi mdi-alert-circle-outline"></i>
                                </div>
                                <div class="content">
                                    <strong data-bind="text: title"> -- </strong> <span data-bind="text: message"> --
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>


                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                        <button data-bind="visible: puedeCrear()" type="submit" class="btn btn-primary">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    </div>