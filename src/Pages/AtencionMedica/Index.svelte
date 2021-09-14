<script>
    import { link } from "svelte-spa-router";
    import {onMount} from "svelte";
    import axios from "axios";
    import {url, calcularEdad} from "../../util/index";

    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ErrorServer from '../../componentes/ErrorConexion.svelte';

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
    });



    let historias = [];
    let errorServer = false;
    let sltBuscarHistorias = '';
    let timeout = null;
    let cargando = false;

    const searchHistorias = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { cargarHistorias(); }, 300);
    }

    const eliminarHistoria = (idHistoria) => {
        const config = {
            method: 'delete',
            url: `${url}/historias/${idHistoria}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        Swal.fire({
            title: '¿Estas seguro?',
            text: "La historia se eliminara, sin embargo los datos no ser perderán y se podrán recuperar en el futuro!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                axios(config)
                    .then(res => {
                        if(res.status === 200){
                            cargarHistorias()
                            Toast.fire({
                                icon: 'success',
                                title: 'Se ha eliminado correctamente'
                            })
                        }
                    })
            }
        })
    }

    function cargarHistorias() {
        cargando = true;
        const config = {
            method: 'get',
            url: `${url}/historias?b=${sltBuscarHistorias}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        try {
            axios(config).then((res) => {
            cargando = false;
            if(res.status === 200) {
                let {data} = res;
                historias = data;
            }
            if(res.status === 500) {
                errorServer = true;
            }
            }).catch((err) => {
                if(err) {
                    errorServer = true;
                }
                console.error(err);
            })
        } catch (error) {
            cargando = false;
            if(error) {
                errorServer = true;
            }
        }
    }

    onMount(() => {
        cargarHistorias()
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
        <h5>Consultas médicas</h5>
        <div class="alert alert-secondary" role="alert">
        <div class="row">
                <div class="col-12">
                    <div class="row">
                        <div class="col-lg-4">
                            <div class="form-group">
                                <label for="Buscar">Buscar historias</label>
                                <input type="search" bind:value={sltBuscarHistorias} on:input={searchHistorias} class="form-control" placeholder="Nombres, Apellidos o Cedula">
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
                    <th>Nombre</th>
                    <th>Cedula</th>
                    <th>Edad</th>
                    <th>Sexo</th>
                    <th>Fecha</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {#each historias as historia}
                    {#if historia.activo}
                    <tr>
                        <td>
                            <div class="avatar avatar-sm">
                                <span class="avatar-title rounded-circle ">{historia.paciente.nombres[0]}{historia.paciente.apellidos[0]}</span>
                            </div>
                        </td>
                        <td>{historia.paciente.nombres} {historia.paciente.apellidos}</td>
                        <td>{historia.paciente.cedula}</td>
                        <td>{calcularEdad(historia.paciente.fechaNacimiento)} años</td>
                        <td>{historia.paciente.sexo}</td>
                        <td>{new Date(historia.fechaHora).toLocaleDateString('es-DO')}</td>
                        <td class="text-right">
                            <!-- svelte-ignore a11y-invalid-attribute -->
                            <a
                                href="#!"
                                on:click|preventDefault={() => eliminarHistoria(historia.id)}
                                class="btn btn-outline-danger"
                                data-tooltip="Eliminar"
                            >
                                <i class="mdi mdi-close"></i>
                            </a>
                            <a
                                href={`/pacientes/${historia.paciente.id}/historias/${historia.id}`}
                                class="btn btn-outline-primary"
                                data-tooltip="Ver"
                                use:link
                            >
                                <i class="mdi mdi-send"></i>
                            </a>
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