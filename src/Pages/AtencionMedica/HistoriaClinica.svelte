<script>
    import { link, push } from "svelte-spa-router";
    import Loading from "../../componentes/Loading.svelte";
    import axios from "axios";
    import { onMount } from "svelte";
    import { url, user } from "../../util/index";
    import { v4 as uuid } from "uuid";

    import Header from "../../Layout/Header.svelte";
    import AsideAtencion from "../../Layout/AsideAtencion.svelte";
    import ModalDatosPaciente from "../../componentes/Modals/ModalDatosPaciente.svelte";
    import ModalTratamientos from "../../componentes/Modals/ModalTratamientos.svelte";
    import ModalInterconsulta from "../../componentes/Modals/ModalInterconsulta.svelte";
    import ModalAntecedentes from "../../componentes/Modals/ModalAntecedentes.svelte";
    import OrdenesMedicas from "../../componentes/OrdenesMedicas.svelte";
    import SignosVitales from "../../componentes/SignosVitales.svelte";
    import ErrorServer from "../../componentes/ErrorConexion.svelte";
    import NoConexion from "../../componentes/NoConexion.svelte";
    import ErrorConexion from "../../componentes/ErrorConexion.svelte";
    import ModalNuevaCita from "../../componentes/Modals/ModalNuevaCita.svelte";

    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
    });

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
    let fecha = "";
    let hora = "";
    let cargando = false;
    let sltBuscarMedicamentos = "";
    let medicamentosSeleccionados = [];
    let sltBuscarEstudios = "";
    let estudios = [];
    let estudiosSeleccionados = [];
    let historiaGinecologica = {};
    let errorServer = false;
    let empresa = {};
    let exploracionFisica = [];
    let serverConexion = false;
    let cargandoHistoria = false;
    let pacienteSeleccionado = {};
    let disabled = false;

    $: if (historia.estado === "C") {
        disabled = true;
    } else {
        disabled = false;
    }

    const cargarEmpresa = () => {
        const config = {
            method: "get",
            url: `${url}/empresas/${user().empresa}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                empresa = res.data;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const abrirHistoria = (id) => {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Se abrir la historia y tendra acceso a modificarla de nuevo!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Abirla!",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                const config = {
                    method: "put",
                    url: `${url}/historias/${id}/abrir`,
                    headers: {
                        Authorization: `${localStorage.getItem("auth")}`,
                    },
                };
                axios(config)
                    .then((res) => {
                        if (res.status === 200) {
                            cargarHistoria();
                        }
                    })
                    .catch((err) => {});
            }
        });
    };

    const cerrarHistoria = (id) => {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Se cerrara la historia y no podra modificarla en el futuro!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Cerrarla!",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                const config = {
                    method: "put",
                    url: `${url}/historias/${id}/cerrar`,
                    headers: {
                        Authorization: `${localStorage.getItem("auth")}`,
                    },
                };
                axios(config)
                    .then((res) => {
                        if (res.status === 200) {
                            cargarHistoria();
                        }
                    })
                    .catch((err) => {});
            }
        });
    };

    const eliminarHistoria = (id) => {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Se eliminará esta historia clínica, sin embargo, los datos no se perderán, puedes recuperarlos en el futuro!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Eliminarlo!",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                const config = {
                    method: "delete",
                    url: `${url}/historias/${id}`,
                    headers: {
                        Authorization: `${localStorage.getItem("auth")}`,
                    },
                };
                axios(config)
                    .then((res) => {
                        if (res.status === 200) {
                            push(`/pacientes/perfil/${params.idPaciente}`);
                        }
                    })
                    .catch((err) => {});
            }
        });
    };

    const searchMedicamentos = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }

        timeout = setTimeout(function () {
            cargarMedicamentos();
        }, 300);
    };

    function searchDiagnosticos() {
        if (timeout) {
            window.clearTimeout(timeout);
        }

        timeout = setTimeout(function () {
            cargarDiagnosticos();
        }, 300);
    }

    const searchEstudios = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }

        timeout = setTimeout(function () {
            cargarEstudios();
        }, 300);
    };

    const agregarEstudio = (obj) => {
        estudiosSeleccionados = [...estudiosSeleccionados, obj.detail];
        historia.estudios = estudiosSeleccionados;
        guardarHistoria();
        sltBuscarEstudios = "";
    };

    const agregarDiagnosticoPersonalizado = (nombre) => {
        const diagnostico = {
            d: nombre,
            c: "PERS",
            id: uuid(),
        };
        diagnosticosSeleccionados = [...diagnosticosSeleccionados, diagnostico];
        guardarHistoria();
    };

    const agregarComentarioDiagnostico = (position) => {
        if (diagnosticosSeleccionados[position].comentario === undefined) {
            diagnosticosSeleccionados[position].comentario = "";
            historia.diagnosticos = diagnosticosSeleccionados;
            guardarHistoria();
        } else {
            delete diagnosticosSeleccionados[position].comentario;
            diagnosticosSeleccionados = diagnosticosSeleccionados;
            historia.diagnosticos = diagnosticosSeleccionados;
            guardarHistoria();
        }
    };

    const eliminarMedicamento = (event) => {
        if (confirm("Desea eliminar el medicamento?")) {
            medicamentosSeleccionados.splice(event.detail, 1);
            medicamentosSeleccionados = medicamentosSeleccionados;
            historia.medicamentos = medicamentosSeleccionados;
            guardarHistoria();
        }
    };

    const eliminarDiagnostico = (position) => {
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Esta acción eliminara el diagnostico de la consulta, pero puede agregarlo nuevamente luego.!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Eliminar!",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                diagnosticosSeleccionados.splice(position, 1);
                diagnosticosSeleccionados = diagnosticosSeleccionados;
                historia.diagnosticos = diagnosticosSeleccionados;
                guardarHistoria();
                Toast.fire({
                    icon: "success",
                    title: "Se ha eliminado correctamente",
                });
            }
        });
    };

    const eliminarEstudios = (event) => {
        estudiosSeleccionados = estudiosSeleccionados.filter(
            (estudio) => estudio.id !== event.detail
        );
        historia.estudios = estudiosSeleccionados;
        guardarHistoria();
        Toast.fire({
            icon: "success",
            title: "Se ha eliminado correctamente",
        });
    };

    const agregarMedicamento = (event) => {
        if (!event.detail) {
            return false;
        }
        const medicamento = {
            nombre: event.detail,
            concentracion: "",
            cantidad: "",
            frecuencia: "",
        };
        medicamentosSeleccionados = [...medicamentosSeleccionados, medicamento];
        historia.medicamentos = medicamentosSeleccionados;
        sltBuscarMedicamentos = "";
        guardarHistoria();
    };

    const cargarEstudios = () => {
        const config = {
            method: "get",
            url: `${url}/estudios?b=${sltBuscarEstudios}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                estudios = res.data;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const cargarMedicamentos = () => {
        const config = {
            method: "get",
            url: `${url}/medicamentos?b=${sltBuscarMedicamentos}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                medicamentos = res.data;
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const guardarHistoria = () => {
        errorServer = false;
        cargando = true;
        historia.diagnosticos = diagnosticosSeleccionados;
        delete historia.id;
        const config = {
            method: "put",
            url: `${url}/historias/${params.idHistoria}`,
            data: historia,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        try {
            axios(config)
                .then((res) => {
                    cargando = false;
                    if (res.status !== 200) {
                        errorServer = true;
                    }
                })
                .catch((error) => {
                    if (error) {
                        errorServer = true;
                        cargando = false;
                    }
                    cargando = false;
                    console.error(error);
                });
        } catch (error) {
            errorServer = true;
            cargando = false;
        }
    };

    async function cargarPaciente() {
        cargandoHistoria = true;
        const config = {
            method: "get",
            url: `${url}/pacientes/${params.idPaciente}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        try {
            let promesa = await axios(config);
            cargandoHistoria = false;
            if (promesa.status == 200) {
                paciente = await promesa.data;
                edad = calcularEdad(paciente.fechaNacimiento);
                if (paciente.seguroMedico.length !== 0) {
                    seguro = paciente.seguroMedico[0].nombre;
                } else {
                    seguro = "N/A";
                }
            } else {
                serverConexion = true;
                console.error(promesa.statusText);
            }
        } catch (error) {
            cargandoHistoria = false;
            serverConexion = true;
            console.error(promesa.statusText);
        }
    }

    const cargarHistoria = async () => {
        try {
            const config = {
                method: "get",
                url: `${url}/historias/${params.idHistoria}`,
                headers: {
                    Authorization: `${localStorage.getItem("auth")}`,
                },
            };

            let promesa = await axios(config);
            historia = promesa.data;
            temperatura = promesa.data.temperatura;
            presionAlterial = promesa.data.presionAlterial;
            peso = promesa.data.peso;
            diagnosticosSeleccionados = promesa.data.diagnosticos;
            fecha = promesa.data.fechaHora.split("T")[0];
            medicamentosSeleccionados = promesa.data.medicamentos;
            estudiosSeleccionados = promesa.data.estudios;
            historiaGinecologica = promesa.data.historiaGinecologica;
            exploracionFisica = promesa.data.exploracionFisica || [];
            let obtenerHora = promesa.data.fechaHora
                .split("T")[1]
                .split("Z")[0]
                .split(".")[0]
                .split(":");
            hora = obtenerHora[0] + ":" + obtenerHora[1];
        } catch (error) {
            serverConexion = true;
            console.error(error);
        }
    };

    $: filtroDiagnostico = diagnosticos;

    function cargarDiagnosticos() {
        const config = {
            method: "get",
            url: `${url}/diagnosticos?b=${inpBuscarDiagnostico}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
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
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config).then((res) => {
            diagnosticosSeleccionados = [
                ...diagnosticosSeleccionados,
                res.data,
            ];
            guardarHistoria();
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
        cargarEmpresa();
    });
</script>

<AsideAtencion />

<div class="contenedor-datos" id="divHeaderBar">
    {#if errorServer}
        <ErrorServer
            msgError={"Ocurrio un error en la conexion con el servidor, vuelva a intentarlo o llame al administrador"}
        />
    {/if}
    {#if serverConexion}
        <NoConexion />
    {/if}
    {#if cargandoHistoria}
        <div class="cargando">
            <Loading />
        </div>
    {/if}

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
                {#if !cargando && !errorServer}
                    <div class="guardando mr-2 text-success">
                        <i class="mdi mdi-check-all" /> <i>listo y guardado</i>
                    </div>
                {/if}
                {#if errorServer}
                    <div class="guardando mr-2 text-danger">
                        <i class="mdi mdi-close" /> <i>error al guardar</i>
                    </div>
                {/if}
                {#if cargando && !errorServer}
                    <div class="guardando mr-2 text-secondary">
                        <i class="mdi mdi-cached mdi-spin" /> Guardando
                    </div>
                {/if}
            </div>
        </div>
        {#if historia.estado === "A"}
            <button
                type="button"
                class="btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success flotante"
                data-tooltip="Guardar"
                on:click={guardarHistoria}
            >
                <i class="mdi mdi-content-save-outline" />
            </button>
        {/if}
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
                {#if user().roles.includes("admin")}
                    {#if historia.estado === "C"}
                        <button
                            on:click={() => abrirHistoria(params.idHistoria)}
                            style="box-shadow:none;"
                            class="btn btn-outline-danger btn-sm"
                        >
                            <i class="mdi mdi-playlist-plus" />
                            Abrir Historia
                        </button>
                    {/if}
                    {#if historia.estado === "A"}
                        <button
                            on:click={() => cerrarHistoria(params.idHistoria)}
                            style="box-shadow:none;"
                            class="btn btn-success btn-sm"
                        >
                            <i class="mdi mdi-playlist-remove" />
                            Cerrar Historia
                        </button>
                    {/if}
                {/if}

                <!-- <button
                    data-bind=" class: itemClass,click: clickEvent"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-text" />
                    <sapn data-bind="text: text">Agregar Campo</sapn>
                </button> -->

                <!-- <button
                    data-toggle="modal"
                    data-target="#modalInterconsulta"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm"
                >
                    <i data-bind="class: icon" class="mdi mdi-repeat" />
                    <sapn data-bind="text: text">Registrar Interconsulta</sapn>
                </button> -->

                <a
                    href={`/#/pacientes/${params.idPaciente}/historias/${params.idHistoria}/imprimir`}
                    target="_blank"
                    style="box-shadow:none;"
                    class="btn btn-outline-dark btn-sm btn-hover-white"
                >
                    <i data-bind="class: icon" class="mdi mdi-printer" />
                    <sapn data-bind="text: text">Imprimir</sapn>
                </a>

                <button
                    style="box-shadow:none;"
                    class="btn btn-outline-success btn-sm btn-hover-white"
                    on:click|preventDefault={() =>
                        (pacienteSeleccionado = {
                            id: paciente.id,
                            nombres: paciente.nombres,
                            apellidos: paciente.apellidos,
                            sexo: paciente.sexo,
                            fechaNacimiento: paciente.fechaNacimiento,
                            nacionalidad: paciente.nacionalidad,
                            telefono: paciente.telefono,
                            celular: paciente.celular,
                            cedula: paciente.cedula,
                        })}
                    data-toggle="modal"
                    data-target="#modalNuevaCita"
                >
                    <i class="mdi mdi-calendar-multiselect" />
                    Nueva cita
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
                {#if historia.estado === "A"}
                    <button
                        on:click={() => eliminarHistoria(params.idHistoria)}
                        style="box-shadow:none;"
                        class="btn btn-danger btn-sm"
                    >
                        <i data-bind="class: icon" class="mdi mdi-delete" />
                        <sapn data-bind="text: text">Anular</sapn>
                    </button>
                {/if}
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
                        {disabled}
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
            <div class="card m-b-20 autosave">
                <div class="card-header">
                    <div class="card-title">Historial Cl&iacute;nico (Historia de la enfermedad)</div>
                </div>
                <div class="card-body">
                    <textarea
                        {disabled}
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
            {#if empresa.historiaGinecologica}
                <!-- Historia ginecologica -->
                <div class="card m-b-20 border border-primary">
                    <div class="card-header">
                        <div class="card-title text-primary">
                            Historia Ginecologica
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        >Fecha ultima menstruaci&oacute;n</label
                                    >
                                    <input
                                        {disabled}
                                        type="date"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.fechaUltimaMenstruacion}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for="">Fecha ultimo pap</label>
                                    <input
                                        {disabled}
                                        type="date"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.fechaUltimoPap}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for="">Fecha ultimo parto</label>
                                    <input
                                        {disabled}
                                        type="date"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.fechaUltimoParto}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for="">Fecha ultimo aborto</label>
                                    <input
                                        {disabled}
                                        type="date"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.fechaUltimoAborto}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        >Fecha ultima ces&aacute;rea</label
                                    >
                                    <input
                                        {disabled}
                                        type="date"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.fechaUltimoCesarea}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        >Intervalo flujo menstrual</label
                                    >
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        placeholder="Dias"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.intervaloFlujoMenstrual}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        >Cantidad flujo menstrual</label
                                    >
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        placeholder="Dias"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.cantidadFlujoMenstrual}
                                    />
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        >Duracion flujo menstrual</label
                                    >
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        placeholder="Dias"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.duracionFlujoMenstrual}
                                    />
                                </div>
                            </div>
                        </div>
                        <hr />
                        <div class="row">
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Gesta</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.gesta}
                                    />
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Para</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.para}
                                    />
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Abortos</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.abortos}
                                    />
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Ces&aacute;reas</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.cesareas}
                                    />
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Espont&aacute;neos</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.espontaneos}
                                    />
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Provocados</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.provocados}
                                    />
                                </div>
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <label for="">Legrados</label>
                                    <input
                                        {disabled}
                                        type="number"
                                        class="form-control"
                                        on:blur={guardarHistoria}
                                        bind:value={historiaGinecologica.legrados}
                                    />
                                </div>
                            </div>
                        </div>
                        <h5 class="mt-3">Planificaci&oacute;n</h5>
                        <hr />
                        <div class="row">
                            <div class="col-lg-12">
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.sangradoVaginal}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Sangrado Vaginal</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.vidaSexualActiva}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Vida Sexual Activa</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.anticonceptivosOrales}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Anticonceptivos Orales</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.diu}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >DIU</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.aqv}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >AQV</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.condon}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Cond&oacute;n</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.norplant}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Norplant</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.ritmo}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Ritmo</span
                                    >
                                </label>
                                <label class="cstm-switch mr-4 mb-4">
                                    <input
                                        {disabled}
                                        type="checkbox"
                                        on:change={guardarHistoria}
                                        bind:checked={historiaGinecologica.coitoInterruptus}
                                        name="option"
                                        value="1"
                                        class="cstm-switch-input"
                                    />
                                    <span
                                        class="cstm-switch-indicator bg-success "
                                    />
                                    <span class="cstm-switch-description"
                                        >Coito Interruptus</span
                                    >
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- .Historia ginecologica -->
            {/if}
            {#if empresa.signosVitales}
                <!-- content here -->
                <div class="card m-b-20 margen-mobile autosave">
                    <div class="card-header">
                        <div class="card-title">Signos vitales</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        ><i
                                            class="mdi mdi-thermometer mdi-18px"
                                        /> Temperatura</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-7">
                                            <input
                                                {disabled}
                                                type="number"
                                                class="form-control"
                                                on:blur={guardarHistoria}
                                                bind:value={temperatura.valor}
                                            />
                                        </div>
                                        <div class="col-lg-5">
                                            <!-- svelte-ignore a11y-no-onchange -->
                                            <select
                                                class="form-control"
                                                {disabled}
                                                on:change={guardarHistoria}
                                                bind:value={temperatura.tipo}
                                            >
                                                <option value="C" selected
                                                    >°C</option
                                                >
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
                                        ><i
                                            class="mdi mdi-chart-line mdi-18px"
                                        /> Frecuencia respiratoria</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <input
                                                {disabled}
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
                                        ><i
                                            class="mdi mdi-heart-pulse mdi-18px"
                                        /> Frecuencia cardiaca</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <input
                                                {disabled}
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
                                        ><i
                                            class="mdi mdi-heart-pulse mdi-18px"
                                        /> Presion alterial (mmHg)</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-6">
                                            <input
                                                {disabled}
                                                type="number"
                                                class="form-control"
                                                on:blur={guardarHistoria}
                                                bind:value={presionAlterial.mm}
                                            />
                                        </div>
                                        <div class="col-lg-6">
                                            <input
                                                {disabled}
                                                type="number"
                                                class="form-control"
                                                on:blur={guardarHistoria}
                                                bind:value={presionAlterial.Hg}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
            {#if empresa.otrosParametros}
                <div class="card m-b-20">
                    <div class="card-header">
                        <div class="card-title">Otros Parametros</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label for=""
                                        ><i class="mdi mdi-weight-pound" /> Peso</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-7">
                                            <input
                                                {disabled}
                                                type="number"
                                                class="form-control"
                                                on:blur={guardarHistoria}
                                                bind:value={peso.valor}
                                            />
                                        </div>
                                        <div class="col-lg-5">
                                            <!-- svelte-ignore a11y-no-onchange -->
                                            <select
                                                class="form-control"
                                                {disabled}
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
                                        ><i class="mdi mdi-human" /> Escala de glasgow</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div
                                                class="input-group"
                                                style="width: 100% !important; float: right;"
                                            >
                                                <input
                                                    {disabled}
                                                    type="number"
                                                    class="form-control"
                                                    max="15"
                                                    maxlength="2"
                                                    aria-label="Recipient's username"
                                                    aria-describedby="basic-addon2"
                                                    on:blur={guardarHistoria}
                                                    bind:value={historia.escalaGalsgow}
                                                />
                                                <div class="input-group-append">
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
                                        ><i class="mdi mdi-emoticon-happy" /> Escala
                                        de dolor</label
                                    >
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div
                                                class="input-group"
                                                style="width: 100% !important; float: right;"
                                            >
                                                <input
                                                    {disabled}
                                                    type="number"
                                                    class="form-control"
                                                    max="10"
                                                    maxlength="2"
                                                    aria-label="Recipient's username"
                                                    aria-describedby="basic-addon2"
                                                    on:blur={guardarHistoria}
                                                    bind:value={historia.escalaDolor}
                                                />
                                                <div class="input-group-append">
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
                                                {disabled}
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
                                                {disabled}
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
            {/if}

            <div class="card m-b-20 autosave">
                <div class="card-header">
                    <div class="card-title">Examen Cl&iacute;nico (Examen Fisico)</div>
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
                        {disabled}
                        class="form-control"
                        style="width: 100%; display: block;"
                        on:blur={guardarHistoria}
                        bind:value={historia.examenFisico}
                        rows="5"
                        name="Comentario"
                    />
                </div>
            </div>

            {#if empresa.exploracionFisica}
                <div class="card m-b-20">
                    <div class="card-header">
                        <div class="card-title">Exploraci&oacute;n Fisica</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12">
                                {#each exploracionFisica as item}
                                    {#if !item.activo}
                                        <button
                                            class="btn btn-outline-primary mr-2"
                                            {disabled}
                                            on:click={() => {
                                                item.activo = true;
                                                guardarHistoria();
                                            }}>{item.nombre}</button
                                        >
                                    {/if}
                                {/each}
                            </div>
                            <hr />
                            <div class="col-12">
                                <div class="row mt-2">
                                    {#each exploracionFisica as item}
                                        {#if item.activo}
                                            <div class="col-lg-4">
                                                <div
                                                    class="card m-t-10 m-b-20 border border-primary"
                                                >
                                                    <div class="card-header">
                                                        <div class="card-title">
                                                            {item.nombre}
                                                        </div>
                                                    </div>
                                                    <div class="card-body">
                                                        <textarea
                                                            {disabled}
                                                            bind:value={item.text}
                                                            on:blur={guardarHistoria}
                                                            class="form-control"
                                                            rows="5"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

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
                                    {disabled}
                                    type="text"
                                    class="form-control"
                                    on:keyup={searchDiagnosticos}
                                    id="txtBusquedaProblemaMedico"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="true"
                                    autocomplete="off"
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
                                            <a
                                                href="#!"
                                                on:click|preventDefault={() =>
                                                    agregarDiagnosticoPersonalizado(
                                                        inpBuscarDiagnostico
                                                    )}
                                                ><i
                                                    class="mdi mdi-plus"
                                                />Agregar manualmente</a
                                            >
                                        </li>
                                    </div>
                                </ul>
                            </div>
                        </div>

                        <div class="col-md-12">
                            <ul class="list-info">
                                {#each diagnosticosSeleccionados as item, i}
                                    <li>
                                        <span class="badge badge-primary"
                                            >{item.c}</span
                                        >&nbsp;<span>{item.d}</span>
                                        {#if !disabled}
                                            <!-- content here -->
                                            <div
                                                style="position: absolute; top: 0; right: 0;padding: 10px; background-color: white; border-bottom-left-radius: 5px;"
                                            >
                                                <a
                                                    href="#!"
                                                    class="text-primary"
                                                    data-tooltip="Comentar"
                                                    on:click|preventDefault={() =>
                                                        agregarComentarioDiagnostico(
                                                            i
                                                        )}
                                                    ><i
                                                        class="mdi-18px mdi mdi-comment-plus-outline"
                                                    /></a
                                                >
                                                <a
                                                    href="#!"
                                                    class="text-danger"
                                                    data-tooltip="Eliminar"
                                                    on:click|preventDefault={() =>
                                                        eliminarDiagnostico(i)}
                                                    ><i
                                                        class="mdi-18px mdi mdi-trash-can-outline"
                                                    /></a
                                                >
                                            </div>
                                        {/if}
                                        {#if item.comentario !== undefined}
                                            <div class="row mt-3">
                                                <div class="col">
                                                    <input
                                                        {disabled}
                                                        type="text"
                                                        on:blur={guardarHistoria}
                                                        bind:value={item.comentario}
                                                        class="form-control border-primary"
                                                        placeholder="Comentario"
                                                    />
                                                </div>
                                            </div>
                                        {/if}
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
                                        </div>
                                    </div>
                                {/if}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <OrdenesMedicas
                {disabled}
                bind:idHistoria={params.idHistoria}
                bind:idPaciente={params.idPaciente}
                bind:estudiosSeleccionados
                bind:medicamentosSeleccionados
                bind:sltBuscarMedicamentos
                bind:sltBuscarEstudios
                bind:medicamentos
                bind:instrucciones={historia.instrucciones}
                bind:estudios
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
                        {disabled}
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
<ModalNuevaCita {pacienteSeleccionado} />

<style>
    .flotante {
        position: fixed;
        right: 30px;
        bottom: 20px;
    }
    .cargando {
        z-index: 1000;
    }
</style>
