<script>
  import axios from "axios";
  import { onMount } from "svelte";
  import { url, user } from "../../util/index";

  import Header from "../../Layout/Header.svelte";
  import Aside from "../../Layout/Aside.svelte";
  import ErrorConexion from '../../componentes/ErrorConexion.svelte';

  let numeroPacientes = 0;
  let numeroHistorias = 0;
  let errorServer = false;

  const contarPacientes = () => {
    const confing = {
      method: "get",
      url: `${url}/pacientes`,
      headers: {
        Authorization: `${localStorage.getItem("auth")}`,
      },
    };
    axios(confing)
      .then((res) => {
        numeroPacientes = res.data.length;
      })
      .catch((error) => {
        errorServer = true;
        console.error(error);
      });
  };

  const contarHistorias = () => {
    const confing = {
      method: "get",
      url: `${url}/historias`,
      headers: {
        Authorization: `${localStorage.getItem("auth")}`,
      },
    };
    axios(confing)
      .then((res) => {
        numeroHistorias = res.data.length;
      })
      .catch((error) => {
        errorServer = true;
        console.error(error);
      });
  };

  onMount(() => {
    contarPacientes();
    contarHistorias();
  });
</script>

<Aside />

<main class="admin-main">
  <Header />
  {#if errorServer}
    <ErrorConexion/>
  {/if}
  <section class="admin-content">
    <div class="p-2">
      <div class="col-12">
        <h3 class="mt-2 text-secondary">Hola, {user().name}!</h3>
        <div class="row">
          <div class="col-12 m-b-20 m-t-20">
            <h5><i class="mdi mdi-table" /> Resumen</h5>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card m-b-30">
              <div class="card-body">
                <div class="pb-2">
                  <div class="avatar avatar-lg">
                    <div class="avatar-title bg-soft-primary rounded-circle">
                      <i class="mdi mdi-account" />
                    </div>
                  </div>
                </div>
                <div>
                  <p class="text-muted text-overline m-0">pacientes</p>
                  <h1 class="fw-400">{numeroPacientes}</h1>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <div class="card m-b-30">
              <div class="card-body">
                <div class="pb-2">
                  <div class="avatar avatar-lg">
                    <div class="avatar-title bg-soft-primary rounded-circle">
                      <i class="mdi mdi-format-list-checks"></i>
                    </div>
                  </div>
                </div>
                <div>
                  <p class="text-muted text-overline m-0">historias</p>
                  <h1 class="fw-400">{numeroHistorias}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
