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
    let medicamentos = [];
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
                medicamentos = res.data.medicamentos
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
                                            {empresa.especialidades || ''} <br>
                                            {empresa.direccion} <br>
                                            Tel.: {empresa.telefono} <br>
                                            {empresa.correo} <br>


                                        </address>
                                    </div>
                                </div>
                                <div class="bg-light cabecera">
                                    <div>Estudios de laboratorios</div>
                                </div>
                                <hr style="margin: 0">
                                <div class="col-12">
                                   <div class="row mt-3 mb-3 contenedor-estudios">
                                       {#each estudios as estudio}
                                           {#if estudio.tipo === 'LAB'}
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
                                    <p><strong>{user().title}. {user().name}</strong></p>
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

                <div class="saltopagina"></div>

                <div class="row">
                    <div class="col-md-12 m-b-40">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <img src={logo} class="logo" alt="">
                                        <address class="m-t-10">
                                            <span class="h4 font-primary"> {empresa.nombre},</span> <br>
                                            {empresa.especialidades || ''} <br>
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
                                    <p><strong>{user().title}. {user().name}</strong></p>
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

                <div class="saltopagina"></div>

                <div class="row">
                    <div class="col-md-12 m-b-40">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <img src={logo} class="logo" alt="">
                                        <address class="m-t-10">
                                            <span class="h4 font-primary"> {empresa.nombre},</span> <br>
                                            {empresa.especialidades || ''} <br>
                                            {empresa.direccion} <br>
                                            Tel.: {empresa.telefono} <br>
                                            {empresa.correo} <br>


                                        </address>
                                    </div>
                                </div>
                                <div class="bg-light cabecera">
                                    <div>Receta</div>
                                </div>
                                <hr style="margin: 0">
                                <div class="table-responsive ">
                                    <table class="table m-t-50">
                                        <thead>
                                        <tr>
                                            <th class="">Medicamento</th>
                                            <th class="text-center">Cantidad</th>
                                            <th class="text-center">Frecuencia</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {#each medicamentos as medicamento}
                                            <tr>
                                                <td class="">
                                                    <p class="text-black m-0">{medicamento.nombre}</p>
                                                    <p class="text-muted" style="padding-bottom: 0; margin-bottom: 0;">
                                                        De {medicamento.concentracion}
                                                    </p>
                                                </td>
                                                <td class="text-center">{medicamento.cantidad}</td>
                                                <td class="text-center">{medicamento.frecuencia}</td>
                                            </tr>
                                        {/each}
                                        </tbody>
                                    </table>
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
                                    <p><strong>{user().title}. {user().name}</strong></p>
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
@media all {
    div.saltopagina{
        display: none;
    }
}
        
@media print{
    div.saltopagina{
        display:block;
        page-break-before:always;
    }
}
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