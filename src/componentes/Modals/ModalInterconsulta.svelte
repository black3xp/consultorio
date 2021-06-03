<div class="modal fade modal-slide-right" id="modalInterconsulta" tabindex="-1" role="dialog"
        aria-labelledby="modalInterconsulta" style="display: none; padding-right: 16px;" aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalInterconsulta">Nueva interconsulta</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="floating-label col-md-12 show-label">
                        <div class="form-row">
                            <div class="form-group col-md-12">
                                <label for="" class="text-primary">Resumen</label>
                                <textarea class="form-control" data-bind="value: resumen"
                                    style="width: 100%; display: block; height: 150px;" name="Comentario"></textarea>
                            </div>
                            <div class="form-group col-md-12">
                                <label for="" class="text-primary">Manejo / Recomendaciones</label>
                                <textarea class="form-control" data-bind="value: recomendaciones"
                                    style="width: 100%; display: block; height: 150px;" name="Comentario"></textarea>
                            </div>

                            <div class="form-group col-lg-12">
                                <select class="form-control" id="sltDepartamentos" style="width: 100%;" required>
                                    <option value="">- Departamento -</option>
                                </select>
                            </div>
                            <div class="form-group col-lg-12">
                                <select class="form-control" id="sltEspecialistasDepartamento" style="width: 100%;" required>
                                    <option value="">- Especialista sugerido -</option>
                                </select>
                            </div>

                        </div>
                    </form>

                </div>
                <div class="modal-footer">
                    <div class="row text-center p-b-10">
                        <div class="col">
                            <a href="/" class="text-danger" data-dismiss="modal">
                                <h3 class="mdi mdi-close-outline"></h3>
                                <div class="text-overline">Cerrar</div>
                            </a>
                        </div>
                        <div class="col">
                            <a href="#!" data-bind="click: crear" class="text-success">
                                <h3 class="mdi mdi-send"></h3>
                                <div class="text-overline">Solicitar</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>