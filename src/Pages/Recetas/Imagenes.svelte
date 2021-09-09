<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { calcularEdad, url, user } from "../../util/index";
  
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ErrorConexion from '../../componentes/ErrorConexion.svelte';

    export let params;

    let errorServer = false;
    let paciente = {};
    let historia = {};
    let empresa = {};
    let estudios = [];
    let logo = '';

    const cargarImagenEmpresa = (idConsultorio, idImagen) => {
        const config = {
            method: 'get',
            url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
            responseType:"blob", 
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
        .then(res => {
            logo = URL.createObjectURL(res.data)
            console.log(logo)
        })
        .catch(err => {
            console.error(err)
        })
    }

    const cargarPaciente = () => {
        const config = {
            method: 'get',
            url: `${url}/pacientes/${params.idPaciente}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
            .then(res => {
                paciente = res.data;
                console.log(paciente)
            })
    }

    const cargarHistoria = () => {
        const config = {
            method: 'get',
            url: `${url}/historias/${params.idHistoria}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
            .then(res => {
                historia = res.data;
                estudios = res.data.estudios;
                console.log(historia)
            })
    }

    const cargarEmpresa = () => {
        const config = {
            method: 'get',
            url: `${url}/empresas/${user().empresa}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
            .then(res => {
                empresa = res.data;
                cargarImagenEmpresa(empresa.id, empresa.logo)
                console.log(empresa)
            })
    }
  
    onMount(() => {
        jQuery("html, body").animate({ scrollTop: 0 }, "slow");
        cargarPaciente()
        cargarHistoria()
        cargarEmpresa()
        window.onafterprint = (event) => {
            location.reload()
        };
    });
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    {#if errorServer}
      <ErrorConexion msgError={'msgError'}/>
    {/if}
    <section class="admin-content ">
        <div class="bg-dark m-b-30">
            <div class="container">
                <div class="row p-b-60 p-t-60">

                    <div class="col-md-6 text-white p-b-30">
                        <div class="media">
                            <div class="avatar avatar mr-3">
                                <div class="avatar-title bg-success rounded-circle mdi mdi-receipt  ">

                                </div>
                            </div>
                            <div class="media-body">
                                <div class="opacity-75">Para:</div>
                                <h4 class="m-b-0">{paciente.nombres} {paciente.apellidos} </h4>
                                <p class="opacity-75">
                                    ID Consulta #{historia.id} <br>
                                    Fecha Consulta : {new Date(historia.createdAt).toLocaleDateString('es-DO')}
                                </p>
                                <button class="btn btn-white-translucent" id="printDiv"> <i class="mdi
                                mdi-printer"></i>
                                    Imprimir</button>
                            </div>
                        </div>

                    </div>
                    <!-- <div class="col-md-5 text-center m-b-30 ml-auto">
                        <div class="rounded text-white bg-white-translucent">
                            <div class="p-all-15">
                                <div class="row">
                                    <div class="col-md-6 my-2 m-md-0">
                                        <div class="text-overline    opacity-75">amount received</div>
                                        <h3 class="m-0 text-success">$1500</h3>
                                    </div>
                                    <div class="col-md-6 my-2 m-md-0">

                                        <div class="text-overline    opacity-75">amount pending</div>
                                        <h3 class="m-0 text-danger">$32,590</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> -->


                </div>
            </div>
        </div>
        <div class="pull-up">
            <div class="container" id="printableArea">
                <div class="row">
                    <div class="col-md-12 m-b-40">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <img src={logo} class="logo" alt="">
                                        <address class="m-t-10">
                                            <span class="h4 font-primary"> {empresa.nombre},</span> <br>
                                            {empresa.direccion} <br>
                                            Tel.: {empresa.telefono} <br>
                                            {empresa.correo} <br>


                                        </address>
                                    </div>
                                </div>
                                <div class="bg-light cabecera">
                                    <div>Estudios de imagenes</div>
                                </div>
                                <hr style="margin: 0">
                                <div class="col-12">
                                   <div class="row mt-3 mb-3 contenedor-estudios">
                                       {#each estudios as estudio}
                                           {#if estudio.tipo === 'IMG'}
                                               <div class="col-lg-3 mb-3 estudio">
                                                   {estudio.descripcion}
                                               </div>
                                           {/if}
                                       {/each}
                                   </div>
                                </div>
                                {#if historia.instrucciones}
                                <div class="bg-light pie">
                                    <div><strong>Observaciones:</strong> {historia.instrucciones}</div>
                                </div>
                                {/if}

                                <div class="row">
                                    <div class="col-md-6">

                                    </div>
                                    <div class="col-md-6 text-right my-auto">
                                        <h5 class="font-primary">{paciente.nombres} {paciente.apellidos}</h5>
                                        <div class="">Edad: {calcularEdad(paciente.fechaNacimiento)} años</div>
                                        <div class="">Fecha: {new Date().toLocaleDateString('es-DO')}</div>
                                    </div>
                                </div>
                                <div class="firma">
                                    <hr>
                                    <p>Firma del especialista</p>
                                </div>
                                <div class="p-t-10 p-b-20">

                                    <hr>
                                    <div class="text-center opacity-75">
                                        © nextcom {new Date().getFullYear()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>
  </main>
  <style>
    .logo{
          max-height: 150px !important;
      }
      .firma{
          margin: 0 auto;
          text-align: center;
          width: 200px;
          margin-top: 80px;
      }
      .cabecera, .pie{
          padding: 10px;
      }
      .cabecera{
          font-size: 1.1rem;
          font-weight: bold;
      }
      .pie{
          margin-bottom: 50px;
      }
      @media print{
        .contenedor-estudios{
            display: flex;
            flex-direction: row;
        }
        .estudio{
            width: 25%;
        }
        html, body{
            background-color: transparent !important;
        }
      }
  </style>