<script>
  import { fade } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import axios from "axios";
  import { onMount } from "svelte";
  import { url } from "../../util/index";

  import Header from "../../Layout/Header.svelte";
  import Aside from "../../Layout/Aside.svelte";
  import Evoluciones from "../../componentes/Evoluciones.svelte";
  import UltimosVitales from "../../componentes/UltimosVitales.svelte";
  import Antecedente from "../../componentes/Antecedente.svelte";
  import CabeceraPerfil from "../../componentes/CabeceraPerfil.svelte";
  import ModalDatosPaciente from "../../componentes/Modals/ModalDatosPaciente.svelte";
  import TarjetaAntecedentes from "../../componentes/TarjetaAntecedentes.svelte";

  export let params = "";
  let paciente = {};
  let edad = "";
  let seguro = "";
  let categoriasAntecedentes = [];

  function cargarCategoriasAntecedentes() {
    const config = {
      method: "get",
      url: `${url}/categorias/antecedentes`,
    };
    axios(config).then((res) => {
      console.log(res.data);
      categoriasAntecedentes = res.data;
    });
  }

  function cargarPaciente() {
    const config = {
      method: "get",
      url: `${url}/pacientes/${params.id}`,
    };
    axios(config)
      .then((res) => {
        paciente = res.data;
        edad = calcularEdad(paciente.fechaNacimiento);
        seguro = paciente.seguroMedico[0].nombre;
        console.log(res.data);
      })
      .catch((error) => {
        console.error(error);
      });
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

  onMount(() => {
    jQuery("html, body").animate({ scrollTop: 0 }, "slow");
    cargarPaciente();
    cargarCategoriasAntecedentes();
  });
</script>

<Aside />

<main class="admin-main" in:fade={{ duration: 300 }}>
  <Header />
  <section class="admin-content">
    <section class="admin-content">
      <CabeceraPerfil
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
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-comment-account-outline mdi-18px" />
                    </div>
                  </div>
                  Comentario
                </div>
                <div class="form-group col-lg-12">
                  <textarea
                    class="form-control mt-2"
                    style="width: 100%; display: block;"
                    id="exampleFormControlTextarea1"
                    readonly=""
                    rows="3"
                    data-bind="value: paciente().comentario"
                    name="Comentario"
                  />
                </div>
              </div>

              <UltimosVitales
                peso={"80"}
                temperatura={"38"}
                frecuenciaRespiratoria={"30"}
                frecuenciaCardiaca={"80"}
                presionAlterial={"80/120"}
              /><!--.signos vitales-->
              <div class="card m-b-30">
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
                        <a href="#" class="btn btn-lg btn-primary"
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
                            href="#"
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
                            href="#"
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
              </div>
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
                  <Evoluciones
                    motivo={"Conducta desorganizada - Alteracion del patron del sueño - Pobre respuesta al tx"}
                    historia={"Refiere el informante (esposo) que el cuadro actual inicia hace alrededor de 4 dias, luego de conflicto por supuesta infidelidad, caracterizado por alteracion en el patron del sueño, a lo cual se fue agregando ideacion delirante de perjuicio y pobre respuesta al tx a base de Escitalopram y Olanzapina que utilizaba desde hace varios meses, por lo anterior es traida a este centro, donde previa evaluacion se decide su ingreso."}
                  />
                </div>
              </div>
            </div>
            <!--.antecedentes columna-->

            <div class="col-md-4 order-lg-12 order-sm-2">
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-history mdi-18px" />
                    </div>
                  </div>
                  Antecedentes <button class="btn btn-outline-primary btn-sm"><i class="mdi mdi-plus"></i> AGREGAR</button>
                </div>
                <div class="card-body">
                  <div class="atenciones-vnc mb-3">
                      {#each categoriasAntecedentes as categoria}
                        <!-- content here -->
                        <TarjetaAntecedentes
                          bind:id={categoria.id}
                          bind:nombre={categoria.nombre}
                          bind:paciente={paciente.antecedentes}
                        />
                      {/each}
                  </div>
                </div>
              </div>

              <div class="card m-b-30">
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
                          <a href="#">Metrocaps</a>
                        </li>
                        <li>
                          <a href="#">Albendazol</a>
                        </li>
                      </div>
                      <li class="defecto">
                        <a href="#"
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
              </div>
            </div>
            <!--.citas columna-->
          </div>
        </div>
      </div>
      <!--.pull-on-->
    </section>

    <ModalDatosPaciente {paciente} {edad} {seguro} />
  </section>
</main>

<style>
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
