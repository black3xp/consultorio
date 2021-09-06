<script>
    import { link } from "svelte-spa-router";
    import {onMount} from "svelte";
    import axios from "axios";
    import {url, calcularEdad} from "../../util/index";

    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ErrorServer from '../../componentes/ErrorConexion.svelte';


    let citas = [];
    let errorServer = false;
    let sltBuscarCitas = '';
    let timeout = null;
    let cargando = false;
    let cambiandoEstado = false;
    let estados = {
        N: 'Nuevo',
        X: 'Cancelada',
        R: 'Realizada'
    };
    let tandas = {
        M: 'Mañana',
        V: 'Tarde',
        N: 'Noche',
    }
    let txtFecha = new Date().toISOString().split('T')[0];

    const searchCitas = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { cargarCitas(); }, 300);
    }

    const cambiarEstadoCita = (idCita, estado) => {
        cambiandoEstado = true;
        console.log(idCita, estado)
        const cita = {
            estado
        }
        const config = {
            method: 'put',
            url: `${url}/citas/${idCita}`,
            data: cita,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            },
        };
        if(estado === 'X'){
            Swal.fire({
                title: '¿Estas seguro?',
                text: "La cita se va a cancelar y este cupo estara disponible!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Si, Estoy seguro!',
                cancelButtonText: 'No'
            }).then((result) => {
                cambiandoEstado = false;
                if (result.isConfirmed) {
                    axios(config)
                        .then(res => {
                            if(res.data){
                                cambiandoEstado = false;
                                cargarCitas();
                                console.log(res.data);
                            }
                            cambiandoEstado = false;
                        })
                        .catch(err => {
                            cambiandoEstado = false;
                            console.error(err);
                        })
                }
            });
            return
        }
        axios(config)
            .then(res => {
                if(res.data){
                    cambiandoEstado = false;
                    cargarCitas();
                    console.log(res.data);
                }
                cambiandoEstado = false;
            })
            .catch(err => {
                cambiandoEstado = false;
                console.error(err);
            })
    }

    const cargarCitas = () => {
        cargando = true;
        const config = {
            method: 'get',
            url: `${url}/citas?fechaBusqueda=${txtFecha}&busqueda=${sltBuscarCitas}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            },
        };
        axios(config)
            .then(res => {
                cargando= false;
                if(res.status === 200) {
                    citas = res.data
                    console.log(res.data)
                }
            })
            .catch(err => {
                cargando = false;
                console.error(err)
            })
    }

    onMount(() => {
        cargarCitas();
    });

</script>

<Aside />

<main class="admin-main">
  <Header />
  {#if errorServer}
       <ErrorServer
            msgError="Ocurrio un error al conectar con el servidor, vuelva a intentar o contacte al administrador"
        />
  {/if}
  <section class="admin-content">
    <div class="p-2">
      <div class="row" />
      <div class="col-md-12 mt-3 m-b-30">
        <h5>Citas</h5>
        <div class="alert alert-secondary" role="alert">
        <div class="row">
                <div class="col-12">
                    <div class="row">
                        <div class="col-lg-4">
                            <div class="form-group">
                                <label for="Buscar">Buscar citas</label>
                                <input type="search" bind:value={sltBuscarCitas} on:input={searchCitas} class="form-control" placeholder="Nombres, Apelidos o Cedula">
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="form-group">
                                <label for="Buscar">Buscar citas</label>
                                <input type="date" bind:value={txtFecha} on:change={searchCitas} class="form-control" placeholder="Nombres o Apelidos">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table align-td-middle table-card">
                <thead>
                <tr>
                    <th></th>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Fecha Cita</th>
                    <th>Cedula</th>
                    <th>Edad</th>
                    <th>Estado</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {#each citas as cita, i}
                    {#if cita.activo}
                    <tr class:bg-soft-success={cita.estado === "R"} class:bg-soft-danger={cita.estado === "X"}>
                        <td>
                            <div class="avatar avatar-sm">
                                <span class="avatar-title rounded-circle ">{cita.paciente.nombres[0]}{cita.paciente.apellidos[0]}</span>
                            </div>
                        </td>
                        <td>{i+1}</td>
                        <td>{cita.paciente.nombres} {cita.paciente.apellidos}</td>
                        <td>{new Date(cita.fechaCita).toLocaleDateString('es-DO')} 
                            <span
                                class="badge text-white"
                                class:bg-primary={cita.tanda === "M"}
                                class:bg-warning={cita.tanda === "V"}
                            >
                                    {tandas[cita.tanda]}
                            </span>
                        </td>
                        <td>{cita.paciente.cedula}</td>
                        <td>{calcularEdad(cita.paciente.fechaNacimiento)} años</td>
                        <td>
                            <span
                                class="badge text-white"
                                class:bg-success={cita.estado === 'N'}
                                class:bg-secondary={cita.estado === 'R'}
                                class:bg-danger={cita.estado === 'X'}
                            >
                                {estados[cita.estado]}
                            </span>
                        </td>
                        <td class="text-right">
                            {#if cambiandoEstado}
                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            {/if}
                            <!-- svelte-ignore a11y-invalid-attribute -->
                            {#if cita.estado !== 'R' && cita.estado !== 'X'}
                                 <!-- content here -->
                                <a
                                    href="#!"
                                    class="btn btn-outline-danger"
                                    data-tooltip="Cancelar"
                                    on:click|preventDefault={() => cambiarEstadoCita(cita.id, 'X')}
                                >
                                    <i class="mdi mdi-close"></i>
                                </a>
                                <a
                                    href="#!"
                                    class="btn btn-outline-success"
                                    data-tooltip="Marcar realizada"
                                    on:click|preventDefault={() => cambiarEstadoCita(cita.id, 'R')}
                                >
                                   <i class="mdi mdi-check-all"></i>
                                </a>
                                 <a
                                     href={`/pacientes/${cita.paciente.id}/historias/${cita.id}`}
                                     class="btn btn-outline-primary"
                                     data-tooltip="Ver"
                                     use:link
                                 >
                                     <i class="mdi mdi-send"></i>
                                 </a>
                            {/if}
                        </td>
                    </tr>
                    {/if}
                    {/each}
                </tbody>
            </table>

            
        </div>
        {#if cargando}
             <div class="text-center">
                 <div class="spinner-border text-secondary" role="status">
                     <span class="sr-only">Loading...</span>
                 </div>
             </div>
        {/if}
    </div>
    </div>
  </section>
</main>