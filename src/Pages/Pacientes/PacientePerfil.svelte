<script>
  import {fade} from 'svelte/transition';
  import Header from "../../Layout/Header.svelte";
  import Aside from "../../Layout/Aside.svelte";
  import Evoluciones from "../../componentes/Evoluciones.svelte";
  import UltimosVitales from "../../componentes/UltimosVitales.svelte";
  import Antecedente from "../../componentes/Antecedente.svelte";
  import CabeceraPerfil from "../../componentes/CabeceraPerfil.svelte";

  export let params = "";
</script>

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

<Aside />

<main class="admin-main" in:fade="{{duration: 300}}">
  <Header />
  <section class="admin-content">
    <section class="admin-content">
      <CabeceraPerfil />
      <div class="pull-up">
        <div class="col-md-12">
          <div class="row">
            <div class="col-lg-3">
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-comment-account-outline mdi-18px"></i>
                    </div>
                  </div>
                  Comentario
                </div>
                <div class="form-group col-lg-12">
                  <textarea class="form-control mt-2" style="width: 100%; display: block;"
                    id="exampleFormControlTextarea1" readonly="" rows="3" data-bind="value: paciente().comentario"
                    name="Comentario"></textarea>
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
                    <h5 class="m-b-0">
                        Archivos o Documentos
                    </h5>
                    <p class="m-b-0 mt-2 text-muted">
                        Puede subir documentos del paciente, como fotos de laboratorios, recetas entre otros.
                    </p>
                </div>
                <div class="card-body">


                    <form class="dropzone dz-clickable" action="/">
                        <div class="dz-message">
                            <h1 class="display-4">
                                <i class=" mdi mdi-progress-upload"></i>
                            </h1>
                            Puede arrastrar el documento a esta zona.<br>
                            <div class="p-t-5">
                                <a href="#" class="btn btn-lg btn-primary">Subir Archivo</a>

                            </div>
                        </div>
                    </form><br>

                    <div class="list-group list-group-flush ">

                        <div class="list-group-item d-flex  align-items-center">
                            <div class="m-r-20">
                                <div class="avatar avatar-sm ">
                                    <div class="avatar-title bg-dark rounded"><i
                                            class="mdi mdi-24px mdi-file-pdf"></i></div>
                                </div>
                            </div>
                            <div class="">
                                <div>SRS Document</div>
                                <div class="text-muted">25.5 Mb</div>
                            </div>

                            <div class="ml-auto">
                                <div class="dropdown">
                                    <a href="#" data-toggle="dropdown" aria-haspopup="true"
                                        aria-expanded="false"> <i class="mdi  mdi-dots-vertical mdi-18px"></i>
                                    </a>

                                    <div class="dropdown-menu dropdown-menu-right">
                                        <button class="dropdown-item" type="button">Action</button>
                                        <button class="dropdown-item" type="button">Another action</button>
                                        <button class="dropdown-item" type="button">Something else here</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="list-group-item d-flex  align-items-center">
                            <div class="m-r-20">
                                <div class="avatar avatar-sm ">
                                    <div class="avatar-title bg-dark rounded"><i
                                            class="mdi mdi-24px mdi-file-document-box"></i></div>
                                </div>
                            </div>
                            <div class="">
                                <div>Design Guide.pdf</div>
                                <div class="text-muted">9 Mb</div>
                            </div>

                            <div class="ml-auto">
                                <div class="dropdown">
                                    <a href="#" data-toggle="dropdown" aria-haspopup="true"
                                        aria-expanded="false"> <i class="mdi  mdi-dots-vertical mdi-18px"></i>
                                    </a>

                                    <div class="dropdown-menu dropdown-menu-right">
                                        <button class="dropdown-item" type="button">Action</button>
                                        <button class="dropdown-item" type="button">Another action</button>
                                        <button class="dropdown-item" type="button">Something else here</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            </div>


            <div class="col-md-5">
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-progress-check mdi-18px"></i>
                    </div>
                  </div>
                  Historial atenciones
                </div>
                <div class="card-body">
                  <Evoluciones 
                    motivo={'Conducta desorganizada - Alteracion del patron del sueño - Pobre respuesta al tx'}
                    historia={'Refiere el informante (esposo) que el cuadro actual inicia hace alrededor de 4 dias, luego de conflicto por supuesta infidelidad, caracterizado por alteracion en el patron del sueño, a lo cual se fue agregando ideacion delirante de perjuicio y pobre respuesta al tx a base de Escitalopram y Olanzapina que utilizaba desde hace varios meses, por lo anterior es traida a este centro, donde previa evaluacion se decide su ingreso.'}
                  />
                </div>
              </div>

            </div>
            <!--.antecedentes columna-->

            <div class="col-md-4">
              <div class="card m-b-30">
                <div class="card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-history mdi-18px"></i>
                    </div>
                  </div>
                  Antecedentes
                </div>
              </div>

              <div class="atenciones-vnc">
                <div>
                  <Antecedente
                    descripcionAntecedente={"Ibuprofeno y otros medicamentos que contengan este mismo componente"}
                    tipoAntecedente={"Alergia"}
                  />
                </div>
                <a href="/" class="btn mb-3 btn-primary btn-sm btn-block">ver todos los antecedentes</a>
              </div>
              <div class="card m-b-30">
                <div class=" card-header">
                  <div class="avatar mr-2 avatar-xs">
                    <div class="avatar-title bg-dark rounded-circle">
                      <i class="mdi mdi-comment-account-outline mdi-18px"></i>
                    </div>
                  </div>
                  Medicamentos en uso
                </div>

                <div class="col-12">
                  <div class="form-group buscardor dropdown">
                    <input type="text" class="form-control" name="" id="" data-toggle="dropdown" aria-haspopup="true"
                      aria-expanded="false">
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
                        <a href="#"><i class="mdi mdi-plus"></i> Agregar manualmente</a>
                      </li>
                    </ul>
                  </div>
                  <div class="alert alert-secondary alert-dismissible fade show" role="alert">
                    AirPlus
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
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

    <form class="form-group floating-label">
    <datos-paciente params="data: paciente">
      <div class="modal fade modal-slide-right" id="modalDatosPersonales" tabindex="-1" role="dialog"
        aria-labelledby="modalDatosPersonales" style="display: none; padding-right: 16px;" aria-modal="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modalDatosPersonales">Datos de paciente</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div class="modal-body">

              <div class="text-center">
                <div>
                  <div class="avatar avatar-xl">
                    <img class="avatar-img rounded-circle" src="assets/img/placeholder.svg"
                      alt="imagen paciente">
                  </div>
                </div>
                <h3 class="p-t-10 searchBy-name">
                  <a
                    href="/Expediente/Perfil/1">Fiordaliza De Jesus Herrera</a>
                </h3>
                <div class="text-muted text-center m-b-10" data-bind="text: paciente().correo">fiordaliza@gmail.com</div>
                <div class="m-auto">
                  <span class="badge badge-primary">Ultima vez modificado <span
                      data-bind="text: paciente().ultimaModificacion">18/5/2020 4:24:46 p.&nbsp;m.</span></span>
                </div>
              </div>
              <hr>
                <div class="form-row">
                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <sapn class="text-primary">Cedula / pasaporte</sapn>
                      <strong class="d-block" data-bind="text: paciente().cedula">05600180675</strong>
                      <!-- <input type="text" data-bind="value: paciente().cedula" readonly class="form-control"
                                            id="inpCedula"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-12">
                    <div class=" bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Nombres</span>
                      <strong class="d-block" data-bind="text: paciente().nombres">Fiordaliza</strong>
                      <!-- <input type="text" data-bind="value: paciente().nombres" readonly class="form-control"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Primer Apellido</span>
                      <strong class="d-block" data-bind="text: paciente().primerApellido">De Jesus</strong>
                      <!-- <input type="text" class="form-control" data-bind="value: paciente().primerApellido" readonly
                                            id="inpPrimerApellido"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Segundo Apellido</span>
                      <strong class="d-block" data-bind="text: paciente().segundoApellido">Herrera</strong>
                      <!-- <input type="text" class="form-control" data-bind="value: paciente().segundoApellido" readonly
                                            id="inpSegundoApellido"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Sexo</span>
                      <strong class="d-block" data-bind="text: paciente().sexo">Femenino</strong>
                      <!-- <input type="text" class="form-control" readonly id="inpSexo" data-bind="value: paciente().sexo"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Edad</span>
                      <strong class="d-block" data-bind="text: paciente().edad">49 años</strong>
                      <!-- <input type="text" class="form-control" readonly id="inpSexo" data-bind="value: paciente().sexo"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Estado Civil</span>
                      <strong class="d-block" data-bind="text: paciente().estadoCivil">Casado</strong>
                      <!-- <input type="text" class="form-control" readonly 
                                            data-bind="value: paciente().estadoCivil"> -->
                    </div>
                  </div>

                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Fecha Nacimiento</span>
                      <strong class="d-block" data-bind="text: paciente().fechaNacimiento">1971-07-30T00:00:00</strong>
                      <!-- <input type="text" class="form-control" readonly 
                                            data-bind="value: paciente().fechaNacimiento"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6">
                    <div class=" bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Telefono</span>
                      <strong class="d-block" data-bind="text: paciente().telefono">(809) 588-2020</strong>
                      <!-- <input type="text" class="form-control" readonly id="inpTelefono"
                                            data-bind="value: paciente().telefono"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Celular</span>
                      <strong class="d-block" data-bind="text: paciente().celular">(809) 224-1582</strong>
                      <!-- <input type="text" class="form-control" readonly id="inpCelular"
                                                data-bind="value: paciente().celular"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Seguro Medico</span>
                      <strong class="d-block" data-bind="text: paciente().nombreAseguradora">SENASA</strong>
                      <!-- <input type="text" class="form-control" readonly 
                                                                                data-bind="value: paciente().nomreAseguradora"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Poliza</span>
                      <strong class="d-block" data-bind="text: paciente().poliza">079183927</strong>
                      <!-- <input type="text" class="form-control" readonly 
                                            data-bind="value: paciente().poliza"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">NSS</span>
                      <strong class="d-block" data-bind="text: paciente().nss">--</strong>
                      <!-- <input type="text" class="form-control" readonly 
                                            data-bind="value: paciente().poliza"> -->
                    </div>
                  </div>
                </div>
                <p class="mt-3"><b>Datos demográficos</b></p>
                <hr>
                <div class="form-row">
                  <div class="form-group col-md-12 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span for="inpDireccion" class="text-primary">Dirección</span>
                      <strong class="d-block" data-bind="text: paciente().direccion">Pimentel</strong>
                      <!-- <input type="text" class="form-control" readonly
                                            data-bind="value: paciente().direccion">  -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Ciudad</span>
                      <strong class="d-block" data-bind="text: paciente().ciudad">SFM</strong>
                      <!-- <input type="text" class="form-control" readonly data-bind="value: paciente().ciudad"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span for="inpPais" class="text-primary">Pais</span>
                      <strong class="d-block" data-bind="text: paciente().pais">República Dominicana</strong>
                      <!-- <input type="text" class="form-control" readonly id="inpDireccion"
                                            data-bind="value: paciente().pais"> -->
                    </div>
                  </div>
                  <div class="form-group col-md-6 ">
                    <div class="bg-gray-100 p-2 rounded-sm">
                      <span class="text-primary">Provincia</span>
                      <strong class="d-block" data-bind="text: paciente().provincia">Duarte</strong>
                      <!-- <input type="text" class="form-control" readonly
                                            data-bind="value: paciente().provincia"> -->
                    </div>
                  </div>
                </div>

                
              </div>
              <div class="modal-footer">
                <div class="row text-center p-b-10">
                  <div class="col">
                    <a href="#!" class="text-danger" data-dismiss="modal">
                      <h3 class="mdi mdi-close-outline"></h3>
                      <div class="text-overline">Cerrar</div>
                    </a>
                  </div>
                  <div class="col">
                    <a
                    href="/Contacto/Editar/1">
                    <h3 class="mdi mdi-account-edit"></h3>
                    <div class="text-overline">Editar</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </datos-paciente>
  </form>

  </section>
</main>

