<script>
  import { fade } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import axios from "axios";
  import { onMount, tick } from "svelte";
  import { url } from "../../util/index";

  import Header from "../../Layout/Header.svelte";
  import Aside from "../../Layout/Aside.svelte";
  import Evoluciones from "../../componentes/Evoluciones.svelte";
  import UltimosVitales from "../../componentes/UltimosVitales.svelte";
  import Loading from "../../componentes/Loading.svelte";
  import CabeceraPerfil from "../../componentes/CabeceraPerfil.svelte";
  import ModalDatosPaciente from "../../componentes/Modals/ModalDatosPaciente.svelte";
  import TarjetaAntecedentes from "../../componentes/TarjetaAntecedentes.svelte";

  export let params = "";
  let cargando = false;
  let paciente = {};
  let edad = "";
  let seguro = "";
  let categoriasAntecedentes = [];
  let antecedentes = [];
  let historiasPaciente = [];
  let peso = 0;
  let tipoPeso = '';
  let temperatura = '';
  let tipoTemperatura = '';
  let frecuenciaRespiratoria = '';
  let frecuenciaCardiaca = '';
  let presionAlterial = '';

  const cargarHistoriasPaciente = async () => {
    try {
      const config = {
      method: "get",
      url: `${url}/historias/paciente/${params.id}`,
      headers: {
        'Authorization': `${localStorage.getItem('auth')}` 
      }
    };
    let promesa = await axios(config)
        historiasPaciente = promesa.data;
        if(historiasPaciente.length !== 0){          
          peso = promesa.data[0].peso.valor;
          tipoPeso = promesa.data[0].peso.tipo;
          temperatura = promesa.data[0].temperatura.valor;
          tipoTemperatura = promesa.data[0].temperatura.tipo;
          frecuenciaRespiratoria = promesa.data[0].frecuenciaRespiratoria;
          frecuenciaCardiaca = promesa.data[0].frecuenciaCardiaca;
          presionAlterial = `${promesa.data[0].presionAlterial.mm}/${promesa.data[0].presionAlterial.Hg}`;
        }else{
          return false
        }
    } catch (error) {
      console.log(error)
    }
  };

  function actualizarAntecedentesPaciente() {
    paciente.antecedentes = antecedentes;
    const config = {
      method: "put",
      url: `${url}/pacientes/${paciente.id}`,
      data: paciente,
      headers: {
        'Authorization': `${localStorage.getItem('auth')}` 
      }
    };
    axios(config)
      .then((res) => {
        console.log(res.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const combinarAntecedentes = () => {
    for (const ant of paciente.antecedentes) {
      if (ant.activo == true) {
        const index = antecedentes.findIndex((x) => x.id === ant.id);
        antecedentes[index].activo = ant.activo;
        antecedentes[index].descripcion = ant.descripcion;
      }
    }
  };

  function eliminarAntecedente(idAntecedente) {
    const index = antecedentes.findIndex((x) => x.id === idAntecedente);
    antecedentes[index].activo = false;
    actualizarAntecedentesPaciente();
  }

  function cambiarEstadoAntecedente(idAntecedente) {
    const index = antecedentes.findIndex((x) => x.id === idAntecedente);
    antecedentes[index].activo = true;
    actualizarAntecedentesPaciente();
  }

  async function cargarAntecedentes() {
    const config = {
      method: "get",
      url: `${url}/antecedentes`,
      headers: {
        'Authorization': `${localStorage.getItem('auth')}` 
      }
    };
    let promesa = await axios(config);
    if (promesa.status == 200) {
      antecedentes = promesa.data;
    } else {
      console.error(promesa.statusText);
    }
  }

  function cargarCategoriasAntecedentes() {
    const config = {
      method: "get",
      url: `${url}/categorias/antecedentes`,
      headers: {
        'Authorization': `${localStorage.getItem('auth')}` 
      }
    };
    axios(config).then((res) => {
      categoriasAntecedentes = res.data;
    });
  }

  async function cargarPaciente() {
    cargando = true;
    const config = {
      method: "get",
      url: `${url}/pacientes/${params.id}`,
      headers: {
        'Authorization': `${localStorage.getItem('auth')}` 
      }
    };
    try {
      let promesa = await axios(config);
      if (promesa.status == 200) {
        cargando = false;
        paciente = promesa.data;
        edad = calcularEdad(paciente.fechaNacimiento);
        if(paciente.seguroMedico.length !== 0) {
          seguro = paciente.seguroMedico[0].nombre;
        }
        else
        {
          seguro = "N/A"
        }
      }
    } catch (error) {
      cargando = false;
      console.error(error);
    }
  }

  function calcularEdad(fecha) {
    var hoy = new Date();
    var cumpleanos = new Date(fecha);
    var edad = hoy.getFullYear() - cumpleanos.getFullYear();
    var m = hoy.getMonth() - cumpleanos.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }

    return edad;
  }

  onMount(async () => {
    jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    await cargarPaciente();
    await cargarAntecedentes();
    await cargarHistoriasPaciente();
    cargarCategoriasAntecedentes();
    combinarAntecedentes();
  });
</script>

<Aside />

<main class="admin-main" in:fade={{ duration: 300 }}>
  {#if cargando}
    <div class="cargando">
      <Loading/>
    </div>
  {/if}
  <Header />
  <section class="admin-content">
    <section class="admin-content">
      <CabeceraPerfil
        bind:cargando={cargando}
        bind:edad
        bind:nombres={paciente.nombres}
        bind:apellidos={paciente.apellidos}
        bind:cedula={paciente.cedula}
        bind:id={paciente.id}
        {paciente}
      />
      <div class="pull-up">
        <div class="col-md-12">
          <div class="row">
            <div class="col-lg-3 order-lg-1 order-sm-3">
              <UltimosVitales
                peso={peso ?? 0}
                tipoPeso={tipoPeso}
                temperatura={temperatura}
                tipoTemperatura={tipoTemperatura}
                {frecuenciaRespiratoria}
                {frecuenciaCardiaca}
                {presionAlterial}
              /><!--.signos vitales-->
              <!-- <div class="card m-b-30">
                <div class="card-header">
                  <h5 class="m-b-0">Archivos o Documentos</h5>
                  <p class="m-b-0 mt-2 text-muted">
                    Puede subir documentos del paciente, como fotos de
                    laboratorios, recetas entre otros.
                  </p>
                </div>
                <div class="card-body">
                  <form class="dropzone dz-clickable" action="/">
                    <div class="dz-message">
                      <h1 class="display-4">
                        <i class=" mdi mdi-progress-upload" />
                      </h1>
                      Puede arrastrar el documento a esta zona.<br />
                      <div class="p-t-5">
                        <a href="#!" class="btn btn-lg btn-primary"
                          >Subir Archivo</a
                        >
                      </div>
                    </div>
                  </form>
                  <br />

                  <div class="list-group list-group-flush ">
                    <div class="list-group-item d-flex  align-items-center">
                      <div class="m-r-20">
                        <div class="avatar avatar-sm ">
                          <div class="avatar-title bg-dark rounded">
                            <i class="mdi mdi-24px mdi-file-pdf" />
                          </div>
                        </div>
                      </div>
                      <div class="">
                        <div>SRS Document</div>
                        <div class="text-muted">25.5 Mb</div>
                      </div>

                      <div class="ml-auto">
                        <div class="dropdown">
                          <a
                            href="#!"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                          >
                            <i class="mdi  mdi-dots-vertical mdi-18px" />
                          </a>

                          <div class="dropdown-menu dropdown-menu-right">
                            <button class="dropdown-item" type="button"
                              >Action</button
                            >
                            <button class="dropdown-item" type="button"
                              >Another action</button
                            >
                            <button class="dropdown-item" type="button"
                              >Something else here</button
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="list-group-item d-flex  align-items-center">
                      <div class="m-r-20">
                        <div class="avatar avatar-sm ">
                          <div class="avatar-title bg-dark rounded">
                            <i class="mdi mdi-24px mdi-file-document-box" />
                          </div>
                        </div>
                      </div>
                      <div class="">
                        <div>Design Guide.pdf</div>
                        <div class="text-muted">9 Mb</div>
                      </div>

                      <div class="ml-auto">
                        <div class="dropdown">
                          <a
                            href="#!"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                          >
                            <i class="mdi  mdi-dots-vertical mdi-18px" />
                          </a>

                          <div class="dropdown-menu dropdown-menu-right">
                            <button class="dropdown-item" type="button"
                              >Action</button
                            >
                            <button class="dropdown-item" type="button"
                              >Another action</button
                            >
                            <button class="dropdown-item" type="button"
                              >Something else here</button
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> -->
            </div>

            <div class="col-md-5 order-2 order-sm-1">
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-progress-check mdi-18px" />
                    </div>
                  </div>
                  Historial atenciones
                </div>
                <div class="card-body">
                  {#each historiasPaciente as historia}
                    {#if historia.activo}
                      <!-- content here -->
                      <Evoluciones
                        usuario={historia.usuario}
                        idPaciente={paciente.id}
                        id={historia.id}
                        fecha={historia.fechaHora}
                        motivo={historia.motivoConsulta}
                        historia={historia.historiaEnfermedad}
                      />
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
            <!--.antecedentes columna-->

            <div class="col-md-4 order-lg-12 order-sm-2">
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i
                        on:click={combinarAntecedentes}
                        class="mdi mdi-history mdi-18px"
                      />
                    </div>
                  </div>
                  <span>Antecedentes &nbsp;</span><button
                    class="btn btn-outline-primary btn-sm"
                    data-toggle="modal"
                    data-target="#modalAntecedentes"
                    ><i class="mdi mdi-plus" /> CAMBIAR &nbsp;
                  </button>
                </div>
                <div class="card-body">
                  <div class="atenciones-vnc mb-3">
                    {#each categoriasAntecedentes as categoria}
                      <!-- content here -->
                      <TarjetaAntecedentes
                        bind:id={categoria.id}
                        bind:nombre={categoria.nombre}
                        bind:antecedentes={paciente.antecedentes}
                      />
                    {/each}
                  </div>
                </div>
              </div>

              <!-- <div class="card m-b-30">
                <div class=" card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-comment-account-outline mdi-18px" />
                    </div>
                  </div>
                  Medicamentos en uso
                </div>

                <div class="col-12">
                  <div class="form-group buscardor dropdown">
                    <input
                      type="text"
                      class="form-control"
                      name=""
                      id=""
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    />
                    <ul class="lista-buscador dropdown-menu" id="buscador">
                      <div class="contenidoLista">
                        <li>
                          <a href="#!">Metrocaps</a>
                        </li>
                        <li>
                          <a href="#!">Albendazol</a>
                        </li>
                      </div>
                      <li class="defecto">
                        <a href="#!"
                          ><i class="mdi mdi-plus" /> Agregar manualmente</a
                        >
                      </li>
                    </ul>
                  </div>
                  <div
                    class="alert alert-secondary alert-dismissible fade show"
                    role="alert"
                  >
                    AirPlus
                    <button
                      type="button"
                      class="close"
                      data-dismiss="alert"
                      aria-label="Close"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                </div>
              </div> -->
            </div>
            <!--.citas columna-->
          </div>
        </div>
      </div>
      <!--.pull-on-->
    </section>

    <ModalDatosPaciente {paciente} {edad} {seguro} />

    <!--modal antecedentes-->
    <div
      class="modal fade modal-slide-right"
      id="modalAntecedentes"
      tabindex="-1"
      role="dialog"
      aria-labelledby="modalAntecedentes"
      style="display: none;"
      aria-hidden="true"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalAntecedentes">Antecedentes</h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div style="margin-right: 40px;">
              <div class="guardar-documento">
                <div
                  class="guardando mr-2 text-success"
                  data-bind="html: content, class: contentClass"
                >
                  <i class="mdi mdi-check-all" /> <i>listo y guardado</i>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-lg-12" data-bind="foreach: gruposAntecedentes">
                {#each categoriasAntecedentes as categoria}
                  <div
                    class="card  m-b-30"
                    style="box-shadow: none; border: #32325d solid 1px;"
                  >
                    <div class="card-header">
                      <div class="card-title" data-bind="text: nombre">
                        {categoria.nombre}
                      </div>
                    </div>
                    <div class="card-body">
                      <div
                        class="botones-antecedentes"
                        data-bind="foreach: tiposAntecedentesFiltrados"
                      >
                        {#each antecedentes as antecedente}
                          {#if antecedente.categoria.id === categoria.id}
                            {#if antecedente.activo === false}
                              <!-- content here -->
                              <button
                                type="button"
                                class="btn btn-outline-primary btn-sm mb-1 mr-2"
                                style="box-shadow: none;"
                                on:click={() =>
                                  cambiarEstadoAntecedente(antecedente.id)}
                                ><i class="mdi mdi-plus" />
                                <span data-bind="text: nombre"
                                  >{antecedente.nombre}</span
                                >
                              </button>
                            {/if}
                          {/if}
                        {/each}
                      </div>
                      <div class="row">
                        <div class="col-12">
                          <div class="row">
                            <div
                              class="col-lg-12"
                              data-bind="foreach: antecedentesFiltrados"
                            >
                              {#each antecedentes as antecedente}
                                {#if antecedente.categoria.id === categoria.id}
                                  {#if antecedente.activo === true}
                                    <!-- content here -->
                                    <div
                                      class="card m-b-20 mt-3"
                                      style="box-shadow: none; border: 1px grey solid;"
                                    >
                                      <div class="card-header">
                                        <div class="card-title">
                                          <i class="mdi mdi-history mdi-18px" />
                                          <span data-bind="text: nombre"
                                            >{antecedente.nombre}</span
                                          >
                                        </div>
                                      </div>
                                      <div class="card-controls">
                                        <div class="dropdown">
                                          <a
                                            href="/"
                                            data-toggle="dropdown"
                                            aria-haspopup="true"
                                            aria-expanded="false"
                                          >
                                            <i
                                              class="icon mdi  mdi-dots-vertical"
                                            />
                                          </a>
                                          <div
                                            class="dropdown-menu dropdown-menu-right"
                                          >
                                            <button
                                              class="dropdown-item text-danger"
                                              on:click={() =>
                                                eliminarAntecedente(
                                                  antecedente.id
                                                )}
                                              type="button"
                                              ><i
                                                class="mdi mdi-trash-can-outline"
                                              />
                                              Eliminar</button
                                            >
                                          </div>
                                        </div>
                                      </div>
                                      <div class="card-body">
                                        <textarea
                                          class="form-control"
                                          bind:value={antecedente.descripcion}
                                          on:blur={actualizarAntecedentesPaciente}
                                          style="width: 100%; display: block; height: 100px;"
                                          id="exampleFormControlTextarea1"
                                          rows="5"
                                          name="Comentario"
                                        />
                                      </div>
                                    </div>
                                  {/if}
                                {/if}
                              {/each}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!--.modal antecedentes-->
  </section>
</main>

<style>
  .cargando{
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .lista-buscador {
    margin: 0;
    padding: 0;
    list-style: none;
    background-color: white;
    width: 100% !important;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
  }
</style>
