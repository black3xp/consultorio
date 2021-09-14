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
  let cargandoResumen = false;
  let msgError = '';

  const contarPacientes = () => {
    cargandoResumen= true;
    const confing = {
      method: "get",
      url: `${url}/pacientes`,
      headers: {
        Authorization: `${localStorage.getItem("auth")}`,
      },
    };
    axios(confing)
      .then((res) => {
        cargandoResumen = false;
        numeroPacientes = res.data.length;
      })
      .catch((error) => {
        cargandoResumen = false;
        errorServer = true;
        msgError = "Ocurrió un error al conectarse con el servidor. Intente de nuevo o contacte al administrador!"
        console.error(error);
      });
  };

  const contarHistorias = () => {
    cargandoResumen = true;
    const confing = {
      method: "get",
      url: `${url}/historias`,
      headers: {
        Authorization: `${localStorage.getItem("auth")}`,
      },
    };
    axios(confing)
      .then((res) => {
        cargandoResumen = false;
        numeroHistorias = res.data.length;
      })
      .catch((error) => {
        cargandoResumen = false;
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
    <ErrorConexion bind:msgError={msgError}/>
  {/if}
  <section class="admin-content">
    <div class="p-2">
      <div class="col-12">
        <h3 class="mt-2 text-secondary">Hola, {user().title}. {user().name}!</h3>
        <div class="row">
          <div class="col-12 m-b-20 m-t-20">
            <h5><i class="mdi mdi-table" /> Resumen</h5>
          </div>
          {#if !cargandoResumen}
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
          {/if}


          {#if cargandoResumen}
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
                     <p class="text-muted text-overline m-0 font-flow">pacientes</p>
                     <h1 class="fw-400 font-flow">{numeroPacientes}</h1>
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
                     <p class="text-muted text-overline m-0 font-flow">pacientes</p>
                     <h1 class="fw-400 font-flow">{numeroPacientes}</h1>
                   </div>
                 </div>
               </div>
             </div>
          {/if}
        </div>
      </div>
    </div>
  </section>
</main>
