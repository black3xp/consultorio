<script>
    import { link } from "svelte-spa-router";
    import Header from "../../Layout/Header.svelte";
    import AsideAtencion from "../../Layout/AsideAtencion.svelte";
    import ModalDatosPaciente from "../../componentes/Modals/ModalDatosPaciente.svelte";
    import ModalTratamientos from "../../componentes/Modals/ModalTratamientos.svelte";
    import ModalInterconsulta from "../../componentes/Modals/ModalInterconsulta.svelte";
    import ModalAntecedentes from "../../componentes/Modals/ModalAntecedentes.svelte";
    import OrdenesMedicas from "../../componentes/OrdenesMedicas.svelte";
    import SignosVitales from "../../componentes/SignosVitales.svelte";
    import axios from "axios";
    import { onMount } from "svelte";
    import { url } from "../../util/index";
    import { v4 as uuid } from 'uuid';

    export let params = "";
    let paciente = {};
    let edad = "";
    let seguro = "";
    let diagnosticos = [];
    let inpBuscarDiagnostico = "";
    let diagnosticosSeleccionados = [];
    let medicamentos = [];
    let historia = {};
    let temperatura = {};
    let presionAlterial = {};
    let peso = {};
    let timeout = null;
    let fecha = '';
    let hora = '';
    let cargando = false;
    let sltBuscarMedicamentos = '';
    let medicamentosSeleccionados = [];
    let sltBuscarEstudios = '';
    let estudios = [];
    let estudiosSeleccionados = []

    const searchMedicamentos = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { cargarMedicamentos(); }, 300);
    }

    function searchDiagnosticos() {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { cargarDiagnosticos(); }, 300);
    }

    const searchEstudios = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { cargarEstudios(); }, 300);
    }

    const agregarEstudio = (obj) => {
        estudiosSeleccionados = [...estudiosSeleccionados, obj.detail]
        historia.estudios = estudiosSeleccionados;
        guardarHistoria();
        sltBuscarEstudios = '';
        console.log(obj.detail)
    }

    const agregarDiagnosticoPersonalizado = (nombre) => {
        const diagnostico = {
            d: nombre,
            c: 'PERS',
            id: uuid(),
        };
        diagnosticosSeleccionados = [...diagnosticosSeleccionados, diagnostico];
        guardarHistoria();
        console.log(diagnosticosSeleccionados);
    }

    const eliminarMedicamento = (event) => {
        console.log(event.detail)
        if(confirm("Desea eliminar el medicamento?")){
            medicamentosSeleccionados.splice(event.detail, 1)
            medicamentosSeleccionados = medicamentosSeleccionados;
            historia.medicamentos = medicamentosSeleccionados;
            guardarHistoria();
        }
    }

    const eliminarEstudios = (event) => {
        console.log(event.detail)
        if(confirm("Desea eliminar el estudio?")){
            estudiosSeleccionados.splice(event.detail, 1)
            estudiosSeleccionados = estudiosSeleccionados;
            historia.estudios = estudiosSeleccionados;
            guardarHistoria();
        }
    }

    const agregarMedicamento = (event) => {
        if(!event.detail){
            return false
        }
        const medicamento = {
            nombre: event.detail,
            concentracion: '',
            cantidad: '',
            frecuencia: '',
        }
        medicamentosSeleccionados = [...medicamentosSeleccionados, medicamento]
        historia.medicamentos = medicamentosSeleccionados;
        sltBuscarMedicamentos = '';
        guardarHistoria();
        console.log(historia)
    }

    const cargarEstudios = () => {
        const config = {
            method: 'get',
            url: `${url}/estudios?b=${sltBuscarEstudios}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        axios(config)
            .then(res => {
                estudios = res.data;
                console.log(estudios);
            })
            .catch(err => {
                console.error(err)
            })
    }

    const cargarMedicamentos = () => {
        const config = {
            method: 'get',
            url: `${url}/medicamentos?b=${sltBuscarMedicamentos}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config)
            .then(res => {
                medicamentos = res.data;
            })
            .catch(error => {
                console.error(error)
            })
    }

    const guardarHistoria = () => {
        cargando = true;
        historia.diagnosticos = diagnosticosSeleccionados
        delete historia.id;
        const config = {
            method: 'put',
            url: `${url}/historias/${params.idHistoria}`,
            data: historia,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config)
            .then(res => {
                cargando= false
                console.log(res.data)
            })
            .catch(error => {
                cargando = false
                console.error(error)
            })
    };

    async function cargarPaciente() {
        const config = {
            method: "get",
            url: `${url}/pacientes/${params.idPaciente}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        let promesa = await axios(config);
        if (promesa.status == 200) {
            paciente = await promesa.data;
            edad = calcularEdad(paciente.fechaNacimiento);
            seguro = paciente.seguroMedico[0].nombre;
            console.log(promesa.data);
        } else {
            console.error(promesa.statusText);
        }
    }

    const cargarHistoria = async () => {
        const config = {
            method: "get",
            url: `${url}/historias/${params.idHistoria}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        let promesa = await axios(config);
        if (promesa.status == 200) {
            historia = promesa.data;
            temperatura = promesa.data.temperatura;
            presionAlterial = promesa.data.presionAlterial;
            peso = promesa.data.peso;
            diagnosticosSeleccionados = promesa.data.diagnosticos
            fecha = promesa.data.fechaHora.split('T')[0];
            medicamentosSeleccionados = promesa.data.medicamentos;
            estudiosSeleccionados = promesa.data.estudios;
            let obtenerHora = promesa.data.fechaHora.split('T')[1].split('Z')[0].split('.')[0].split(':')
            hora = obtenerHora[0]+':'+obtenerHora[1]
            console.log(historia);
            console.log(hora)
        } else {
            console.error(error);
        }
    };

    $: filtroDiagnostico = diagnosticos;

    function cargarDiagnosticos() {
        const config = {
            method: "get",
            url: `${url}/diagnosticos?b=${inpBuscarDiagnostico}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        setTimeout(() => {
            axios(config)
                .then((res) => {
                    diagnosticos = res.data;
                })
                .catch((error) => {
                    console.log(error);
                });
        }, 1000);
    }

    function seleccionarDiagnostico(id) {
        const config = {
            method: "get",
            url: `${url}/diagnosticos/${id}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        axios(config).then((res) => {
            diagnosticosSeleccionados = [
                ...diagnosticosSeleccionados,
                res.data,
            ];
            guardarHistoria()
            console.log(diagnosticosSeleccionados);
        });
        inpBuscarDiagnostico = "";
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

    onMount(async () => {
        jQuery("html, body").animate({ scrollTop: 0 }, "slow");
        await cargarPaciente();
        await cargarHistoria();
        cargarDiagnosticos();
        cargarMedicamentos();
        cargarEstudios();
    });
</script>

<AsideAtencion />

<div class="contenedor-datos" id="divHeaderBar">
    <div class="row">
        <div class="col-md-6">
            <h5>
                <span class="badge badge-primary" data-bind="text: titulo"
                    >Historia Clinica</span
                >
                <span data-bind="text: paciente().nombreParaMostrar"
                    >{paciente.nombres} {paciente.apellidos}
                </span>
            </h5>
        </div>
        <div class="col-md-6" style="text-align: right;">
            <div class="guardar-documento">
                {#if !cargando}
                    <div
                        class="guardando mr-2 text-success"
                    >
                        <i class="mdi mdi-check-all" /> <i>listo y guardado</i>
                    </div>
                {/if}
                {#if cargando}
                    <div
                        class="guardando mr-2 text-secondary"
                    >
                        <i class="mdi mdi-cached mdi-spin"></i> Guardando
                    </div>
                {/if}
            </div>
        </div>
        <div class="col-lg-12">
            <div class="dropdown" data-bind="foreach: actionButtons">
                <button
                    data-toggle="modal"
                    data-target="#modalDatosPersonales"
                    style="box-shadow:none;"
                    class="btn btn-outline-secondary btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-comment-eye" />
                    <sapn data-bind="text: text">Datos del Paciente</sapn>
                </button>

                <button
                    data-bind=" class: itemClass,click: clickEvent"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-text" />
                    <sapn data-bind="text: text">Agregar Campo</sapn>
                </button>

                <!-- <button
                    data-toggle="modal"
                    data-target="#modalInterconsulta"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-repeat" />
                    <sapn data-bind="text: text">Registrar Interconsulta</sapn>
                </button> -->

                <button
                    data-bind=" class: itemClass,click: clickEvent"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm btn-hover-white"
                >
                    <i data-bind="class: icon" class="mdi mdi-printer" />
                    <sapn data-bind="text: text">Imprimir</sapn>
                </button>

                <!-- <button
                    data-toggle="modal"
                    data-target="#modalAntecedentes"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-account-clock" />
                    <sapn data-bind="text: text">Antecedentes</sapn>
                </button> -->

                <button
                    data-bind=" class: itemClass,click: clickEvent"
                    style="box-shadow:none;"
                    class="btn btn-outline-danger btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-delete" />
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
            <div
                data-bind="if: perfil().motivoConsulta"
                class="card m-b-20 margen-mobile"
            >
                <div class="card-header">
                    <div class="card-title">Motivo de consulta</div>
                </div>
                <div class="card-body">
                    <textarea
                        on:blur={guardarHistoria}
                        bind:value={historia.motivoConsulta}
                        class="form-control"
                        style="width: 100%; display: block; height: 150px;"
                        rows="3"
                        name="Comentario"
                        data-bind="value: atencionMedica.motivoConsulta"
                    />
                </div>
            </div>
            <div
                data-bind="if: perfil().historiaEnfermedad"
                class="card m-b-20 autosave"
            >
                <div class="card-header">
                    <div class="card-title">Historia de la enfermedad</div>
                </div>
                <div class="card-body">
                    <textarea
                        on:blur={guardarHistoria}
                        bind:value={historia.historiaEnfermedad}
                        class="form-control"
                        data-bind="value: atencionMedica.historiaEnfermedad"
                        style="width: 100%; display: block; height: 150px;"
                        rows="3"
                        name="Comentario"
                    />
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
                                <label for=""
                                    ><i class="mdi mdi-thermometer mdi-18px" /> Temperatura</label
                                >
                                <div class="row">
                                    <div class="col-lg-7">
                                        <input
                                            type="number"
                                            class="form-control"
                                            on:blur={guardarHistoria}
                                            bind:value={temperatura.valor}
                                        />
                                    </div>
                                    <div class="col-lg-5">
                                        <!-- svelte-ignore a11y-no-onchange -->
                                        <select class="form-control" on:change={guardarHistoria} bind:value={temperatura.tipo}>
                                            <option value="C" selected>°C</option>
                                            <option value="K">°K</option>
                                            <option value="F">°F</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="form-group">
                                <label for=""
                                    ><i class="mdi mdi-chart-line mdi-18px" /> Frecuencia
                                    respiratoria</label
                                >
                                <div class="row">
                                    <div class="col-lg-12">
                                        <input
                                            type="number"
                                            class="form-control"
                                            on:blur={guardarHistoria}
                                            bind:value={historia.frecuenciaRespiratoria}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="form-group">
                                <label for=""
                                    ><i class="mdi mdi-heart-pulse mdi-18px" /> Frecuencia
                                    cardiaca</label
                                >
                                <div class="row">
                                    <div class="col-lg-12">
                                        <input
                                            type="number"
                                            class="form-control"
                                            on:blur={guardarHistoria}
                                            bind:value={historia.frecuenciaCardiaca}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="form-group">
                                <label for=""
                                    ><i class="mdi mdi-heart-pulse mdi-18px" /> Presion
                                    alterial (mmHg)</label
                                >
                                <div class="row">
                                    <div class="col-lg-6">
                                        <input
                                            type="number"
                                            class="form-control"
                                            on:blur={guardarHistoria}
                                            bind:value={presionAlterial.mm}
                                        />
                                    </div>
                                    <div class="col-lg-6">
                                        <input
                                            type="number"
                                            class="form-control"
                                            on:blur={guardarHistoria}
                                            bind:value={presionAlterial.Hg}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 mt-4">
                            <h5>Otros parametros</h5>
                            <hr />
                            <div class="row">
                                <div class="col-lg-3">
                                    <div class="form-group">
                                        <label for=""
                                            ><i class="mdi mdi-weight-pound" /> Peso</label
                                        >
                                        <div class="row">
                                            <div class="col-lg-7">
                                                <input
                                                    type="number"
                                                    class="form-control"
                                                    on:blur={guardarHistoria}
                                                    bind:value={peso.valor}
                                                />
                                            </div>
                                            <div class="col-lg-5">
                                                <!-- svelte-ignore a11y-no-onchange -->
                                                <select class="form-control"
                                                    on:change={guardarHistoria}
                                                    bind:value={peso.tipo}
                                                >
                                                    <option value="Lb">Lb</option>
                                                    <option value="Kg">Kg</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-3">
                                    <div class="form-group">
                                        <label for=""
                                            ><i class="mdi mdi-human" /> Escala de
                                            glasgow</label
                                        >
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div
                                                    class="input-group"
                                                    style="width: 100% !important; float: right;"
                                                >
                                                    <input
                                                        type="number"
                                                        class="form-control"
                                                        max="15"
                                                        maxlength="2"
                                                        aria-label="Recipient's username"
                                                        aria-describedby="basic-addon2"
                                                        on:blur={guardarHistoria}
                                                        bind:value={historia.escalaGalsgow}
                                                    />
                                                    <div
                                                        class="input-group-append"
                                                    >
                                                        <span
                                                            class="input-group-text"
                                                            id="basic-addon2"
                                                            >/ 15</span
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-3">
                                    <div class="form-group">
                                        <label for=""
                                            ><i
                                                class="mdi mdi-emoticon-happy"
                                            /> Escala de dolor</label
                                        >
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div
                                                    class="input-group"
                                                    style="width: 100% !important; float: right;"
                                                >
                                                    <input
                                                        type="number"
                                                        class="form-control"
                                                        max="10"
                                                        maxlength="2"
                                                        aria-label="Recipient's username"
                                                        aria-describedby="basic-addon2"
                                                        on:blur={guardarHistoria}
                                                        bind:value={historia.escalaDolor}
                                                    />
                                                    <div
                                                        class="input-group-append"
                                                    >
                                                        <span
                                                            class="input-group-text"
                                                            id="basic-addon2"
                                                            >/ 10</span
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-3">
                                    <div class="form-group">
                                        <label for=""
                                            ><i class="mdi mdi-opacity" /> Saturaci&oacute;n
                                            de oxigeno</label
                                        >
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <input
                                                    type="number"
                                                    class="form-control"
                                                    on:blur={guardarHistoria}
                                                    bind:value={historia.saturacionOxigeno}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-12">
                                    <div class="form-group">
                                        <label for="">Otros</label>
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <input
                                                    type="text"
                                                    class="form-control"
                                                    on:blur={guardarHistoria}
                                                    bind:value={historia.otrosParametros}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="card m-b-20 autosave"
            >
                <div class="card-header">
                    <div class="card-title">Examen Fisico</div>
                </div>
                <div class="card-controls">
                    <div class="dropdown">
                        <a
                            href="/"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <i class="icon mdi  mdi-dots-vertical" />
                        </a>
                        <div class="dropdown-menu dropdown-menu-right">
                            <button class="dropdown-item" type="button"
                                >Action</button
                            >
                            <button class="dropdown-item" type="button"
                                >Another action</button
                            >
                            <button class="dropdown-item" type="button"
                                >Something else here</button
                            >
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <textarea
                        class="form-control"
                        style="width: 100%; display: block;"
                        on:blur={guardarHistoria}
                        bind:value={historia.examenFisico}
                        rows="5"
                        name="Comentario"
                    />
                </div>
            </div>
            <div class="card m-b-20">
                <div class="card-header">
                    <div class="card-title">Diagnosticos</div>
                </div>
                <div class="card-controls">
                    <div class="dropdown">
                        <a
                            href="/"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <i class="icon mdi  mdi-dots-vertical" />
                        </a>
                        <div class="dropdown-menu dropdown-menu-right">
                            <button
                                class="dropdown-item text-success"
                                type="button"
                                ><i class="mdi mdi-plus" />
                                Agregar nuevo diagnostico</button
                            >
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-12">
                            <div
                                class="form-group buscardor dropdown dropdown-vnc"
                            >
                                <input
                                    type="text"
                                    class="form-control"
                                    on:keyup={searchDiagnosticos}
                                    id="txtBusquedaProblemaMedico"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="true"
                                    bind:value={inpBuscarDiagnostico}
                                />
                                <ul
                                    class="lista-buscador dropdown-menu"
                                    id="buscador"
                                    x-placement="top-start"
                                    style="position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(0px, -128px, 0px); border-radius: 5px;"
                                >
                                    <div class="contenidoLista">
                                        {#each filtroDiagnostico as diagnostico}
                                            <li>
                                                <div
                                                    class="p-2"
                                                    on:click={() =>
                                                        seleccionarDiagnostico(
                                                            diagnostico.c
                                                        )}
                                                >
                                                    <span
                                                        class="badge badge-primary"
                                                        >{diagnostico.c}</span
                                                    >
                                                    {diagnostico.d}
                                                </div>
                                            </li>
                                        {/each}
                                        <li class="defecto">
                                            <a href="#!"
                                                on:click|preventDefault={() => agregarDiagnosticoPersonalizado(inpBuscarDiagnostico)}
                                                ><i class="mdi mdi-plus" />Agregar
                                                manualmente</a
                                            >
                                        </li>
                                    </div>
                                </ul>
                            </div>
                        </div>

                        <div class="col-md-12">
                            <ul class="list-info">
                                {#each diagnosticosSeleccionados as item}
                                    <li>
                                        <span class="badge badge-primary"
                                            >{item.c}</span
                                        >&nbsp;<span>{item.d}</span>
                                        <div
                                            style="position: absolute; top: 0; right: 0;padding: 10px; background-color: white; border-bottom-left-radius: 5px;"
                                        >
                                            <a
                                                href="#!"
                                                class="text-primary"
                                                title="Agregar comentarios"
                                                ><i
                                                    class="mdi-18px mdi mdi-comment-plus-outline"
                                                /></a
                                            >
                                            <a
                                                href="#!"
                                                class="text-danger"
                                                data-toggle="tooltip"
                                                data-placement="top"
                                                data-original-title="Eliminar diagnostico"
                                                ><i
                                                    class="mdi-18px mdi mdi-trash-can-outline"
                                                /></a
                                            >
                                        </div>
                                    </li>
                                {/each}
                                {#if diagnosticosSeleccionados.length === 0}
                                    <div class="row">
                                        <div class="col-md-12">
                                            <div
                                                class="alert border alert-light"
                                                role="alert"
                                            >
                                                <p
                                                    class="alert-body text-center mt-3"
                                                >
                                                    No tienes agregado ningún
                                                    diagnostico
                                                </p>
                                            </div>
                                            <ul
                                                class="list-info"
                                                data-bind="foreach: estudios"
                                            />
                                        </div>
                                    </div>
                                {/if}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <OrdenesMedicas
                bind:estudiosSeleccionados={estudiosSeleccionados}
                bind:medicamentosSeleccionados={medicamentosSeleccionados}
                bind:sltBuscarMedicamentos={sltBuscarMedicamentos}
                bind:sltBuscarEstudios={sltBuscarEstudios}
                bind:medicamentos={medicamentos}
                bind:instrucciones={historia.instrucciones}
                bind:estudios={estudios}
                on:eliminarEstudio={eliminarEstudios}
                on:agregarEstudio={agregarEstudio}
                on:buscandoEstudios={searchEstudios}
                on:modificado={guardarHistoria}
                on:buscarMedicamentos={searchMedicamentos}
                on:agregarMedicamento={agregarMedicamento}
                on:eliminarMedicamento={eliminarMedicamento}
            />

            <div class="card m-b-20 margen-mobile autosave">
                <div class="card-header">
                    <div class="card-title">Observaciones</div>
                </div>
                <div class="card-body">
                    <textarea
                        class="form-control"
                        style="width: 100%; display: block; height: 150px;"
                        rows="3"
                        on:blur={guardarHistoria}
                        bind:value={historia.observaciones}
                    />
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
                                <div
                                    class="form-group floating-label col-md-6 show-label"
                                >
                                    <label for="">Fecha</label>
                                    <input
                                        type="date"
                                        class="form-control"
                                        placeholder="Fecha"
                                        bind:value={fecha}
                                        disabled
                                    />
                                </div>
                                <div
                                    class="form-group floating-label col-md-6 show-label"
                                >
                                    <label for="">Hora</label>
                                    <input
                                        type="time"
                                        placeholder="Hora"
                                        class="form-control"
                                        on:blur={() => console.log(hora)}
                                        bind:value={hora}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<ModalDatosPaciente {paciente} {edad} {seguro} />
<ModalTratamientos />
<ModalInterconsulta />
<ModalAntecedentes />
