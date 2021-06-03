<div class="modal fade modal-slide-right" id="modalDatosPersonales" tabindex="-1" role="dialog"
        aria-labelledby="modalDatosPersonales" style="display: none; padding-right: 16px;" aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalDatosPersonales">Datos de paciente</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">

                    <div class="text-center">
                        <div>
                            <div class="avatar avatar-xl">
                                <img class="avatar-img rounded-circle" src="/atmosTemplate/assets/img/person.webp" alt="imagen paciente">
                            </div>
                        </div>
                        <h3 class="p-t-10 searchBy-name">
                            <a href="/"></a>
                        </h3>
                        <div class="text-muted text-center m-b-10" data-bind="text: paciente().correo">---
                        </div>
                        <div class="m-auto">
                            <span class="badge badge-primary">Ultima vez modificado <span
                                    data-bind="text: paciente().ultimaModificacion">---</span></span>
                        </div>
                    </div>
                    <hr>
                    <form class="form-group floating-label">
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <sapn class="text-primary">Cedula / pasaporte</sapn>
                                    <strong class="d-block" data-bind="text: paciente().cedula"> -- </strong>
                                    <!-- <input type="text" data-bind="value: paciente().cedula" readonly class="form-control"
                                        id="inpCedula"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-12">
                                <div class=" bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Nombres</span>
                                    <strong class="d-block" data-bind="text: paciente().nombres"> -- </strong>
                                    <!-- <input type="text" data-bind="value: paciente().nombres" readonly class="form-control"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Primer Apellido</span>
                                    <strong class="d-block" data-bind="text: paciente().primerApellido"> -- </strong>
                                    <!-- <input type="text" class="form-control" data-bind="value: paciente().primerApellido" readonly
                                        id="inpPrimerApellido"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Segundo Apellido</span>
                                    <strong class="d-block" data-bind="text: paciente().segundoApellido"> -- </strong>
                                    <!-- <input type="text" class="form-control" data-bind="value: paciente().segundoApellido" readonly
                                        id="inpSegundoApellido"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Sexo</span>
                                    <strong class="d-block" data-bind="text: paciente().sexo"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly id="inpSexo" data-bind="value: paciente().sexo"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Edad</span>
                                    <strong class="d-block" data-bind="text: paciente().edad"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly id="inpSexo" data-bind="value: paciente().sexo"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Estado Civil</span>
                                    <strong class="d-block" data-bind="text: paciente().estadoCivil"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly 
                                        data-bind="value: paciente().estadoCivil"> -->
                                </div>
                            </div>

                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Fecha Nacimiento</span>
                                    <strong class="d-block" data-bind="text: paciente().fechaNacimiento"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly 
                                        data-bind="value: paciente().fechaNacimiento"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class=" bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Telefono</span>
                                    <strong class="d-block" data-bind="text: paciente().telefono"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly id="inpTelefono"
                                        data-bind="value: paciente().telefono"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Celular</span>
                                    <strong class="d-block" data-bind="text: paciente().celular"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly id="inpCelular"
                                            data-bind="value: paciente().celular"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Seguro Medico</span>
                                    <strong class="d-block" data-bind="text: paciente().nombreAseguradora"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly 
                                                                            data-bind="value: paciente().nomreAseguradora"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Poliza</span>
                                    <strong class="d-block" data-bind="text: paciente().poliza"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly 
                                        data-bind="value: paciente().poliza"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">NSS</span>
                                    <strong class="d-block" data-bind="text: paciente().nss"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly 
                                        data-bind="value: paciente().poliza"> -->
                                </div>
                            </div>
                        </div>
                        <p class="mt-3"><b>Datos demográficos</b></p>
                        <hr>
                        <div class="form-row">
                            <div class="form-group col-md-12 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span for="inpDireccion" class="text-primary">Direcci&oacute;n</span>
                                    <strong class="d-block" data-bind="text: paciente().direccion"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly
                                        data-bind="value: paciente().direccion">  -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Ciudad</span>
                                    <strong class="d-block" data-bind="text: paciente().ciudad"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly data-bind="value: paciente().ciudad"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span for="inpPais" class="text-primary">Pais</span>
                                    <strong class="d-block" data-bind="text: paciente().pais"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly id="inpDireccion"
                                        data-bind="value: paciente().pais"> -->
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Provincia</span>
                                    <strong class="d-block" data-bind="text: paciente().provincia"> -- </strong>
                                    <!-- <input type="text" class="form-control" readonly
                                        data-bind="value: paciente().provincia"> -->
                                </div>
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
                            <a href="/" class="text-success">
                                <h3 class="mdi mdi-account-edit"></h3>
                                <div class="text-overline">Editar</div>
                            </a>
                        </div>
                        <!-- <div class="col">
                            <a data-bind="attr: {href: '/Expediente/Perfil/' + idPaciente()}" class="text-info">
                                <h3 class="mdi mdi-folder-account-outline"></h3>
                                <div class="text-overline">Perfil</div>
                            </a>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>
    </div>