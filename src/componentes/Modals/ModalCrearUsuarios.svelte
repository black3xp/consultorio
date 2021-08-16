<form id="frmUsuario">
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
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Nombre</label>
                            <input
                                type="name"
                                class="form-control"
                                placeholder="John"
                                name="Name"
                                maxlength="200"
                                required
                            />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Apellido</label>
                            <input
                                type="name"
                                class="form-control"
                                placeholder="Doe"
                                name="Name"
                                maxlength="200"
                                required
                            />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Email</label>
                            <input
                                type="email"
                                required
                                class="form-control"
                                placeholder="usuario@correo.com"
                                autocomplete="off"
                                name="Email"
                                id="txtCorreo"
                                maxlength="100"
                            />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Contrase&ntilde;a</label>
                            <input
                                type="password"
                                autocomplete="new-password"
                                class="form-control"
                                required
                                name="PasswordHash"
                                maxlength="50"
                            />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="">Repetir contrase&ntilde;a</label>
                            <input
                                type="password"
                                autocomplete="new-password"
                                class="form-control"
                                required
                                name="PasswordHash"
                                maxlength="50"
                            />
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="row text-center p-b-10">
                        <div class="col">
                            <button class="btn btn-default text-danger" data-dismiss="modal">
                                <!-- svelte-ignore a11y-missing-content -->
                                <h3 class="mdi mdi-close-outline"></h3>
                                <div class="text-overline">
                                    Cerrar
                                </div>
                            </button></div> 
                            <div class="col">
                                <button type="submit" class="btn btn-default text-info">
                                    <!-- svelte-ignore a11y-missing-content -->
                                    <h3 class="mdi mdi-content-save-outline"></h3>
                                    <div class="text-overline">
                                        Guardar
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
