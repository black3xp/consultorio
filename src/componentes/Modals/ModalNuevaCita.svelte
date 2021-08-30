<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { url } from "../../util";

    let fechaMinima = new Date().toISOString().split('T')[0];
    export let idPaciente;

    let tandas = [];
    let fechaCita = '';
    let tandaCita = '';
    let msgError = '';

    const cargarTandas = () => {
        const config = {
            method: 'get',
            url: `${url}/tandas`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config)
            .then(res => {
                tandas = res.data
                console.log(res.data)
            })
            .catch(err => {
                console.error(err)
            })
    }

    const crearCita = () => {
        msgError = '';
        if(!fechaCita || !tandaCita) {
           return msgError = 'Algunos campos estan vacios'
        }
        console.log(fechaCita)
        console.log(tandaCita)
        console.log(idPaciente)
    }
    onMount(()=>{
        console.log(fechaMinima)
        cargarTandas()
    })
</script>
<form class="col-md-12" on:submit|preventDefault={() => crearCita()}>
    <div class="modal fade modal-slide-right" id="modalNuevaCita" tabindex="-1" role="dialog"
        aria-labelledby="modalInterconsulta" style="display: none; padding-right: 16px;" aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalInterconsulta">Nueva cita</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group col-md-12">
                                <label for="" class="text-primary">Fecha de la cita</label>
                                <input type="date" class="form-control" bind:value={fechaCita} min={fechaMinima} required>
                            </div>
                            <div class="form-group col-md-12">
                                <label for="" class="text-primary">Tanda</label>
                                <select class="form-control" required bind:value={tandaCita}>
                                    <option value=""> - seleccionar tanda - </option>
                                    {#each tandas as tanda}
                                        <option value={tanda.id}>{tanda.descripcion}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                        
                        {#if msgError}
                        <div class="col-md-12">
                            <div class="alert alert-danger" role="alert">
                                {msgError}
                            </div>
                        </div>
                        {/if}
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
                                <button class="text-success" style="border: none; background-color: transparent;">
                                    <h3 class="mdi mdi-send"></h3>
                                    <div class="text-overline">Crear</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
</form>