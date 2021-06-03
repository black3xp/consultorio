<div class="modal fade" id="modalNuevaNota" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" style="display: none;" aria-hidden="true">
    <div class="modal-dialog  modal-dialog-align-top-left" role="document">
        <div class="modal-content">
            <div class="modal-header" style="border-bottom: none;">
                <h5 class="modal-title" id="exampleModalLabel">Crear nota médica</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body" id="divNuevaNota">
                <div class="m-b-10 mt-2" style="text-align: center;">
                    <label class="cstm-switch mr-3">
                        <input type="radio" name="TipoNota" value="NE" checked="" data-bind="checked: tipoNotaSeleccionado" class="cstm-switch-input">
                        <span class="cstm-switch-indicator "></span>
                        <span class="cstm-switch-description">Nota de Evolución </span>
                    </label>
                    <label class="cstm-switch">
                        <input type="radio" name="TipoNota" value="EG" data-bind="checked: tipoNotaSeleccionado" class="cstm-switch-input">
                        <span class="cstm-switch-indicator "></span>
                        <span class="cstm-switch-description">Nota de Egreso </span>
                    </label>
                </div>
            </div>
            <div class="modal-footer" style="border-top: none;">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    Cancelar
                </button>
                <button type="button" data-bind="click: crearNota" class="btn btn-primary">Crear</button>
            </div>
        </div>
    </div>
</div>