<script>
    import axios from 'axios';
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import Select2 from '../../componentes/Select2.svelte';

    import { onMount } from 'svelte';
    import { url } from '../../util/index';

    let asegurado = false;
    let aseguradoras = []
    let aseguradora = "";

    function registrarPaciente(){
        const paciente = {
            consultorioId: "3c9f2025-2e85-4340-8c48-e10dd70f2510",
            nombre: "string",
            apellidos: "string",
            tipoIdentidad: "string",
            sexo: "string",
            cedula: "string",
            email: "string",
            celular: "string",
            telefono: "string",
            fechaNacimiento: "2021-05-22T13:19:40.984Z",
            apodo: "string",
            direccion: "string",
            ciudad: "string",
            aseguradoraId: "string",
            noAfiliado: "string",
            nacionalidad: "string",
            provinciaId: 0,
            municipioId: 0,
            ocupacion: "string",
            observaciones: "string",
            imagenCedula: "string",
            imagenSeguro: "string",
            createAt: "2021-05-22T13:19:40.984Z",
            createdBy: "string",
        };
        console.log('Registrando paciente')
    }

    function cargarAseguradoras() {
        console.log('cargando aseguradoras')
        const config = {
            method: 'get',
            url: `${url}/Aseguradoras`
        }
        axios(config).then((res) => {
            aseguradoras = res.data;
            console.log(aseguradoras)
        }).catch((err) => {
            console.error(err)
        })
    }

    onMount(() => {
        jQuery('.select-aseguradoras').select2({ placeholder: ' - seleccionar aseguradora - '});
        jQuery('.select-aseguradoras').on("select2:select", e => {
            console.log(e.params.data.id)
        });
        console.log('hola')
        cargarAseguradoras();
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
                                            required
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltSexo">Sexo</label>
                                        <select
                                            class="form-control"
                                            id="sltSexo"
                                            required
                                        >
                                            <option value="" selected disabled> - seleccionar sexo - </option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
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
                                        >
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltTipoDocumento">Tipo de documento</label>
                                        <select
                                            class="form-control"
                                            id="sltTipoDocumento"
                                            required
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
                                            required
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpTelefono">Telefono</label>
                                        <input
                                            type="tel"
                                            class="form-control"
                                            id="inpTelefono"
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
                                        />
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="inpCorreo">Correo electronico</label>
                                        <input
                                            type="email"
                                            class="form-control"
                                            id="inpCorreo"
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
                                        {aseguradora}
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
                                        >
                                            <option value="" selected disabled> - seleccionar ciudad - </option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltProvincia">Provincia</label>
                                        <select
                                            class="form-control"
                                            id="sltProvincia"
                                        >
                                            <option value="" selected disabled> - seleccionar provincia - </option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="sltMunicipio">Municipio</label>
                                        <select
                                            class="form-control"
                                            id="sltMunicipio"
                                        >
                                            <option value="" selected disabled> - seleccionar municipio - </option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="sltNacionalidad">Nacionalidad</label>
                                        <select
                                            class="form-control"
                                            id="sltNacionalidad"
                                        >
                                            <option value="" selected disabled> - seleccionar nacionalidad - </option>
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