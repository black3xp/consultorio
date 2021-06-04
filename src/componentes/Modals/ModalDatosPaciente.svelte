<script>
    import { onMount } from "svelte";
    import {link} from "svelte-spa-router"
    export let paciente;
    export let edad;
    export let seguro;

    onMount(() => {
        console.log(paciente);
    });
</script>
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
                                <img class="avatar-img rounded-circle" src="https://picsum.photos/200/300" alt="imagen paciente">
                            </div>
                        </div>
                        <h3 class="p-t-10 searchBy-name">
                            <a href="/">
                            {paciente.nombres} {paciente.apellidos}
                            </a>
                        </h3>
                        <div class="text-muted text-center m-b-10">
                            {paciente.email || 'N/A'}
                        </div>
                        <div class="m-auto">
                            <span class="badge badge-primary">Ultima vez modificado
                                <span>---</span></span>
                        </div>
                    </div>
                    <hr>
                    <form class="form-group floating-label">
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <sapn class="text-primary">Cedula / pasaporte</sapn>
                                    <strong class="d-block">{paciente.cedula || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class=" bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Nombres</span>
                                    <strong class="d-block"> {paciente.nombres || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Apellidos</span>
                                    <strong class="d-block"> {paciente.apellidos || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Sexo</span>
                                    <strong class="d-block"> {paciente.sexo || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Edad</span>
                                    <strong class="d-block"> {edad || 'N/A'} años </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Fecha Nacimiento</span>
                                    <strong class="d-block"> {new Date(paciente.fechaNacimiento).toLocaleDateString('es-DO') || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class=" bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Telefono</span>
                                    <strong class="d-block"> {paciente.telefono || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Celular</span>
                                    <strong class="d-block"> {paciente.celular || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Seguro Medico</span>
                                    <strong class="d-block"> {seguro || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">No. Seguro</span>
                                    <strong class="d-block"> {paciente.numeroSeguro || 'N/A'} </strong>
                                </div>
                            </div>
                        </div>
                        <p class="mt-3"><b>Datos demográficos</b></p>
                        <hr>
                        <div class="form-row">
                            <div class="form-group col-md-12 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span for="inpDireccion" class="text-primary">Direcci&oacute;n</span>
                                    <strong class="d-block"> {paciente.direccion || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Provincia</span>
                                    <strong class="d-block"> {paciente.provincia || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span class="text-primary">Ciudad</span>
                                    <strong class="d-block"> {paciente.ciudad || 'N/A'} </strong>
                                </div>
                            </div>
                            <div class="form-group col-md-6 ">
                                <div class="bg-gray-100 p-2 rounded-sm">
                                    <span for="inpPais" class="text-primary">Nacionalidad</span>
                                    <strong class="d-block"> {paciente.nacionalidad || 'N/A'} </strong>
                                </div>
                            </div>
                            
                        </div>

                    </form>

                </div>
                <div class="modal-footer">
                    <div class="row text-center p-b-10">
                        <div class="col">
                            <a href="#!" class="text-danger" data-dismiss="modal">
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