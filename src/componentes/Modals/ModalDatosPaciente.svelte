<script>
    import { onMount } from "svelte";
    import {link} from "svelte-spa-router";
    import { differenceInDays } from 'date-fns';
    import moment from 'moment';
    import 'moment/locale/es';

    export let paciente = {};
    export let edad = "";
    export let seguro = "";

    onMount(() => {
        moment.locale('es');
    });
</script>
<div class="modal fade modal-slide-right" id="modalDatosPersonales" tabindex="-1" role="dialog"
        aria-labelledby="modalDatosPersonales" style="display: none; padding-right: 16px;" aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalDatosPersonales">Datos del paciente</h5>
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
                        {#if differenceInDays(Date.now(), paciente.updatedAt)  < 90 }
                        <div class="m-auto">
                            <span class="badge badge-primary">Ultima vez modificado
                                <span>{moment(paciente.updatedAt).fromNow()}</span></span>
                        </div>
                        {:else}
                        <div class="m-auto">
                            <span class="badge badge-danger"><i class="mdi mdi-calendar-alert"></i> Ultima vez modificado
                                <span>{moment(paciente.updatedAt).fromNow()}</span></span>
                        </div>
                        {/if}
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
                        <p class="mt-3" style="font-size: 18px"><span class="badge badge-primary">Datos demográficos</span></p>
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
                                <!-- svelte-ignore a11y-missing-content -->
                                <h3 class="mdi mdi-close-outline"></h3>
                                <div class="text-overline">Cerrar</div>
                            </a>
                        </div>
                        <div class="col">
                            <a href={`/pacientes/${paciente.id}/editar`} use:link class="text-success" on:click={() => jQuery("#modalDatosPersonales").modal('hide')}>
                                <!-- svelte-ignore a11y-missing-content -->
                                <h3 class="mdi mdi-account-edit"></h3>
                                <div class="text-overline">Editar</div>
                            </a>
                        </div>
                        <div class="col">
                            <!-- svelte-ignore missing-declaration -->
                            <a href={`/pacientes/perfil/${paciente.id}`} use:link on:click={() => jQuery("#modalDatosPersonales").modal('hide')} class="text-info">
                                <!-- svelte-ignore a11y-missing-content -->
                                <h3 class="mdi mdi-folder-account-outline"></h3>
                                <div class="text-overline">Perfil</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>