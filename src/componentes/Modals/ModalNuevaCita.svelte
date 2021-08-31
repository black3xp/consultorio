<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { url } from "../../util";

    import Loading from '../../componentes/Loading.svelte';

    let fechaMinima = new Date().toISOString().split("T")[0];
    export let pacienteSeleccionado;

    let tandas = [];
    let citas = [];
    let fechaCita = "";
    let tandaCita = "";
    let msgError = "";
    let observaciones = "";
    let meses = {
        0: "Enero",
        1: "Febrero",
        2: "Marzo",
        3: "Abril",
        4: "Mayo",
        5: "Junio",
        6: "Julio",
        7: "Agosto",
        8: "Septiembre",
        9: "Octubre",
        10: "Noviembre",
        11: "Diciembre",
    };
    let cargando = false;

    $: if (pacienteSeleccionado) {
        cargarCitasPorPaciente();
    }

    const cargarCitasPorPaciente = () => {
        const config = {
            method: "get",
            url: `${url}/citas/paciente/${pacienteSeleccionado.id}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                citas = res.data;
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const cargarTandas = () => {
        const config = {
            method: "get",
            url: `${url}/tandas`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                tandas = res.data;
                console.log(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const crearCita = () => {
        cargando = true;
        msgError = "";
        const data = {
            fechaCita,
            tanda: tandaCita,
            observaciones,
            paciente: pacienteSeleccionado,
        };
        const config = {
            method: "post",
            url: `${url}/citas`,
            data,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        if (!fechaCita || !tandaCita || !observaciones) {
            return (msgError = "Algunos campos estan vacios");
        }
        axios(config)
            .then((res) => {
                cargando = false;
                if (res.status === 200) {
                    console.log(res.data);
                    fechaCita = "";
                    tandaCita = "";
                    observaciones = "";
                    cargarCitasPorPaciente()
                }
            })
            .catch((err) => {
                fechaCita = "";
                tandaCita = "";
                observaciones = "";
                cargando = false;
                if (err.response.data.err === 900) {
                    msgError =
                        "No hay horarios disponibles para este consultorio";
                }
                if (err.response.data.err === 800) {
                    msgError = "No hay cupos disponibles";
                }
                console.error(err);
            });
    };
    onMount(() => {
        console.log(fechaMinima);
        cargarTandas();
    });
</script>

<form class="col-md-12" on:submit|preventDefault={() => crearCita()}>
    <div
        class="modal fade modal-slide-right"
        id="modalNuevaCita"
        tabindex="-1"
        role="dialog"
        aria-labelledby="modalInterconsulta"
        style="display: none; padding-right: 16px;"
        aria-modal="true"
    >
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalInterconsulta">
                        Nueva cita
                    </h5>
                    <button
                        type="button"
                        class="close"
                        data-dismiss="modal"
                        aria-label="Close"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                    {#if cargando}
                        <div class="cargando">
                            <Loading/>
                        </div>
                    {/if}
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary"
                                >Fecha de la cita</label
                            >
                            <input
                                type="date"
                                class="form-control"
                                bind:value={fechaCita}
                                min={fechaMinima}
                                required
                            />
                        </div>
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary">Tanda</label>
                            <select
                                class="form-control"
                                required
                                bind:value={tandaCita}
                            >
                                <option value="">
                                    - seleccionar tanda -
                                </option>
                                {#each tandas as tanda}
                                    <option value={tanda.id}
                                        >{tanda.descripcion}</option
                                    >
                                {/each}
                            </select>
                        </div>
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary"
                                >Observaciones</label
                            >
                            <textarea
                                class="form-control"
                                rows="3"
                                bind:value={observaciones}
                            />
                        </div>
                    </div>

                    {#if msgError}
                        <div class="alert alert-danger" role="alert">
                            {msgError}
                        </div>
                    {/if}
                    <br />

                    {#each citas as cita}
                        <div
                            class="alert alert-dismissible fade show"
                            role="alert"
                            class:alert-border-success={cita.estado === "R"}
                            class:alert-border-danger={cita.estado === "X"}
                            class:alert-border-info={cita.estado === "N"}
                        >
                            <div class="d-flex">
                                <div class="icon">
                                    {#if cita.estado === "R"}
                                        <i
                                            class="icon mdi mdi-check-circle-outline"
                                        />
                                    {/if}
                                    {#if cita.estado === "X"}
                                        <i
                                            class="icon mdi mdi-alert-octagram"
                                        />
                                    {/if}
                                    {#if cita.estado === "N"}
                                        <i
                                            class="icon mdi mdi-alert-circle-outline"
                                        />
                                    {/if}
                                </div>
                                <div class="content">
                                    <div class="calendar">
                                        <div class="fecha">
                                            <span
                                                >{new Date(
                                                    cita.fechaCita
                                                ).getDate() + 1}</span
                                            >
                                            <span
                                                >{meses[
                                                    new Date(
                                                        cita.fechaCita
                                                    ).getMonth()
                                                ]}</span
                                            >
                                            <span
                                                >{new Date(
                                                    cita.fechaCita
                                                ).getFullYear()}</span
                                            >
                                        </div>
                                        <div class="observaciones">
                                            {cita.observaciones}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="modal-footer">
                    <div class="row text-center p-b-10">
                        <div class="col">
                            <a
                                href="/"
                                class="text-danger"
                                data-dismiss="modal"
                            >
                                <h3 class="mdi mdi-close-outline" />
                                <div class="text-overline">Cerrar</div>
                            </a>
                        </div>
                        <div class="col">
                            <button
                                class="text-success"
                                style="border: none; background-color: transparent;"
                            >
                                <h3 class="mdi mdi-send" />
                                <div class="text-overline">Crear</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>

<style>
    .calendar {
        display: flex;
        flex-direction: row;
    }
    .calendar .fecha {
        display: flex;
        flex-direction: column;
    }
    .calendar .fecha span:first-child {
        font-weight: bold;
        font-size: 2.5rem;
        margin-bottom: 0;
        padding-bottom: 0;
        margin-top: -10px;
    }

    .calendar .fecha span:nth-child(2) {
        margin-top: -10px;
        text-transform: uppercase;
        font-size: 0.7rem;
    }

    .calendar .fecha span:last-child {
        letter-spacing: 3px;
    }

    .calendar .observaciones {
        padding: 10px;
        padding-top: 0;
        padding-left: 15px;
    }
</style>
