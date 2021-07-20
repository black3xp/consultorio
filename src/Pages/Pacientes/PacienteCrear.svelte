<script>
    import axios from 'axios';
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import Select2 from '../../componentes/Select2.svelte';
    
    import { push } from 'svelte-spa-router';
    import { onMount } from 'svelte';
    import { url, user } from '../../util/index';

    let asegurado = false;
    let aseguradoras = []
    let aseguradora = "";

    let nombres = '';
    let apellidos = '';
    let apodo = '';
    let sexo = '';
    let fechaNacimiento = '';
    let nacionalidad = '';
    let estadoCivil = '';
    let telefono = '';
    let celular = '';
    let cedula = '';
    let tipoDocumento = '';
    let religion = '';
    let ocupacion = '';
    let numeroSeguro = '';
    let ciudad = '';
    let provincia = '';
    let direccion = '';
    let email = '';
    let empresa = {};
    let responsables = [];
    let usuario = {};

    function registrarPaciente(){
        const paciente = {
            nombres:nombres,
            apellidos:apellidos,
            apodo:apodo,
            sexo:sexo,
            fechaNacimiento:new Date(fechaNacimiento),
            nacionalidad:nacionalidad,
            estadoCivil:estadoCivil,
            telefono:telefono,
            celular:celular,
            cedula:cedula,
            tipoDocumento:tipoDocumento,
            religion:religion,
            ocupacion:ocupacion,
            seguroMedico:aseguradoras.filter(x => x.id === aseguradora),
            numeroSeguro:numeroSeguro,
            ciudad:ciudad,
            provincia:provincia,
            direccion:direccion,
            email:email,
            empresa:empresa.id,
            responsables:responsables,
            usuario: usuario.id,
            antecedentes: []
        };
        const config = {
            method: 'post',
            url: `${url}/pacientes`,
            data: paciente,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config).then(res => {
            if(res.status === 200){
                console.log(res)
                push(`/pacientes/perfil/${res.data.id}`);
            }
        }).catch(error => {
            console.log(error)
        })
        console.log(paciente)
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

    const cargarUsuario = () => {
        const config = {
            method: 'get',
            url: `${url}/usuarios/${user().id}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }

        }
        axios(config)
            .then(res => {
                usuario = res.data;
                empresa = res.data.empresa;
                console.log(usuario)
                console.log(empresa)
            })
            .catch(err => {
                console.error(err)
            })
    }

    onMount(() => {
        jQuery('.select-aseguradoras').select2({ placeholder: ' - seleccionar aseguradora - '});
        jQuery('.select-aseguradoras').on("select2:select", e => {
            console.log(e.params.data.id)
        });
        cargarAseguradoras();
        cargarUsuario()
    })
</script>

<Aside />

<main class="admin-main">
  <Header />
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
                    <h3>Nuevo paciente</h3>
                </div>
            </div>
        </div>
    </div>
    <form on:submit|preventDefault={registrarPaciente}>
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
                                            bind:value={nombres}
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
                                            bind:value={apellidos}
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
                                            bind:value={apodo}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltSexo">Sexo</label>
                                        <select
                                            class="form-control"
                                            id="sltSexo"
                                            required
                                            bind:value={sexo}
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
                                            bind:value={tipoDocumento}
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
                                            bind:value={cedula}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpTelefono">Telefono</label>
                                        <input
                                            type="tel"
                                            class="form-control"
                                            id="inpTelefono"
                                            bind:value={telefono}
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
                                            bind:value={celular}
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpCorreo">Correo electronico</label>
                                        <input
                                            type="email"
                                            class="form-control"
                                            id="inpCorreo"
                                            bind:value={email}
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
                                            <Select2
                                                id={'sltAseguradoras'}
                                                datos={aseguradoras}
                                                bind:valor={aseguradora}
                                                placeholder={' - seleccionar aseguradora - '}
                                                label={'Aseguradora'}
                                            />
                                            </div>
                                            <div class="form-group col-md-6">
                                                <label for="inpNoAfiliado">No. Afiliado</label>
                                                <input
                                                    type="number"
                                                    class="form-control"
                                                    id="inpNoAfiliado"
                                                    bind:value={numeroSeguro}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                <h5 class="mt-3">Direccion</h5>
                                <hr>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="sltCiudad">Ciudad</label>
                                        <select
                                            class="form-control"
                                            id="sltCiudad"
                                            bind:value={ciudad}
                                        >
                                            <option value="" selected disabled> - seleccionar ciudad - </option>
                                            <option value="San Francisco de Macoris">San Francisco de Macoris</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltProvincia">Provincia</label>
                                        <select
                                            class="form-control"
                                            id="sltProvincia"
                                            bind:value={provincia}
                                        >
                                            <option value="" selected disabled> - seleccionar provincia - </option>
                                            <option value="Duarte">Duarte</option>
                                        </select>
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
                                        <label for="sltNacionalidad">Nacionalidad</label>
                                        <select
                                            class="form-control"
                                            id="sltNacionalidad"
                                            bind:value={nacionalidad}
                                        >
                                            <option value="" selected disabled> - seleccionar nacionalidad - </option>
                                            <option value="Dominicana">Dominicana</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-12">
                                        <label for="inpDireccion">Direccion</label>
                                        <input
                                            type="text" 
                                            class="form-control"
                                            id="inpDireccion"
                                            bind:value={direccion}
                                        >
                                    </div>
                                </div>
                                <div class="text-right">
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