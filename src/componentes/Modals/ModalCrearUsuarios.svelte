<div class="modal fade modal-slide-right" id="modalUsuario" tabindex="-1" role="dialog"
    aria-labelledby="modalUsuarioLabel" style="display: none; padding-right: 16px;" aria-modal="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalUsuarioLabel">Usuario</h5>
                <button type="button" class="close" data-bind="click: nuevoUsuario" data-dismiss="modal"
                    aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body">

                <form id="frmUsuario">
                    <input type="hidden" name="IdUser">
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Nombre Completo</label>
                            <input type="name" class="form-control" placeholder="Ing. John Doe"
                                name="Name" maxlength="200" required="">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Usuario</label>
                            <input type="email"
                                class="form-control" autocomplete="off" name="UserName" id="" maxlength="100">
                        </div>
                        <div class="form-group col-md-12">
                            <label for="">Email</label>
                            <input type="email" required class="form-control"
                                placeholder="usuario@correo.com" autocomplete="off" name="Email" id="txtCorreo"
                                maxlength="100">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Contrase&ntilde;a</label>
                            <input type="password" class="form-control"
                                 required
                                name="PasswordHash" maxlength="50">
                        </div>

                    </div>

                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Telefono</label>
                            <input type="text" class="form-control"
                                data-mask="(000) 000-0000" data-mask-clearifnotmatch="true" autocomplete="off"
                                maxlength="14" placeholder="(809) 000-0000" name="PhoneNumber" id="txtTelefono">
                        </div>
                        <div class="form-group col-md-12">
                            <label class="cstm-switch">
                                <input type="checkbox" value="true" name="EsMedico"
                                    class="cstm-switch-input">
                                <span class="cstm-switch-indicator "></span>
                                <span class="cstm-switch-description">Es Medico </span>
                            </label>
                        </div>
                        <div class="form-group col-md-12">
                            <label for="">exequatur</label>
                            <input type="text" pattern="^[0-9]+$" class="form-control"
                                utocomplete="off" name="Exequatur" id="txtTelefono">
                        </div>
                        <div class="form-group col-md-12">
                            <select name="IdDepartamento"
                                class=" js-select2 select2-hidden-accessible" id="sltDepartamentos" style="width: 100%;"
                                aria-hidden="true" required>
                                <option value=""></option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Observaciones</label>
                            <textarea class="form-control" rows="3"
                                name="Observaciones"></textarea>
                        </div>
                    </div>

                    <br>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">
                            Cerrar
                        </button>
                        <button type="submit" class="btn btn-success">Guardar</button>
                    </div>
                </form>

            </div>
        </div>
    </div>
</div>
