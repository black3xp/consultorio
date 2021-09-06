<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { url } from "../../util";

    import Loading from '../../componentes/Loading.svelte';

    const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    let tandas = [];
    let msgError = "";
    let cargando = false;
    let cupo = '';
    let tanda = '';
    let dia = '';

    const crearHorario = () => {
        cargando = true;
        msgError = '';
        const data = {
            dia,
            cantidadCitas: cupo,
            tanda,
        }
        const config = {
            method: 'post',
            url: `${url}/horarioscitas`,
            data,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
            .then(res => {
                console.log(res.data)
                cargando = false;
                if(res.status === 200){
                    Toast.fire({
                        icon: 'success',
                        title: 'Se ha agregado el horario'
                    })
                }
            })
            .catch(err => {
                cargando = false;
                if(err.response.data !== undefined){
                    if(err.response.data.err === 303){
                        msgError = err.response.data.msg
                        console.log(err.response.data.msg)
                    }
                    if(err.response.data.err === 310){
                        msgError = err.response.data.msg
                        console.log(err.response.data.msg)
                    }
                }
            })
        console.log('Creando')
    }

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

    onMount(() => {
        cargarTandas();
    });
</script>

<form class="col-md-12" on:submit|preventDefault={() => crearHorario()}>
    <div
        class="modal fade modal-slide-right"
        id="modalAgregarHorario"
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
                        Creando horarios
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
                            <label for="" class="text-primary">Dia</label>
                            <select
                                class="form-control"
                                required
                                bind:value={dia}
                            >
                                <option value="">
                                    - seleccionar dia -
                                </option>
                                <option value="0">Lunes</option>
                                <option value="1">Martes</option>
                                <option value="2">Miercoles</option>
                                <option value="3">Jueves</option>
                                <option value="4">Viernes</option>
                                <option value="5">Sabado</option>
                                <option value="6">Domingo</option>
                            </select>
                        </div>
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary">Tanda</label>
                            <select
                                class="form-control"
                                required
                                bind:value={tanda}
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
                            <label for="" class="text-primary">Cupo (Cantidad de personas por tanda)</label>
                            <input type="number" class="form-control" required bind:value={cupo}>
                        </div>
                    </div>

                    {#if msgError}
                        <div class="alert alert-danger" role="alert">
                            {msgError}
                        </div>
                    {/if}
                    <br />
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
