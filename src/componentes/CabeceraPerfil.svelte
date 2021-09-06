<script>
  import { url } from '../util/index';
  import axios from 'axios';
  import { push } from 'svelte-spa-router';
  import ModalNuevaCita from './Modals/ModalNuevaCita.svelte';
  export let nombres = '';
  export let apellidos = '';
  export let cedula = '';
  export let edad;
  export let id = '';
  export let paciente;
  export let cargando;

  let pacienteSeleccionado = {};
  
  function crearNuevaHistoria() {
    const config = {
      method: 'post',
      url: `${url}/historias`,
      data: paciente,
      headers: {
        'Authorization': `${localStorage.getItem('auth')}` 
      }
    }
    Swal.fire({
      text: "¿Quieres crear una nueva consulta para este paciente?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, crear!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        cargando = true;
        axios(config).then(res => {
          console.log(res.data)
          push(`/pacientes/${id}/historias/${res.data.id}`)
          cargando = false;
        }).catch(error => {
          cargando = false;
          console.error(error)
        })
      }
    })
  }

</script>
<div class="bg-dark m-b-30">
    <div class="">
      <div class="col-md-12">
        <div class="row p-b-60 p-t-60">
          <div class="col-md-6 text-white p-b-30">
            <div class="media">
              <div class="avatar mr-3  avatar-xl">
                <span class="avatar-title rounded-circle">{`${nombres[0]}${apellidos[0]}`}</span>
              </div>
              <div class="media-body m-auto">
                <h5 class="mt-0"> 
                  <span data-bind="text: paciente().nombreParaMostrar">{`${nombres} ${apellidos}`}</span> 
                  <a href="/" class="btn ml-2 btn-primary btn-sm" data-toggle="modal"
                    data-target="#modalDatosPersonales">
                    <i class="mdi mdi-comment-eye"></i> Ver datos personales
                  </a>
                </h5>
                <div class="opacity-75"><span data-bind="text: paciente().edad">{edad} años</span> | <span
                    data-bind="text: paciente().cedula">No. Cedula: {cedula}</span> </div>
              </div>
            </div>

          </div>

          <div class="col-md-6" style="text-align: right">
            <div class="dropdown">
              <button 
                type="button"
                class="btn text-white mb-2 ml-2 mr-2 ml-3 btn-primary"
                on:click={crearNuevaHistoria}
              ><i class="mdi mdi-progress-check"></i>
                Iniciar nueva atención
              </button><br>
              <button 
                type="button"
                class="btn text-white m-b-30 ml-2 mr-2 ml-3 btn-primary"
                on:click={() => pacienteSeleccionado = {
                  id:paciente.id, 
                  nombres: paciente.nombres,
                  apellidos: paciente.apellidos,
                  sexo: paciente.sexo,
                  fechaNacimiento: paciente.fechaNacimiento,
                  nacionalidad: paciente.nacionalidad,
                  telefono: paciente.telefono,
                  celular: paciente.celular,
                  cedula: paciente.cedula,
                }}
                data-toggle="modal"
                data-target="#modalNuevaCita"
              ><i class="mdi mdi-calendar-multiselect"></i>
                Citas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ModalNuevaCita
    {pacienteSeleccionado}
  />