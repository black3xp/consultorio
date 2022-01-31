<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { url, user } from "../../util/index";

    import Header from "../../Layout/Header.svelte";
    import Aside from "../../Layout/Aside.svelte";
    import ErrorConexion from "../../componentes/ErrorConexion.svelte";
    import NoConexion from "../../componentes/NoConexion.svelte";
    import Loading from "../../componentes/Loading.svelte";
import ModalAgregarHorario from "../../componentes/Modals/ModalAgregarHorario.svelte";

    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
    });

    let errorServer = false;
    let serverConexion = false;
    let msgError = "";
    let empresa = {};
    let logo = "";
    let avatar;
    let cargando = false;
    const dia = {
        0: 'Lunes',
        1: 'Martes',
        2: 'Miercoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sabado',
        6: 'Domingo'
    }
    let horarios = [];

    const eliminarHorario = (idHorario) => {
        const config = {
            method: 'delete',
            url: `${url}/horarioscitas/${idHorario}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        Swal.fire({
            title: 'Estas seguro?',
            text: "El horario se va a eliminar definitivamente, pero puedes volver a agregarlo con los cambios que desees!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                axios(config)
                    .then(res => {
                        if(res.status === 200) {
                            Toast.fire({
                                icon: 'success',
                                title: 'Se ha eliminado el horario'
                            })
                            cargarHorariosCitas()
                        }
                    })
                    .catch(err => {
                        console.error(err)
                    })
            }
        })
    }

    const cargarHorariosCitas = () => {
        const config = {
            method: 'get',
            url: `${url}/horarioscitas`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then(res => {
                horarios = res.data
            })
            .catch(err =>{
                console.error(err)
            })
    };

    const cambiarImagenEmpresa = (e) => {
        let image = e.target.files[0];
        const form = new FormData();
        form.append("logo", image);
        const config = {
            method: "put",
            url: `${url}/empresas/${user().empresa}/imagen`,
            data: form,
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                if (res.status === 200) {
                    Toast.fire({
                        icon: "success",
                        title: "Se ha cambiado la imagen correctamente",
                    });
                    cargarEmpresa();
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const editarEmpresa = () => {
        const data = {
            nombre: empresa.nombre,
            especialidades: empresa.especialidades,
            telefono: empresa.telefono,
            correo: empresa.correo,
            direccion: empresa.direccion,
            historiaGinecologica: empresa.historiaGinecologica,
            signosVitales: empresa.signosVitales,
            otrosParametros: empresa.otrosParametros,
            exploracionFisica: empresa.exploracionFisica,
            estudiosCheck: empresa.estudiosCheck,
            examenExtraOral: empresa.examenExtraOral,
            examenIntraOral: empresa.examenIntraOral,
            shortAntecedentes: empresa.shortAntecedentes,
        };
        const config = {
            method: "put",
            url: `${url}/empresas/${user().empresa}`,
            data,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                if (res.status === 200) {
                    Toast.fire({
                        icon: "success",
                        title: "Empresa actualizada",
                    });
                    cargarEmpresa();
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const cargarImagenEmpresa = (idConsultorio, idImagen) => {
        const config = {
            method: "get",
            url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
            responseType: "blob",
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                return (logo = URL.createObjectURL(res.data));
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const cargarEmpresa = () => {
        cargando = true;
        const config = {
            method: "get",
            url: `${url}/empresas/${user().empresa}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                cargando = false;
                if (res.status === 200) {
                    empresa = res.data;
                    cargarImagenEmpresa(empresa.id, empresa.logo);
                } else {
                    serverConexion = true;
                }
            })
            .catch((err) => {
                cargando = false;
                serverConexion = true;
                console.error(err);
            });
    };

    onMount(() => {
        cargarEmpresa();
        cargarHorariosCitas()
    });
</script>

<Aside />

<main class="admin-main">
    <Header />
    {#if serverConexion}
        <NoConexion />
    {/if}
    {#if cargando}
        <div class="cargando">
            <Loading />
        </div>
    {/if}
    <section class="admin-content">
        <button
            type="button"
            class="btn m-b-15 ml-2 mr-2 btn-lg btn-rounded-circle btn-success"
            style="position: fixed; bottom: 30px; right: 30px; z-index: 1000"
            on:click={editarEmpresa}
        >
            <i class="mdi mdi-content-save" />
        </button>
        <div class="p-2">
            <div class="col-12">
                <div class="row">
                    <div class="col-12 m-b-20 m-t-20">
                        <h5><i class="mdi mdi-medical-bag" /> Consultorio</h5>
                    </div>
                    <div class="col-12">
                        <div class="card m-b-30">
                            <div class="card-header">
                                <h4 class="card-title">Informaci&oacute;n</h4>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-lg-3">
                                        <img
                                            src={logo}
                                            class="logo-emp"
                                            alt="logo empresa"
                                        />
                                        <div class="col-12 text-center mt-2">
                                            <label
                                                class="btn btn-primary btn-sm"
                                                for="inpSubirImagen"
                                            >
                                                <i class="mdi mdi-refresh" /> Cambiar
                                                imagen
                                            </label>
                                            <input
                                                style="display: none;"
                                                on:change={cambiarImagenEmpresa}
                                                type="file"
                                                id="inpSubirImagen"
                                                accept="image/png, image/jpeg"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-lg-9">
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div class="form-group">
                                                    <label for=""
                                                        >Nombre consultorio</label
                                                    >
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        bind:value={empresa.nombre}
                                                    />
                                                </div>
                                            </div>
                                            <div class="col-lg-12">
                                                <div class="form-group">
                                                    <label for=""
                                                        >Especialidades</label
                                                    >
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        bind:value={empresa.especialidades}
                                                    />
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <label for=""
                                                        >Telefono</label
                                                    >
                                                    <input
                                                        type="tel"
                                                        class="form-control"
                                                        bind:value={empresa.telefono}
                                                    />
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <label for="">Correo</label>
                                                    <input
                                                        type="email"
                                                        class="form-control"
                                                        bind:value={empresa.correo}
                                                    />
                                                </div>
                                            </div>
                                            <div class="col-lg-12">
                                                <div class="form-group">
                                                    <label for=""
                                                        >Direccion</label
                                                    >
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        bind:value={empresa.direccion}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div class="card m-b-30">
                            <div class="card-header">
                                <div class="card-title">
                                    <strong>Configurci&oacute;n</strong>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-3">
                                        <div
                                            class="nav flex-column nav-pills"
                                            id="v-pills-tab"
                                            role="tablist"
                                            aria-orientation="vertical"
                                        >
                                            <a
                                                class="nav-link active"
                                                id="v-pills-profile-tab"
                                                data-toggle="pill"
                                                href="#v-pills-profile"
                                                role="tab"
                                                aria-controls="v-pills-profile"
                                                aria-selected="false"
                                                ><i
                                                    class="mdi mdi-calendar-plus"
                                                /> Horarios de citas</a
                                            >
                                            <a
                                                class="nav-link"
                                                id="v-pills-home-tab"
                                                data-toggle="pill"
                                                href="#v-pills-home"
                                                role="tab"
                                                aria-controls="v-pills-home"
                                                aria-selected="true"
                                                ><i
                                                    class="mdi mdi-square-edit-outline"
                                                /> Historia Clinica</a
                                            >
                                            <!-- <a
                                                class="nav-link"
                                                id="v-pills-messages-tab"
                                                data-toggle="pill"
                                                href="#v-pills-messages"
                                                role="tab"
                                                aria-controls="v-pills-messages"
                                                aria-selected="false"
                                                >Messages</a
                                            >
                                            <a
                                                class="nav-link"
                                                id="v-pills-settings-tab"
                                                data-toggle="pill"
                                                href="#v-pills-settings"
                                                role="tab"
                                                aria-controls="v-pills-settings"
                                                aria-selected="false"
                                                >Settings</a
                                            > -->
                                        </div>
                                    </div>
                                    <div class="col-9">
                                        <div
                                            class="tab-content"
                                            id="v-pills-tabContent"
                                        >
                                            <div
                                                class="tab-pane fade"
                                                id="v-pills-home"
                                                role="tabpanel"
                                                aria-labelledby="v-pills-home-tab"
                                            >
                                                <div class="row">
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.historiaGinecologica}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Historia
                                                                    Ginecologica</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.signosVitales}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Signos
                                                                    Vitales</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.otrosParametros}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Otros
                                                                    Parametros</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.exploracionFisica}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Exploraci&oacute;n
                                                                    Fisica</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.estudiosCheck}
                                                                    name="option"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Estudios Para Seleccion Rapida</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.examenIntraOral}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Examen Intra-Oral</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.examenExtraOral}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Examen Extra-Oral</span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-12">
                                                        <div class=" m-b-10">
                                                            <label
                                                                class="cstm-switch"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    bind:checked={empresa.shortAntecedentes}
                                                                    name="option"
                                                                    value="1"
                                                                    class="cstm-switch-input"
                                                                />
                                                                <span
                                                                    class="cstm-switch-indicator bg-success "
                                                                />
                                                                <span
                                                                    class="cstm-switch-description"
                                                                    >Antecedentes Rapidos En Historial Clínico </span
                                                                >
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                class="tab-pane fade show active"
                                                id="v-pills-profile"
                                                role="tabpanel"
                                                aria-labelledby="v-pills-profile-tab"
                                            >
                                                <div class="col-lg-12 mt-3">
                                                    <div class="row">
                                                        <div class="col-12 text-right">
                                                            <button
                                                                class="btn btn-outline-primary btn-sm mb-2"
                                                                data-toggle="modal"
                                                                data-target="#modalAgregarHorario"
                                                            ><i class="mdi mdi-plus"></i> AGREGAR HORARIO</button>
                                                        </div>
                                                    </div>
                                                    <div class="table-responsive">
                                                        <table class="table table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Dia</th>
                                                                    <th>Tanda</th>
                                                                    <th>Cupos</th>
                                                                    <th></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {#each horarios as horario}
                                                                     <tr>
                                                                         <td>{dia[horario.dia]}</td>
                                                                         <td>{horario.tanda === 'M' ? 'Mañana' : 'Tarde'}</td>
                                                                         <td>{horario.cantidadCitas} personas</td>
                                                                         <td class="text-right">
                                                                             <button
                                                                                title="Eliminar"
                                                                                on:click|preventDefault={() => eliminarHorario(horario.id)} 
                                                                                class="btn btn-outline-danger btn-sm">
                                                                                 <i class="mdi mdi-trash-can-outline"></i>
                                                                             </button>
                                                                         </td>
                                                                     </tr>
                                                                {/each}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                            <!-- <div
                                                class="tab-pane fade"
                                                id="v-pills-messages"
                                                role="tabpanel"
                                                aria-labelledby="v-pills-messages-tab"
                                            >
                                                <p class="opacity-75">
                                                    Fugiat id quis dolor culpa
                                                    eiusmod anim velit excepteur
                                                    proident dolor aute qui
                                                    magna. Ad proident laboris
                                                    ullamco esse anim Lorem
                                                    Lorem veniam quis Lorem
                                                    irure occaecat velit nostrud
                                                    magna nulla. Velit et et
                                                    proident Lorem do ea tempor
                                                    officia dolor. Reprehenderit
                                                    Lorem aliquip labore est
                                                    magna commodo est ea veniam
                                                    consectetur.
                                                </p>
                                            </div>
                                            <div
                                                class="tab-pane fade"
                                                id="v-pills-settings"
                                                role="tabpanel"
                                                aria-labelledby="v-pills-settings-tab"
                                            >
                                                <p class="opacity-75">
                                                    Eu dolore ea ullamco dolore
                                                    Lorem id cupidatat excepteur
                                                    reprehenderit consectetur
                                                    elit id dolor proident in
                                                    cupidatat officia. Voluptate
                                                    excepteur commodo labore
                                                    nisi cillum duis aliqua do.
                                                    Aliqua amet qui mollit
                                                    consectetur nulla mollit
                                                    velit aliqua veniam nisi id
                                                    do Lorem deserunt amet.
                                                    Culpa ullamco sit
                                                    adipisicing labore officia
                                                    magna elit nisi in aute
                                                    tempor commodo eiusmod.
                                                </p>
                                            </div> -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section><br><br>
</main>
<ModalAgregarHorario on:cargarHorariosCitas={cargarHorariosCitas}/>
<style>
    .logo-emp {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 10px;
    }
</style>
