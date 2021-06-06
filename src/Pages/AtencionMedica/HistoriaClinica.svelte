<script>
    import { link } from "svelte-spa-router";
    import Header from "../../Layout/Header.svelte";
    import AsideAtencion from "../../Layout/AsideAtencion.svelte";
    import ModalDatosPaciente from "../../componentes/Modals/ModalDatosPaciente.svelte";
    import ModalTratamientos from "../../componentes/Modals/ModalTratamientos.svelte";
    import ModalInterconsulta from "../../componentes/Modals/ModalInterconsulta.svelte";
    import ModalAntecedentes from "../../componentes/Modals/ModalAntecedentes.svelte";
    import OrdenesMedicas from '../../componentes/OrdenesMedicas.svelte';
    import axios from 'axios';
    import { onMount } from "svelte";
    import { url } from '../../util/index'

    export let params = "";
    let paciente = {};
    let edad = '';
    let seguro = '';
    let diagnosticos = []
    let inpBuscarDiagnostico = '';
    let diagnosticosSeleccionados = [];

    function cargarPaciente() {
        const config = {
            method: 'get',
            url: `${url}/pacientes/${params.idPaciente}`
        }
        axios(config).then(res => {
            paciente = res.data;
            edad = calcularEdad(paciente.fechaNacimiento)
            seguro = paciente.seguroMedico[0].nombre;
            console.log(res.data)
        }).catch(error => {
            console.error(error)
        })
    }

    $: filtroDiagnostico = (diagnosticos);

    function cargarDiagnosticos() {
        const config = {
            method: 'get',
            url: `${url}/diagnosticos?b=${inpBuscarDiagnostico}`
        }
        setTimeout(() => {
            axios(config).then(res => {
                diagnosticos = res.data;
            }).catch(error => {
                console.log(error);
            })
        }, 1000);
    }

    function seleccionarDiagnostico(id) {
        const config = {
            method: 'get',
            url: `${url}/diagnosticos/${id}`
        }
        axios(config).then(res => {
            diagnosticosSeleccionados = [...diagnosticosSeleccionados, res.data]
            console.log(diagnosticosSeleccionados)
        })
        inpBuscarDiagnostico = '';
    }

    function calcularEdad(fecha) {
        var hoy = new Date();
        var cumpleanos = new Date(fecha);
        var edad = hoy.getFullYear() - cumpleanos.getFullYear();
        var m = hoy.getMonth() - cumpleanos.getMonth();

        if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
            edad--;
        }

        return edad;
    }

    onMount(() => {
        cargarPaciente()
        cargarDiagnosticos()
    })
</script>

<AsideAtencion />

<div class="contenedor-datos" id="divHeaderBar">
    <div class="row">
        <div class="col-md-6">
            <h5>
                <span class="badge badge-primary" data-bind="text: titulo">Historia Clinica</span>
                <span data-bind="text: paciente().nombreParaMostrar">{paciente.nombres} {paciente.apellidos} </span>
            </h5>
        </div>
        <div class="col-md-6" style="text-align: right;">
                <div class="guardar-documento">
                    <div class="guardando mr-2 text-success" data-bind="html: content, class: contentClass"><i
                            class="mdi mdi-check-all"></i> <i>listo y guardado</i></div>
                </div>
        </div>
        <div class="col-lg-12">
            <div class="dropdown" data-bind="foreach: actionButtons">

                    <button data-toggle="modal" data-target="#modalDatosPersonales" style="box-shadow:none;"
                        class="btn btn-outline-secondary btn-sm">
                        <i data-bind="class: icon" class="mdi mdi-comment-eye"></i>
                        <sapn data-bind="text: text">Datos del Paciente</sapn>
                    </button>

                    <button data-bind=" class: itemClass,click: clickEvent" style="box-shadow:none;"
                        class="btn btn-outline-dark btn-sm">
                        <i data-bind="class: icon" class="mdi mdi-text"></i>
                        <sapn data-bind="text: text">Agregar Campo</sapn>
                    </button>

                    <button data-toggle="modal" data-target="#modalInterconsulta" style="box-shadow:none;"
                        class="btn btn-outline-dark btn-sm">
                        <i data-bind="class: icon" class="mdi mdi-repeat"></i>
                        <sapn data-bind="text: text">Registrar Interconsulta</sapn>
                    </button>

                    <button data-bind=" class: itemClass,click: clickEvent" style="box-shadow:none;"
                        class="btn btn-outline-dark btn-sm btn-hover-white">
                        <i data-bind="class: icon" class="mdi mdi-printer"></i>
                        <sapn data-bind="text: text">Imprimir</sapn>
                    </button>

                    <button data-toggle="modal" data-target="#modalAntecedentes" style="box-shadow:none;"
                        class="btn btn-outline-dark btn-sm">
                        <i data-bind="class: icon" class="mdi mdi-account-clock"></i>
                        <sapn data-bind="text: text">Antecedentes</sapn>
                    </button>

                    <button data-bind=" class: itemClass,click: clickEvent" style="box-shadow:none;"
                        class="btn btn-outline-danger btn-sm">
                        <i data-bind="class: icon" class="mdi mdi-delete"></i>
                        <sapn data-bind="text: text">Anular</sapn>
                    </button>
            </div>
        </div>
    </div>
</div>

    <Header />
    <main class="admin-main">
        <div class="container m-b-30">
            <div class="col-lg-12" style="margin-top: 150px">
                <div data-bind="if: perfil().motivoConsulta" class="card m-b-20 margen-mobile">
                    <div class="card-header">
                        <div class="card-title">Motivo de consulta</div>
                    </div>
                    <div class="card-body">
                        <textarea class="form-control" style="width: 100%; display: block; height: 150px;" rows="3" name="Comentario" data-bind="value: atencionMedica.motivoConsulta"></textarea>
                    </div>
                </div>
                <div data-bind="if: perfil().historiaEnfermedad" class="card m-b-20 autosave">
                    <div class="card-header">
                        <div class="card-title">Historia de la enfermedad</div>
                    </div>
                    <div class="card-body">
                        <textarea class="form-control" data-bind="value: atencionMedica.historiaEnfermedad" style="width: 100%; display: block; height: 150px;" rows="3" name="Comentario"></textarea>
                    </div>
                </div>
                <div class="card m-b-20 autosave" data-bind="if: perfil().examenMental">
                    <div class="card-header">
                        <div class="card-title">Examen mental</div>
                    </div>
                    <div class="card-body">
                        <textarea class="form-control" data-bind="value: notaMedica.examenMental" style="width: 100%; display: block; height: 150px;" rows="3" name="Comentario"></textarea>
                    </div>
                </div>
                
                <div class="card m-b-20 margen-mobile autosave">
                    <div class="card-header">
                        <div class="card-title">Signos vitales</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-thermometer mdi-18px"></i> Temperatura</label>
                                    <div class="row">
                                        <div class="col-lg-7">
                                            <input type="number" class="form-control">
                                        </div>
                                        <div class="col-lg-5">
                                            <select class="form-control">
                                                <option value="°C">°C</option>
                                                <option value="°K">°K</option>
                                                <option value="°F">°F</option>
                                            </select>
                                        </div>
                                    </div>
                                  </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-chart-line mdi-18px"></i> Frecuencia respiratoria</label>
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <input type="number" class="form-control">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-heart-pulse mdi-18px"></i> Frecuencia cardiaca</label>
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <input type="number" class="form-control">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-heart-pulse mdi-18px"></i> Presion alterial (mmHg)</label>
                                    <div class="row">
                                        <div class="col-lg-6">
                                            <input type="number" class="form-control">
                                        </div>
                                        <div class="col-lg-6">
                                            <input type="number" class="form-control">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div class="card m-b-20 margen-mobile autosave">
                    <div class="card-header">
                        <div class="card-title">Otros parametros</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-weight-pound"></i> Peso</label>
                                    <div class="row">
                                        <div class="col-lg-7">
                                            <input type="number" class="form-control">
                                        </div>
                                        <div class="col-lg-5">
                                            <select class="form-control">
                                                <option value="°C">Lb</option>
                                                <option value="°K">Kg</option>
                                            </select>
                                        </div>
                                    </div>
                                  </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-human"></i> Escala de glasgow</label>
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div class="input-group" style="width: 100% !important; float: right;">
                                                <input type="number" class="form-control" max="15" maxlength="2" data-bind="value: notaMedica.escalaGlasgow" aria-label="Recipient's username" aria-describedby="basic-addon2">
                                                <div class="input-group-append">
                                                    <span class="input-group-text" id="basic-addon2">/ 15</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-emoticon-happy"></i> Escala de dolor</label>
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div class="input-group" style="width: 100% !important; float: right;">
                                                <input type="number" class="form-control" max="10" maxlength="2" data-bind="value: notaMedica.escalaGlasgow" aria-label="Recipient's username" aria-describedby="basic-addon2">
                                                <div class="input-group-append">
                                                    <span class="input-group-text" id="basic-addon2">/ 10</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""><i class="mdi mdi-opacity"></i> Saturaci&oacute;n de oxigeno</label>
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <input type="number" class="form-control">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-12">
                                <div class="form-group">
                                    <label for="">Otros</label>
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <input type="text" class="form-control">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div data-bind="if: perfil().examenFisico" class="card m-b-20 autosave">
                    <div class="card-header">
                        <div class="card-title">Examen Fisico</div>
                    </div>
                    <div class="card-controls">
                        <div class="dropdown">
                            <a href="/" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="icon mdi  mdi-dots-vertical"></i> </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <button class="dropdown-item" type="button">Action</button>
                                <button class="dropdown-item" type="button">Another action</button>
                                <button class="dropdown-item" type="button">Something else here</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <textarea class="form-control" style="width: 100%; display: block;" data-bind="value: notaMedica.exploracionFisica" rows="5" name="Comentario"></textarea>
                    </div>
                </div>
                <div class="card m-b-20">
                    <div class="card-header">
                        <div class="card-title">Diagnosticos</div>
                    </div>
                    <div class="card-controls">
                        <div class="dropdown">
                            <a href="/" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="icon mdi  mdi-dots-vertical"></i> </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <button class="dropdown-item text-success" type="button"><i class="mdi mdi-plus"></i>
                                    Agregar nuevo diagnostico</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12">
                                <div class="form-group buscardor dropdown dropdown-vnc">
                                    <input
                                        type="text"
                                        class="form-control"
                                        on:keyup={cargarDiagnosticos}
                                        id="txtBusquedaProblemaMedico"
                                        data-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="true"
                                        bind:value={inpBuscarDiagnostico}
                                    >
                                    <ul class="lista-buscador dropdown-menu" id="buscador" x-placement="top-start" style="position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(0px, -128px, 0px); border-radius: 5px;">
                                        <div class="contenidoLista">
                                            {#each filtroDiagnostico as diagnostico}
                                                 <li>
                                                    <div class="p-2" on:click={() => seleccionarDiagnostico(diagnostico.c)}>
                                                        <span class="badge badge-primary">{diagnostico.c}</span>  
                                                        {diagnostico.d}
                                                    </div>
                                                 </li>
                                            {/each}
                                        </div>
                                        <li class="defecto">
                                            <a href="#!"><i class="mdi mdi-plus"></i>Agregar manualmente</a>
                                        </li>
                                    </ul>
                                </div>
        
                            </div>
        
                            <div class="col-md-12">
                                <ul class="list-info">
                                    {#each diagnosticosSeleccionados as item}
                                         <li>
                                             <span class="badge badge-primary">{item.c}</span>&nbsp;<span >{item.d}</span>
                                             <div style="position: absolute; top: 0; right: 0;padding: 10px; background-color: white; border-bottom-left-radius: 5px;">
                                                 <a href="#!" class="text-primary" title="Agregar comentarios"><i class="mdi-18px mdi mdi-comment-plus-outline"></i></a>
                                                 <a href="#!" class="text-danger" data-toggle="tooltip" data-placement="top" data-original-title="Eliminar diagnostico"><i class="mdi-18px mdi mdi-trash-can-outline"></i></a>
                                             </div>
                                         </li>
                                    {/each}
                                    {#if diagnosticosSeleccionados.length === 0}
                                    <div class="row">
                                        <div class="col-md-12">
                                            <div class="alert border alert-light" role="alert">
                                                <p class="alert-body text-center mt-3">No tienes agregado ningún diagnostico
                                                </p>
                                            </div>
                                            <ul class="list-info" data-bind="foreach: estudios"></ul>
                                        </div>
                                     </div>
                                    {/if}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <OrdenesMedicas />

                <div class="card m-b-20 margen-mobile autosave">
                    <div class="card-header">
                        <div class="card-title">Observaciones</div>
                    </div>
                    <div class="card-body">
                        <textarea class="form-control" style="width: 100%; display: block; height: 150px;" rows="3"></textarea>
                    </div>
                </div>

                <div class="row">

                    <div class="col-lg-6">
                        <div class="card m-b-20">
                            <div class="card-header">
                                <div class="card-title">Fecha y hora</div>
                            </div>
                            <div class="card-body">
                                <div class="form-row">
                                    <div class="form-group floating-label col-md-6 show-label">
                                        <label for="">Fecha</label>
                                        <input type="date" class="form-control" placeholder="Fecha">
                                    </div>
                                    <div class="form-group floating-label col-md-6 show-label">
                                        <label for="">Hora</label>
                                        <input type="time" placeholder="Hora" class="form-control" max="23:59:59">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    </main>

<ModalDatosPaciente
    {paciente}
    {edad}
    {seguro}
/>
<ModalTratamientos/>
<ModalInterconsulta/>
<ModalAntecedentes/>