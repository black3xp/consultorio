<script>
    import { link } from "svelte-spa-router";
    import {onMount} from "svelte";
    import {url, calcularEdad} from "../../../util/index";
    import axios from "axios";

    import Header from "../../../Layout/Header.svelte";
    import Aside from "../../../Layout/Aside.svelte";
    import ErrorServer from "../../../componentes/ErrorConexion.svelte";


    let indaciones = [];
    let errorServer = false;
    let sltBuscarIndicaciones = '';
    let timeout = null;

    const searchIndicaciones = () => {
        if (timeout) {
            window.clearTimeout(timeout);
        }
        
        timeout = setTimeout(function () { /*function*/; }, 300);
    }


    onMount(() => {
    });

</script>

<Aside />

<main class="admin-main">
  <Header />
  {#if errorServer}
    <ErrorServer
        msgError="Ocurrio un error al contactar al servidor, vuelva a intentar o contacte al administrador"
    />
  {/if}
  <section class="admin-content">
    <div class="p-2">
      <div class="row" />
      <div class="col-md-12 mt-3 m-b-30">
        <h5>Recetas <a href="/pacientes/crear" use:link class="btn btn-primary btn-sm"><i class="mdi mdi-plus"></i> CREAR </a></h5>
        <div class="alert alert-secondary" role="alert">
            <div class="row">
                    <div class="col-12">
                        <div class="row">
                            <div class="col-lg-4">
                                <div class="form-group">
                                    <label for="Buscar">Buscar recetas</label>
                                    <input type="search" bind:value={sltBuscarIndicaciones} on:input={searchIndicaciones} class="form-control" placeholder="Nombres o Apelidos">
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
                    <th>Nombre paciente</th>
                    <th>Cedula</th>
                    <th>Celular</th>
                    <th>Tipo Indicacion</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="avatar avatar-sm">
                                <span class="avatar-title rounded-circle ">VN</span>
                            </div>
                        </td>
                        <td>Vladimir Nunez</td>
                        <td>40223257938</td>
                        <td>8498502828</td>
                        <td>Medicamentos</td>
                        <td class="text-right">
                            <!-- svelte-ignore a11y-invalid-attribute -->
                            <a
                                href="#!"
                                class="btn btn-outline-danger"
                                data-tooltip="Eliminar"
                            >
                                <i class="mdi mdi-close"></i>
                            </a>
                            <a
                                href={`/receta/paciente/190213892384032`}
                                class="btn btn-outline-primary"
                                data-tooltip="Perfil"
                                use:link
                            >
                                <i class="mdi mdi-send"></i>
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>

        </div>
    </div>
    </div>
  </section>
</main>