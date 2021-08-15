<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { url, user } from "../../util/index";
  
    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ErrorConexion from '../../componentes/ErrorConexion.svelte';
    import NoConexion from "../../componentes/NoConexion.svelte";

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
    })
  
    let errorServer = false;
    let msgError = '';
    let empresa = {};
    let logo = '';
    let avatar;

    const cambiarImagenEmpresa = (e) => {
        let image = e.target.files[0];
        const form = new FormData();
        console.log(image)
        form.append('logo', image)
        const config = {
            method: 'put',
            url: `${url}/empresas/${user().empresa}/imagen`,
            data: form,
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
        .then(res => {
            if(res.status === 200){
                Toast.fire({
                    icon: 'success',
                    title: 'Se ha cambiado la imagen correctamente'
                });
                console.log(res.data)
                cargarEmpresa()
            }
        })
        .catch(err => {
            console.error(err)
        })
    }

    const editarEmpresa = () => {
        const data = {
            nombre: empresa.nombre,
            telefono: empresa.telefono,
            correo: empresa.correo,
            direccion: empresa.direccion,
            historiaGinecologica: empresa.historiaGinecologica,
            signosVitales: empresa.signosVitales,
            otrosParametros: empresa.otrosParametros,
            exploracionFisica: empresa.exploracionFisica,
        };
        const config = {
            method: 'put',
            url: `${url}/empresas/${user().empresa}`,
            data,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then(res => {
                if(res.status === 200){
                    Toast.fire({
                        icon: 'success',
                        title: 'Empresa actualizada'
                    });
                    console.log(res.data)
                    cargarEmpresa()
                }
            })
            .catch(err => {
                console.error(err)
            })
    }

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
            return logo = URL.createObjectURL(res.data)
        })
        .catch(err => {
            console.error(err)
        })
    }

    const cargarEmpresa = () => {
        const config = {
            method: 'get',
            url: `${url}/empresas/${user().empresa}`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        axios(config)
            .then(res => {
                empresa = res.data
                cargarImagenEmpresa(empresa.id, empresa.logo)
                console.log(res.data)
            })
            .catch(err => {
                console.error(err)
            })
    }
  
  
    onMount(() => {
        cargarEmpresa();
    });
  </script>
  
  <Aside />
  
  <main class="admin-main">
    <Header />
    <!-- <NoConexion/> -->
    <section class="admin-content">
        <button 
            type="button"
            class="btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success"
            style="position: fixed; bottom: 30px; right: 30px; z-index: 1000"
            on:click={editarEmpresa}
        >
            <i class="mdi mdi-content-save"></i>
        </button>
      <div class="p-2">
        <div class="col-12">
          <div class="row">
            <div class="col-12 m-b-20 m-t-20">
              <h5><i class="mdi mdi-medical-bag"></i> Consultorio</h5>
            </div>
            <div class="col-12">
                <div class="card m-b-30">
                    <div class="card-header">
                        <h4 class="card-title">
                            Informaci&oacute;n
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3">
                                <img src={logo} class="logo-emp" alt="logo empresa">
                                <div class="col-12 text-center mt-2">
                                    <label class="btn btn-primary btn-sm" for="inpSubirImagen">
                                        <i class="mdi mdi-refresh"></i> Cambiar imagen
                                    </label>
                                    <input style="display: none;" on:change={cambiarImagenEmpresa} type="file" id="inpSubirImagen" accept="image/png, image/jpeg">
                                </div>
                            </div>
                            <div class="col-lg-9">
                                <div class="row">
                                    <div class="col-lg-12">
                                        <div class="form-group">
                                            <label for="">Nombre consultorio</label>
                                            <input type="text" class="form-control" bind:value={empresa.nombre}>
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="form-group">
                                            <label for="">Telefono</label>
                                            <input type="tel" class="form-control" bind:value={empresa.telefono}>
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="form-group">
                                            <label for="">Correo</label>
                                            <input type="email" class="form-control" bind:value={empresa.correo}>
                                        </div>
                                    </div>
                                    <div class="col-lg-12">
                                        <div class="form-group">
                                            <label for="">Direccion</label>
                                            <input type="text" class="form-control" bind:value={empresa.direccion}>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 m-b-80">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">
                            Configuraci&oacute;n
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-4 mt-3">
                                <p>Formularios activos</p>
                                <hr>
                                <div class="row">
                                    <div class="col-12">
                                        <div class=" m-b-10">
                                            <label class="cstm-switch">
                                                <input type="checkbox" bind:checked={empresa.historiaGinecologica} name="option" value="1" class="cstm-switch-input">
                                                <span class="cstm-switch-indicator bg-success "></span>
                                                <span class="cstm-switch-description">Historia Ginecologica</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class=" m-b-10">
                                            <label class="cstm-switch">
                                                <input type="checkbox" bind:checked={empresa.signosVitales} name="option" value="1" class="cstm-switch-input">
                                                <span class="cstm-switch-indicator bg-success "></span>
                                                <span class="cstm-switch-description">Signos Vitales</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class=" m-b-10">
                                            <label class="cstm-switch">
                                                <input type="checkbox" bind:checked={empresa.otrosParametros} name="option" value="1" class="cstm-switch-input">
                                                <span class="cstm-switch-indicator bg-success "></span>
                                                <span class="cstm-switch-description">Otros Parametros</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class=" m-b-10">
                                            <label class="cstm-switch">
                                                <input type="checkbox" bind:checked={empresa.exploracionFisica} name="option" value="1" class="cstm-switch-input">
                                                <span class="cstm-switch-indicator bg-success "></span>
                                                <span class="cstm-switch-description">Exploraci&oacute;n Fisica</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
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
      .logo-emp{
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 10px;
      }
  </style>