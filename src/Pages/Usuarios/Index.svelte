<script>
    import { link } from "svelte-spa-router";
    import {onMount} from "svelte";
    import {url} from "../../util/index";
    import axios from "axios";

    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ModalCrearUsuario from '../../componentes/Modals/ModalCrearUsuarios.svelte';
    import ModalRolesUsuario from "../../componentes/Modals/ModalRolesUsuario.svelte";


    let usuarios = [];

    function cargarPacientes() {
        const config = {
            method: 'get',
            url: `${url}/usuarios`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        axios(config).then((res) => {
            let {data} = res;
            usuarios = data;
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
  <ModalCrearUsuario/>
  <ModalRolesUsuario/>
  <section class="admin-content">
    <div class="p-2">
      <div class="row" />
      <div class="col-md-12 mt-3 m-b-30">
        <h5>Usuarios 
            <button
                class="btn btn-primary btn-sm"
                data-toggle="modal"
                data-target="#modalUsuario"
                ><i class="mdi mdi-plus"></i> CREAR
            </button>
        </h5>
        <div class="table-responsive">
            <table class="table align-td-middle table-card">
                <thead>
                <tr>
                    <th></th>
                    <th>Nombre</th>
                    <th>Usuario</th>

                    <th></th>
                </tr>
                </thead>
                <tbody>
                {#each usuarios as usuario}
                    <tr>
                        <td>
                            <div class="avatar avatar-sm "><img src="assets/img/users/user-1.jpg" class="avatar-img avatar-sm rounded-circle" alt=""></div>
                        </td>
                        <td>{usuario.nombre} {usuario.apellido}</td>
                        <td>{usuario.correo}</td>
                        <td class="text-right">
                            <!-- svelte-ignore a11y-invalid-attribute -->
                            <button
                                href="#!"
                                class="btn btn-default"
                                data-tooltip="Roles"
                                data-toggle="modal"
                                data-target="#modalRoles"
                            >
                                <i class="mdi mdi-security"></i>
                            </button>
                            <a
                                href="#!"
                                class="btn btn-default text-danger"
                                data-tooltip="Eliminar"
                            >
                            <i class="mdi mdi-trash-can-outline"></i>
                            </a>
                            <a
                                href={`/pacientes/perfil/${usuario.id}`}
                                class="btn btn-default text-primary"
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