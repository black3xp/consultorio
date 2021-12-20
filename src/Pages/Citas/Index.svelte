<script>
    import FullCalendar from 'svelte-fullcalendar';
	import dayGridPlugin from '@fullcalendar/daygrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import esLocale from '@fullcalendar/core/locales/es';
    import ModalCitaCalendario from '../../componentes/Modals/ModalCitaCalendario.svelte';

    import { link } from "svelte-spa-router";
    import {onMount} from "svelte";
    import {viewTable} from '../../store';
    import axios from "axios";
    import {url, calcularEdad} from "../../util/index";

    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ErrorServer from '../../componentes/ErrorConexion.svelte';

    let calendarRef;
    function next() {
		let calendarApi = calendarRef.getAPI();
		calendarApi.next();
	}

    function prev() {
		let calendarApi = calendarRef.getAPI();
		calendarApi.prev();
	}

    let citas = [];
    let mesCita = new Date().getMonth() + 1;
    let anioCita = new Date().getFullYear();
    let dateStr = '';
    let citasPorMes = [];
    let citasCalendar = [];
    let errorServer = false;
    let sltBuscarCitas = '';
    let timeout = null;
    let cargando = false;
    let cambiandoEstado = false;
    let options = {};
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
    let citasColor = {
        N: '#00cc99',
        X: '#f2545b',
        R: '#95aac9',
    }
    let txtFecha = new Date().toISOString().split('T')[0];

    const searchCitas = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { cargarCitas(); }, 300);
    }

    const cargarCitasPorMes = (mes, anio) => {
        cargando = true;
        const config = {
            method: 'get',
            url: `${url}/citas/mes/${mes}/anio/${anio}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            },
        };
        axios(config)
            .then(res => {
                cargando= false;
                if(res.status === 200) {
                    citasPorMes = res.data
                    citasCalendar = citasPorMes.map(cita => {
                        return {
                            title: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
                            start: cita.fechaCita,
                            end: cita.fechaCita,
                            color: citasColor[cita.estado],
                            textColor: '#fff',
                            extendedProps: {
                                tanda: cita.tanda === 'V' ? 'Tarde' : cita.tanda === 'N' ? 'Noche' : 'Mañana',
                            }
                        }
                    });
                    citasCalendar = citasCalendar;
                    options = {
                        dayMaxEventRows: false,
                        headerToolbar: { right: 'prev,next' },
                        locales: [ esLocale ],
                        selectable: true,
                        selectHelper: true,
                        viewRender: function(view, element) {
                        },
                        eventRender: function(event, element){
                            jQuery(element).title({title: event.title});
                        },
                        editable: false,
                        dateClick: function(info) {
                            dateStr = info.dateStr;
                            jQuery('#modalCitaCalendario').modal('show')
                            //info.dayEl.style.backgroundColor = 'red';
                        },
                        eventMouseover: function(event, jsEvent, view) {
                        },
                        eventClick: function(info, element) {
                            alert('Event: ' + info.event.title);
                            alert('Coordinates: ' + info.jsEvent.pageX + ',' + info.jsEvent.pageY);
                            alert('View: ' + info.view.type);

                            // change the border color just for fun
                            // info.el.style.borderColor = 'red';
                        },
                        customButtons: {
                            prev: {
                                text: 'Prev',
                                click: function(event, element, view) {
                                    if(mesCita === 1) {
                                        mesCita = 12;
                                        anioCita = anioCita - 1;
                                    } else {
                                        mesCita = mesCita - 1;
                                    }
		                            prev()
                                    cargarCitasPorMes(mesCita, anioCita);
                                }
                            },
                            next: {
                                text: 'Next',
                                click: function(event, element, view) {
                                    if(mesCita === 12) {
                                        mesCita = 1;
                                        anioCita = anioCita + 1;
                                    } else {
                                        mesCita = mesCita + 1;
                                    }
		                            next()
                                    cargarCitasPorMes(mesCita, anioCita);
                                }
                            },
                        },
                        events: citasCalendar,
                        initialView: sltBuscarCitas,
                        plugins: [dayGridPlugin, interactionPlugin],
                    };

                    
                }
            })
            .catch(err => {
                cargando = false;
                console.error(err)
            })
    }

    const cambiarEstadoCita = (idCita, estado) => {
        cambiandoEstado = true;
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
                }
            })
            .catch(err => {
                cargando = false;
                console.error(err)
            })
    }

    onMount(() => {
        cargarCitas();
        cargarCitasPorMes(mesCita, anioCita);
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
                    <div class="calendar"></div>
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
                        <div class="col">
                            <button class="btn btn-outline-primary" on:click={() => $viewTable = !$viewTable} style="margin-top: 30px;">
                                {#if $viewTable}
                                     <!-- content here -->
                                     <i class="mdi mdi-calendar-multiselect mdi-16px"></i>
                                     {:else}
                                     <i class="mdi mdi-view-list mdi-16px"></i>
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="table-responsive">
            {#if !$viewTable}
                 <div class="card m-b-30">
                     <div class="card-body">
                         <div class="row">
                             <div class="col-lg-12">
                                 <div class="d-flex mb-2">
                                    <div style={`width:15px; height: 15px; border-radius: 3px; background-color: ${citasColor['N']}`}>

                                    </div>
                                    <p class="ml-1 mr-3" style="margin-bottom: 0; margin-top: -3px">Nueva</p>
                                    <div style={`width:15px; height: 15px; border-radius: 3px; background-color: ${citasColor['X']}`}>

                                    </div>
                                    <p class="ml-1 mr-3" style="margin-bottom: 0; margin-top: -3px">Cancelada</p>
                                    <div style={`width:15px; height: 15px; border-radius: 3px; background-color: ${citasColor['R']}`}>

                                    </div>
                                    <p class="ml-1 mr-3" style="margin-bottom: 0; margin-top: -3px">Realizada</p>
                                 </div>
                                 <div class="row">
                                 </div>
                                 <FullCalendar {options} bind:this={calendarRef} />
                             </div>
                         </div>
                     </div>
                 </div>
            {/if}
            {#if $viewTable}
                 <!-- content here -->
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
                                          href={`/pacientes/perfil/${cita.paciente.id}`}
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
            {/if}

            
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

<ModalCitaCalendario {dateStr} on:cargarCitasPorMes={cargarCitasPorMes} on:cargarCitas={cargarCitas}/>