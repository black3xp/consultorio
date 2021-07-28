<script>
    import { link } from "svelte-spa-router";
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import axios from "axios";
    import {onMount} from "svelte";

    import {url, calcularEdad} from "../../util/index";

    let pacientes = [];

    const eliminarPaciente = (id) => {
        Swal.fire({
            title: '¿Esta seguro?',
            text: "Eliminar al paciente es quitarlo de su lista, sin embargo la información no se perderá!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            const config = {
                method: 'put',
                url: `${url}/pacientes/eliminar/${id}`,
                headers: {
                    'Authorization': `${localStorage.getItem('auth')}` 
                }
            }
            axios(config)
                .then(res => {
                    console.log(res.data)
                    cargarPacientes()
                    Swal.fire(
                        'Eliminado!',
                        'El paciente se ha eliminado correctamente.',
                        'success'
                    )
                })
                .catch(error => {
                    console.error(error)
                })
        }
        })
    }

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
                    {#if paciente.activo}
                    <tr>
                        <td>
                            <div class="avatar avatar-sm "><img src="assets/img/users/user-1.jpg" class="avatar-img avatar-sm rounded-circle" alt=""></div>
                        </td>
                        <td>{paciente.nombres} {paciente.apellidos}</td>
                        <td>{calcularEdad(paciente.fechaNacimiento)} años</td>
                        <td>{paciente.sexo}</td>
                        <td>{paciente.celular}</td>
                        <td>{paciente.cedula}</td>
                        <td class="text-right">
                            <!-- svelte-ignore a11y-invalid-attribute -->
                            <a
                                href="#!"
                                on:click|preventDefault={() => eliminarPaciente(paciente.id)}
                                class="btn btn-outline-danger"
                                data-tooltip="Eliminar"
                            >
                                <i class="mdi mdi-close"></i>
                            </a>
                            <a
                                href={`/pacientes/perfil/${paciente.id}`}
                                class="btn btn-outline-primary"
                                data-tooltip="Perfil"
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
    </div>
    </div>
  </section>
</main>