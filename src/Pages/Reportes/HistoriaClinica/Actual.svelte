<script>
    import { onMount } from "svelte";
    import { url, user, calcularEdad } from "../../../util/index";
    import axios from 'axios';
    export let params;

    let errorServer = false;
    let paciente = {};
    let historia = {};
    let empresa = {};
    let estudios = [];
    let logo = '';
    let seguroMedico = '';
    let temperatura = {};
    let presionAlterial = {}
    let peso = {};
    let exploracionFisica = [];
    let antecedentes = [];
    let diagnosticos = [];
    let medicamentos = [];

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
                if(res.data.seguroMedico){
                    seguroMedico = res.data.seguroMedico[0];
                }
                antecedentes = res.data.antecedentes;
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
                temperatura = res.data.temperatura;
                presionAlterial = res.data.presionAlterial;
                peso = res.data.peso;
                exploracionFisica = res.data.exploracionFisica
                diagnosticos = res.data.diagnosticos;
                medicamentos = res.data.medicamentos;
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

    onMount(()=>{
        jQuery("html, body").animate({ scrollTop: 0 }, "slow");
        cargarPaciente()
        cargarHistoria()
        cargarEmpresa()
        document.title = "Consultorio Medico | Reporte"
    })
</script>
<div class="reporte">
    <button
        type="button"
        class="btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success btn-imprimir"
        on:click={()=> window.print()}
    >
        <i class="mdi mdi-printer"></i>
    </button>
    <header>
        <div class="logo-empresa">
            <img src={logo} alt="logo empresa">
        </div>
        <div class="datos-empresa">
            <p style="font-size: 1.4rem; text-transform:uppercase;"><strong>{empresa.nombre}</strong></p>
            <p>{empresa.direccion}</p>
            <p><strong>Tel.:</strong> {empresa.telefono} <strong>Email:</strong> {empresa.correo}</p>
            <p><strong>Fecha:</strong> {new Date(historia.fechaHora).toLocaleDateString('es-DO')}</p>
        </div>
    </header>
    <h2 class="title">Historia Clinica</h2>
    <section>
        <h3>Datos pacientes</h3>
        <div class="row">
            <div class="col-md-6 datos-paciente">
                <p><strong>Nombre: </strong>{paciente.nombres} {paciente.apellidos}</p>
                <p><strong>Cedula/Pasaporte: </strong>{paciente.cedula}</p>
                <p><strong>Edad: </strong>{calcularEdad(paciente.fechaNacimiento)} años</p>
                <p><strong>Sexo: </strong>{paciente.sexo}</p>
            </div>
            <div class="col-md-6 datos-paciente">
                <p><strong>Fecha Ingreso: </strong>{new Date(historia.fechaHora).toLocaleDateString('es-DO')}</p>
                <p><strong>Aseguradora: </strong>{seguroMedico.nombre}</p>
                <p><strong>No. Afiliado: </strong>{paciente.numeroSeguro}</p>
            </div>
        </div>
    </section>
    <section>
        <h3>Motivo de consulta</h3>
        <p>{historia.motivoConsulta}</p>
    </section>
    <section>
        <h3>Historia de la enfermedad</h3>
        <p>{historia.historiaEnfermedad}</p>
    </section>
    <section>
        <h3>Signos vitales</h3>
        <div class="row">
            <div class="col-md-3">
                <strong>TA:</strong> {presionAlterial.mm || 0}/{presionAlterial.Hg || 0} mm/hg
            </div>
            <div class="col-md-3">
                <strong>FC:</strong> {historia.frecuenciaCardiaca || 0} l/min
            </div>
            <div class="col-md-3">
                <strong>FR:</strong> {historia.frecuenciaRespiratoria || 0} r/min
            </div>
            <div class="col-md-3">
                <strong>T:</strong> {temperatura.valor || 0} °{temperatura.tipo || 'C'}
            </div>
        </div>
    </section>
    <section>
        <h3>Otros parametros</h3>
        <div class="row">
            <div class="col-md-3">
                <strong>Peso:</strong> {peso.valor || 0} {peso.tipo || 'Lb'}
            </div>
            <div class="col-md-3">
                <strong>SATO2:</strong> {historia.saturacionOxigeno || 0}%
            </div>
            <div class="col-md-3">
                <strong>Esc. Dolor:</strong> {historia.escalaDolor || 0} / 10
            </div>
            <div class="col-md-3">
                <strong>Esc. Glasgow:</strong> {historia.escalaGalsgow || 0} / 15
            </div>
            <div class="col-md-3 mt-2">
                <strong>Otros: </strong> {historia.otrosParametros}
            </div>
        </div>
    </section>
    <section>
        <h3>Examen Fisico</h3>
        <p>{historia.examenFisico || 'Sin hallazgos positivos'}</p>
    </section>
    <section>
        <h3>Exploracion Fisica</h3>
        <div class="exploracion">
            <div class="row">
                {#each exploracionFisica as item}
                     <!-- content here -->
                     {#if item.activo}
                          <!-- content here -->
                          <div class="col-md-6 mb-2">
                              <p><strong>{item.nombre}</strong></p>
                              <p>{item.text}</p>
                          </div>
                     {/if}
                     {:else}
                          <p>Sin hallazgos positivos</p>
                {/each}
            </div>
        </div>
    </section>
    <section>
        <h3>Antecedentes</h3>
        <div class="exploracion">
            <div class="row">
                {#each antecedentes as item}
                     <!-- content here -->
                     {#if item.activo}
                          <!-- content here -->
                          <div class="col-md-6 mb-2">
                              <p><strong>{item.nombre}</strong></p>
                              <p>{item.descripcion}</p>
                          </div>
                     {/if}
                     {:else}
                          <p>No tiene antecedentes</p>
                {/each}
            </div>
        </div>
    </section>
    <section>
        <h3>Diagnosticos</h3>
        <div class="exploracion">
            <div class="row">
                {#each diagnosticos as item}
                     <!-- content here -->
                          <!-- content here -->
                          <div class="col-md-6 mb-2">
                              <p><strong>{item.c}</strong> - {item.d} 
                                {#if item.comentario}
                                     <!-- content here -->
                                     ({item.comentario})
                                {/if}
                            </p>
                          </div>
                     {:else}
                          <p>No tiene antecedentes</p>
                {/each}
            </div>
        </div>
    </section>
    <section>
        <h3>Medicamentos</h3>
        <div class="exploracion">
            <div class="row">
                {#each medicamentos as item}
                    <div class="col-md-12 mb-2">
                        <p><strong>{item.concentracion}</strong> de: {item.nombre}, Cantidad: {item.cantidad} frecuencia: {item.frecuencia}</p>
                    </div>
                    {:else}
                        <p>No se indicaron medicamentos</p>
                {/each}
            </div>
        </div>
    </section>
    <section>
        <h3>Estudios</h3>
        <div class="exploracion">
            <div class="row">
                <p class="col-6"><strong>Estudios de Laboratorio</strong></p>
                {#each estudios as item}
                    {#if item.tipo === 'LAB'}
                         <!-- content here -->
                         <div class="col-md-12 mb-2">
                             <p>- {item.descripcion}</p>
                         </div>
                    {/if}
                    {:else}
                        <p>No se indicaron medicamentos</p>
                {/each}
                <p class="col-6"><strong>Estudios de Imagenes</strong></p>
                {#each estudios as item}
                    {#if item.tipo === 'IMG'}
                         <!-- content here -->
                         <div class="col-md-12 mb-2">
                             <p>- {item.descripcion}</p>
                         </div>
                    {/if}
                    {:else}
                        <p>No se indicaron medicamentos</p>
                {/each}
            </div>
        </div>
    </section>
    <div class="firma">
        <hr>
        <p>Firma del especialista</p>
        <p><strong>{user().title}. {user().name}</strong></p>
    </div>
</div>
<style>
.firma{
    width: 250px;
    margin: 0 auto;
    text-align: center;
    margin-top: 40px;
    margin-bottom: 40px;
}
.firma p{
    margin: 0;
}
section .exploracion p{
    margin: 0;
}
section{
    margin-top: 20px;
}
section h3{
    font-size: 1rem;
    text-transform: uppercase;
    font-weight: bold;
    border-bottom: 1px solid rgba(133, 149, 170, 0.40);
}
.datos-paciente p{
    margin: 0;
}
.btn-imprimir{
    position: fixed;
    right: 30px;
    bottom: 30px;
}
.title{
    text-transform: uppercase;
    font-size: 20px;
    text-align: center;
    margin-top: 10px;
}
header{
    display: flex;
    flex-direction: row;
    justify-content:space-between;
}
header .datos-empresa{
    text-align: right;
}
header .datos-empresa p{
    margin: 0;
}
header .logo-empresa img{
    height: 140px;
}
.reporte{
    width: 1000px;
    min-height: 1056px;
    background-color: white;
    margin: 0 auto;
    padding: 20px;
}
@media print{
    .reporte{
        width: 100%;
        height:1056px;
    }
    .btn-imprimir{
        display: none;
    }
}
</style>