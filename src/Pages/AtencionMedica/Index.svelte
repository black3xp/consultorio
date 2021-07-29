<script>
    import { link } from "svelte-spa-router";
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import axios from "axios";
    import {onMount} from "svelte";

    import {url, calcularEdad} from "../../util/index";

    let historias = [];

    function cargarHistorias() {
        const config = {
            method: 'get',
            url: `${url}/historias`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        axios(config).then((res) => {
            let {data} = res;
            historias = data;
            console.log(historias)
        }).catch((err) => {
            console.error(err);
        })
    }

    onMount(() => {
        cargarHistorias()
    });

</script>

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="p-2">
      <div class="row" />
      <div class="col-md-12 mt-3 m-b-30">
        <h5>Consultas médicas</h5>
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
    </div>
    </div>
  </section>
</main>