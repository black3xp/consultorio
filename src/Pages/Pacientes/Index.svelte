<script>
    import { link } from "svelte-spa-router";
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import axios from "axios";
    import {onMount} from "svelte";

    import {url, calcularEdad} from "../../util/index";

    let pacientes = [];

    function cargarPacientes() {
        const config = {
            method: 'get',
            url: `${url}/pacientes`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        axios(config).then((res) => {
            let {data} = res;
            pacientes = data;
        }).catch((err) => {
            console.error(err);
        })
    }

    onMount(() => {
        cargarPacientes()
    });

</script>

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="p-2">
      <div class="row" />
      <div class="col-md-12 mt-3 m-b-30">
        <h5>Pacientes <a href="/pacientes/crear" use:link class="btn btn-primary btn-sm"><i class="mdi mdi-plus"></i> CREAR</a></h5>
        <div class="table-responsive">
            <table class="table align-td-middle table-card">
                <thead>
                <tr>
                    <th></th>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>Sexo</th>
                    <th>Celular</th>
                    <th>Cedula</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {#each pacientes as paciente}
                         <tr>
                             <td>
                                 <div class="avatar avatar-sm "><img src="assets/img/users/user-1.jpg" class="avatar-img avatar-sm rounded-circle" alt=""></div>
                             </td>
                             <td>{paciente.nombres}</td>
                             <td>{calcularEdad(paciente.fechaNacimiento)} años</td>
                             <td>{paciente.sexo}</td>
                             <td>{paciente.celular}</td>
                             <td>{paciente.cedula}</td>
                             <td class="text-right">
                                 <a
                                     href="/pacientes/perfil/1"
                                     class="btn btn-danger"
                                     data-tooltip="Eliminar"
                                     use:link
                                 >
                                     <i class="mdi mdi-close"></i>
                                 </a>
                                 <a
                                     href={`/pacientes/perfil/${paciente.id}`}
                                     class="btn btn-primary"
                                     data-tooltip="Perfil"
                                     use:link
                                 >
                                     <i class="mdi mdi-send"></i>
                                 </a>
                             </td>
                         </tr>
                {/each}
                </tbody>
            </table>

        </div>
    </div>
    </div>
  </section>
</main>