<script>
    import axios from 'axios';
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import Select2 from '../../componentes/Select2.svelte';
    import Loading from '../../componentes/Loading.svelte';
    import ErrorConexion from '../../componentes/ErrorConexion.svelte';
    
    import { push, link } from 'svelte-spa-router';
    import { onMount } from 'svelte';
    import { url, user, ciudades, provincias, nacionalidades } from '../../util/index';

    export let params;

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    let asegurado = false;
    let aseguradoras = []
    let aseguradora = "";
    let usuario = {};
    let paciente = {};
    let fechaNacimiento = '';
    let cargando = false;
    let msgError = '';

    const cargarPaciente = async ()=> {
        const config = {
            method: 'get',
            url: `${url}/pacientes/${params.idPaciente}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        };
        try {
            let promesa = await axios(config)
            paciente = promesa.data;
            fechaNacimiento = promesa.data.fechaNacimiento.split('T')[0];
            if(promesa.data.seguroMedico[0]){
                asegurado = true;
                aseguradora = promesa.data.seguroMedico[0].id;
            }
            console.log(promesa.data)
        } catch (error) {
            
        }
    };


    const actualizarPaciente = () => {
        msgError = '';
        cargando = true;
        const data = {
            nombres:paciente.nombres,
            apellidos:paciente.apellidos,
            apodo:paciente.apodo,
            sexo:paciente.sexo,
            fechaNacimiento:new Date(fechaNacimiento),
            nacionalidad:paciente.nacionalidad,
            estadoCivil:paciente.estadoCivil,
            telefono:paciente.telefono,
            celular:paciente.celular,
            cedula:paciente.cedula,
            tipoDocumento:paciente.tipoDocumento,
            religion:paciente.religion,
            ocupacion:paciente.ocupacion,
            seguroMedico:aseguradoras.filter(x => x.id === aseguradora),
            numeroSeguro:paciente.numeroSeguro,
            ciudad:paciente.ciudad,
            provincia:paciente.provincia,
            direccion:paciente.direccion,
            email:paciente.email,
            responsables:paciente.responsables,
        };
        const config = {
            method: 'put',
            url: `${url}/pacientes/${params.idPaciente}`,
            data,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config).then(res => {
            cargando = false;
            if(res.status === 200){
                Toast.fire({
                    icon: 'success',
                    title: 'Se actualizo el paciente'
                })
            }
        }).catch(error => {
            cargando = false;
            msgError = 'Ocurrio un error, intentelo mas tarde.';
            console.log(error)
        })
    }

    function cargarAseguradoras() {
        console.log('cargando aseguradoras')
        const config = {
            method: 'get',
            url: `${url}/Aseguradoras`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config).then((res) => {
            aseguradoras = res.data;
            console.log(aseguradoras)
        }).catch((err) => {
            console.error(err)
        })
    }

    onMount(async() => {
        await cargarPaciente();
        cargarAseguradoras();
    })
</script>

<Aside />

<main class="admin-main">
  <Header />
  {#if msgError}
       <ErrorConexion {msgError}/>
  {/if}
  {#if cargando}
    <div class="cargando">
        <Loading/>
    </div>
  {/if}
  <section class="admin-content ">
    <div class="bg-dark bg-dots m-b-30">
        <div class="container">
            <div class="row p-b-60 p-t-60">
                <div class="col-lg-8 text-center mx-auto text-white p-b-30">
                    <div class="m-b-10">
                        <div class="avatar avatar-lg ">
                            <div class="avatar-title bg-info rounded-circle mdi mdi-account-circle-outline"></div>
                        </div>
                    </div>
                    <h3>{paciente.nombres} {paciente.apellidos}</h3>
                </div>
            </div>
        </div>
    </div>
    <form on:submit|preventDefault={actualizarPaciente}>
        <section class="pull-up">
            <div class="container">
                <div class="row ">
                    <div class="col-lg-8 mx-auto  mt-2">
                       <div class="card py-3 m-b-30">
                           <div class="card-body">
                                <h5 class="">Datos personales</h5>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="inpNombre">Nombre</label>
                                        <input
                                            type="text"
                                            class="form-control"
                                            id="inpNombre"
                                            placeholder="John"
                                            required
                                            bind:value={paciente.nombres}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpApellido">Apellidos</label>
                                        <input
                                            type="text"
                                            id="inpApellido"
                                            class="form-control"
                                            placeholder="Doe"
                                            required
                                            bind:value={paciente.apellidos}
                                        />
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="inpApodo">Apodo</label>
                                        <input
                                            type="text"
                                            class="form-control"
                                            id="inpApodo"
                                            bind:value={paciente.apodo}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltSexo">Sexo</label>
                                        <select
                                            class="form-control"
                                            id="sltSexo"
                                            required
                                            bind:value={paciente.sexo}
                                        >
                                            <option value="" selected disabled> - seleccionar sexo - </option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="inpFechaNacimiento">Fecha de nacimiento</label>
                                        <input
                                            type="date"
                                            class="form-control"
                                            id="inpFechaNacimiento"
                                            required
                                            bind:value={fechaNacimiento}
                                        >
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltTipoDocumento">Tipo de documento</label>
                                        <select
                                            class="form-control"
                                            id="sltTipoDocumento"
                                            required
                                            bind:value={paciente.tipoDocumento}
                                        >
                                            <option value="" selected disabled> - seleccionar tipo - </option>
                                            <option value="C">Cedula</option>
                                            <option value="P">Pasaporte</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="inpNumeroDocumento">No. Cedula / Pasaporte</label>
                                        <input 
                                            type="number"
                                            class="form-control"
                                            id="inpNumeroDocumento"
                                            bind:value={paciente.cedula}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpTelefono">Telefono</label>
                                        <input
                                            type="tel"
                                            class="form-control"
                                            id="inpTelefono"
                                            bind:value={paciente.telefono}
                                        />
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="inpCelular">Celular</label>
                                        <input
                                            type="tel"
                                            class="form-control"
                                            id="inpCelular"
                                            bind:value={paciente.celular}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpCorreo">Correo electronico</label>
                                        <input
                                            type="email"
                                            class="form-control"
                                            id="inpCorreo"
                                            bind:value={paciente.email}
                                        />
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class=" m-b-10">
                                        <label class="cstm-switch">
                                            <input type="checkbox" bind:checked={asegurado} name="option" value="1" class="cstm-switch-input">
                                            <span class="cstm-switch-indicator bg-success "></span>
                                            <span class="cstm-switch-description">El paciente es asegurado</span>
                                        </label>
                                    </div>
                                </div>
                                    <div class={!asegurado ? 'hidden seguro animate__animated animate__bounceIn' : 'show seguro animate__animated animate__bounceIn'}>
                                        <h5>Informacion de seguro</h5>
                                        <hr>
                                        <div class="form-row">
                                            <div class="form-group col-md-6">
                                                <label for="">Aseguradora</label>
                                                <select bind:value={aseguradora} class="form-control">
                                                    {#each aseguradoras as item}
                                                         <option value={item.id}>{item.nombre}</option>
                                                    {/each}
                                                </select>
                                            <!-- <Select2
                                                id={'sltAseguradoras'}
                                                datos={aseguradoras}
                                                bind:valor={aseguradora}
                                                placeholder={' - seleccionar aseguradora - '}
                                                label={'Aseguradora'}
                                            /> -->
                                            </div>
                                            <div class="form-group col-md-6">
                                                <label for="inpNoAfiliado">No. Afiliado</label>
                                                <input
                                                    type="number"
                                                    class="form-control"
                                                    id="inpNoAfiliado"
                                                    bind:value={paciente.numeroSeguro}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                <h5 class="mt-3">Direccion</h5>
                                <hr>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="">Ciudad</label>
                                        <select bind:value={paciente.ciudad} class="form-control">
                                            {#each ciudades as item}
                                                 <option value={item.id}>{item.nombre}</option>
                                            {/each}
                                        </select>
                                        <!-- <Select2
                                                id={'sltCiudad'}
                                                datos={ciudades}
                                                bind:valor={paciente.ciudad}
                                                placeholder={' - seleccionar ciudad - '}
                                                label={'Ciudad'}
                                            /> -->
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="">Provincia</label>
                                        <select bind:value={paciente.provincia} class="form-control">
                                            {#each provincias as item}
                                                 <option value={item.id}>{item.nombre}</option>
                                            {/each}
                                        </select>
                                        <!-- <Select2
                                            id={'sltProvincia'}
                                            datos={provincias}
                                            bind:valor={paciente.provincia}
                                            placeholder={' - seleccionar provincia - '}
                                            label={'Provincia'}
                                        /> -->
                                    </div>
                                </div>
                                <div class="form-row">
                                    <!-- <div class="form-group col-md-6">
                                        <label for="sltMunicipio">Municipio</label>
                                        <select
                                            class="form-control"
                                            id="sltMunicipio"
                                        >
                                            <option value="" selected disabled> - seleccionar municipio - </option>
                                        </select>
                                    </div> -->
                                    <div class="form-group col-md-6">
                                        <label for="">Nacionalidad</label>
                                        <select bind:value={paciente.nacionalidad} class="form-control">
                                            {#each nacionalidades as item}
                                                 <option value={item.id}>{item.nombre}</option>
                                            {/each}
                                        </select>
                                        <!-- <Select2
                                            id={'sltNacionalidad'}
                                            datos={nacionalidades}
                                            bind:valor={paciente.nacionalidad}
                                            placeholder={' - seleccionar nacionalidad - '}
                                            label={'Nacionalidad'}
                                        /> -->
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-12">
                                        <label for="inpDireccion">Direccion</label>
                                        <input
                                            type="text" 
                                            class="form-control"
                                            id="inpDireccion"
                                            bind:value={paciente.direccion}
                                        >
                                    </div>
                                </div>
                                <div class="text-right">
                                    <a href={`/pacientes/perfil/${params.idPaciente}`} class="btn btn-primary btn-cta" use:link>
                                        Ir al perfil
                                    </a>
                                    <button type="submit" class="btn btn-success btn-cta">Guardar</button>
                                </div>
                           </div>
                       </div>
                    </div>
    
                </div>
            </div>
    
        </section>
    </form>
</section>
</main>