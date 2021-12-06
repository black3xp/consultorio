<script>
    import axios from "axios";
    import { url, user } from "../util/index";

    import { createEventDispatcher, onMount } from "svelte";
    import { link } from "svelte-spa-router";
    let dispatch = createEventDispatcher();

    export let instrucciones = '';
    export let medicamentos;
    export let sltBuscarMedicamentos;
    export let sltBuscarEstudios;
    export let medicamentosSeleccionados;
    export let estudios;
    export let estudiosSeleccionados;
    export let idHistoria;
    export let idPaciente;
    export let disabled;
    let empresa = {};

    let categoriasEstudios = [];
    let estudiosVistaRapida = [];
    let selected = [];

    const cargarEmpresa = () => {
        const config = {
            method: "get",
            url: `${url}/empresas/${user().empresa}`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                empresa = res.data;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    $: estudiosSeleccionados.forEach((estudio) => {
        estudiosVistaRapida.forEach((estudioVistaRapida) => {
            if (estudio.id == estudioVistaRapida.id) {
                estudioVistaRapida.checked = true;
                selected = selected.filter(
                    (select) => select.id !== estudioVistaRapida.id
                );
                selected.push(estudioVistaRapida);
                return (selected = selected);
            }
            selected = selected.filter(
                (select) => select.id !== estudioVistaRapida.id
            );
            selected.push(estudioVistaRapida);
            return (selected = selected);
        });
    });

    const agregarEstudio = ({ id, descripcion, tipo }) => {
        const index = estudiosSeleccionados.findIndex(
            (estudio) => estudio.id == id
        );
        const estudio = estudiosSeleccionados.find(
            (estudio) => estudio.id == id
        );
        if (estudio) {
            estudiosSeleccionados = estudiosSeleccionados.filter(
                (estudio) => estudio.id !== id
            );
            dispatch("eliminarEstudio", id);
            return;
        } else {
            dispatch("agregarEstudio", { id, descripcion, tipo });
        }
    };

    const eliminarEstudio = (id) => {
        dispatch("eliminarEstudio", id);
        cargarCategoriasEstudios();
        cargarEstudiosVistaRapida();
    };

    const cargarCategoriasEstudios = () => {
        const config = {
            method: "get",
            url: `${url}/categoriasestudios/display`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then(async (res) => {
                categoriasEstudios = res.data;
                await cargarEstudiosVistaRapida();
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const cargarEstudiosVistaRapida = () => {
        const config = {
            method: "get",
            url: `${url}/estudio/vistarapida`,
            headers: {
                Authorization: `${localStorage.getItem("auth")}`,
            },
        };
        axios(config)
            .then((res) => {
                estudiosVistaRapida = res.data;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    onMount(() => {
        cargarEmpresa();
        cargarCategoriasEstudios();
    });
</script>

<div class="alert alert-secondary" role="alert">
    <h4 class="alert-heading">Receta</h4>
    <a
        href={`/pacientes/${idPaciente}/historias/${idHistoria}/imprimir/estudios`}
        use:link
        class="btn btn-outline-primary btn-sm btn-receta"
    >
        <i class="mdi mdi-printer" />
        Imprimir todas las recetas
    </a>
    <div class="card m-b-20 mt-3">
        <div class="card-header">
            <div class="card-title">Medicamentos</div>
            <div class="card-controls">
                <a
                    href={`/impresion/pacientes/${idPaciente}/historias/${idHistoria}/medicamentos`}
                    use:link
                    class="btn btn-outline-primary btn-sm"
                    data-tooltip="Imprimir"
                >
                    <i class="mdi mdi-printer" />
                </a>
            </div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-12 mb-2">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="dropdown">
                                <input
                                    {disabled}
                                    type="text"
                                    class="form-control"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="true"
                                    placeholder="Buscar medicamentos"
                                    bind:value={sltBuscarMedicamentos}
                                    on:input={() =>
                                        dispatch("buscarMedicamentos")}
                                />
                                <ul
                                    class="lista-buscador dropdown-menu"
                                    id="buscador"
                                    x-placement="top-start"
                                    style="position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(0px, -128px, 0px); border-radius: 5px;"
                                >
                                    <div class="contenidoLista">
                                        {#each medicamentos as medicamento}
                                            <li>
                                                <div
                                                    class="p-2"
                                                    style="cursor: pointer;"
                                                    on:click={() =>
                                                        dispatch(
                                                            "agregarMedicamento",
                                                            medicamento.descripcion
                                                        )}
                                                >
                                                    {medicamento.descripcion}
                                                </div>
                                            </li>
                                        {/each}
                                    </div>
                                    <li class="defecto">
                                        <a
                                            href="#!"
                                            on:click|preventDefault={() =>
                                                dispatch(
                                                    "agregarMedicamento",
                                                    sltBuscarMedicamentos
                                                )}
                                            ><i class="mdi mdi-plus" />Agregar
                                            manualmente</a
                                        >
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            {#each medicamentosSeleccionados as med, i}
                                <!-- content here -->
                                <div
                                    class="col-lg-12 border border-primary rounded mt-3"
                                >
                                    <div class="row">
                                        <div
                                            class="col p-3"
                                            style="display: flex; align-items: center; justify-content: left;"
                                        >
                                            <p
                                                class="text-primary"
                                                style="margin: 0;"
                                            >
                                                {med.nombre}
                                            </p>
                                        </div>
                                        <div class="col mt-2">
                                            <div class="mb-2">
                                                <!-- svelte-ignore a11y-label-has-associated-control -->
                                                <label
                                                    style="margin: 0;"
                                                    class="form-label text-primary"
                                                    >Concentraci&oacute;n</label
                                                >
                                                <input
                                                    {disabled}
                                                    type="text"
                                                    class="form-control"
                                                    on:blur={() =>
                                                        dispatch("modificado")}
                                                    bind:value={med.concentracion}
                                                />
                                            </div>
                                        </div>
                                        <div class="col mt-2">
                                            <div class="mb-2">
                                                <!-- svelte-ignore a11y-label-has-associated-control -->
                                                <label
                                                    style="margin: 0;"
                                                    class="form-label text-primary"
                                                    >Cantidad</label
                                                >
                                                <input
                                                    {disabled}
                                                    type="text"
                                                    class="form-control"
                                                    on:blur={() =>
                                                        dispatch("modificado")}
                                                    bind:value={med.cantidad}
                                                />
                                            </div>
                                        </div>
                                        <div class="col mt-2">
                                            <div class="mb-2">
                                                <!-- svelte-ignore a11y-label-has-associated-control -->
                                                <label
                                                    style="margin: 0;"
                                                    class="form-label text-primary"
                                                    >Frecuencia</label
                                                >
                                                <input
                                                    {disabled}
                                                    type="text"
                                                    class="form-control"
                                                    on:blur={() =>
                                                        dispatch("modificado")}
                                                    bind:value={med.frecuencia}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {#if !disabled}
                                        <!-- content here -->
                                        <div
                                            class="icon-borrar"
                                            data-tooltip="Eliminar"
                                        >
                                            <i
                                                class="mdi mdi-close text-red"
                                                on:click={() =>
                                                    dispatch(
                                                        "eliminarMedicamento",
                                                        i
                                                    )}
                                            />
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <div class="row">
                                    <div class="col-md-12 mt-3">
                                        <div
                                            class="alert border alert-light"
                                            role="alert"
                                        >
                                            <p
                                                class="alert-body text-center mt-3"
                                            >
                                                No tienes medicamentos agregados
                                            </p>
                                        </div>
                                        <ul
                                            class="list-info"
                                            data-bind="foreach: estudios"
                                        />
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card m-b-20">
        <div class="card-header">
            <div class="card-title">Estudios</div>
            <div class="card-controls">
                <a
                    href={`/impresion/pacientes/${idPaciente}/historias/${idHistoria}/estudios/laboratorios`}
                    use:link
                    class="btn btn-outline-primary btn-sm"
                    data-tooltip="Imprimir"
                >
                    <i class="mdi mdi-printer" /> Laboratorios
                </a>
                <a
                    href={`/impresion/pacientes/${idPaciente}/historias/${idHistoria}/estudios/imagenes`}
                    use:link
                    class="btn btn-outline-primary btn-sm"
                    data-tooltip="Imprimir"
                >
                    <i class="mdi mdi-printer" /> Imagenes
                </a>
            </div>
        </div>

        <div class="card-body">
            <div class="row">
                <div class="col-12 row">
                    <div class="col-lg-6 col-md-12">
                        <div class="form-group buscardor dropdown dropdown-vnc">
                            <input
                                {disabled}
                                type="text"
                                class="form-control"
                                bind:value={sltBuscarEstudios}
                                on:input={() => dispatch("buscandoEstudios")}
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                                placeholder="Buscar estudios"
                            />

                            <ul
                                class="lista-buscador dropdown-menu"
                                id="buscador"
                                x-placement="bottom-start"
                                style="position: absolute; will-change: transform; border-radius: 5px; top: 0px; left: 0px; transform: translate3d(0px, 36px, 0px);"
                            >
                                <div
                                    class="contenidoLista"
                                    data-bind="foreach: listado"
                                >
                                    {#each estudios as estudio}
                                        <li
                                            on:click={() =>
                                                dispatch("agregarEstudio", {
                                                    id: estudio.id,
                                                    descripcion:
                                                        estudio.descripcion,
                                                    tipo: estudio.tipo,
                                                })}
                                        >
                                            <div
                                                class="p-2"
                                                style="cursor: pointer;"
                                            >
                                                {#if estudio.tipo === "LAB"}
                                                    <span
                                                        class="badge badge-primary"
                                                    >
                                                        <i
                                                            class="mdi mdi-microscope"
                                                        />
                                                    </span>
                                                {:else}
                                                    <span
                                                        class="badge badge-primary"
                                                    >
                                                        <i
                                                            class="mdi mdi-image"
                                                        />
                                                    </span>
                                                {/if}
                                                {estudio.descripcion}
                                            </div>
                                        </li>
                                    {/each}
                                </div>
                                <li class="defecto">
                                    <a
                                        href="/"
                                        data-bind="click: agregarManualmente"
                                        ><i class="mdi mdi-plus" /> Agregar manualmente</a
                                    >
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="col-12">
                    {#if empresa.estudiosCheck}
                         <div class="row mt-2">
                             {#each categoriasEstudios as categoria}
                                 <div class="col-lg-12 mb-2">
     
                                     <div class="accordion " id="accordionExample">
                                         <div class="card">
                                             <div class="card-header" id="headingOne">
                                                 <h5 class="mb-0">
                                                     <a href="#!" class="d-block" data-toggle="collapse" data-target={`#collapse${categoria.id}`} aria-expanded="true" aria-controls={`collapse${categoria.id}`}>
                                                         {categoria.Name}
                                                     </a>
                                                 </h5>
                                             </div>
             
                                             <div id={`collapse${categoria.id}`} class="collapse" aria-labelledby="headingOne" data-parent="#accordionExample">
                                                 <div class="card-body">
                                                     {#each estudiosVistaRapida as estudio}
     
                                                         {#if categoria.id === estudio.categoria}
                                                             <div class="tag-input mr-2">
                                                                 <input
                                                                     bind:checked={estudio.checked}
                                                                     id={estudio.id}
                                                                     type="checkbox"
                                                                 />
                                                                 <label
                                                                     on:click={() =>
                                                                         agregarEstudio({
                                                                             id: estudio.id,
                                                                             descripcion:
                                                                                 estudio.descripcion,
                                                                             tipo: estudio.tipo,
                                                                         })}
                                                                     for={estudio.id}
                                                                     >{estudio.descripcion}</label
                                                                 >
                                                             </div>
                                                         {/if}
                 
                                                 {/each}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
     
                                     <!-- <h6><strong>{categoria.Name}</strong></h6>
                                     {#each estudiosVistaRapida as estudio}
     
                                             {#if categoria.id === estudio.categoria}
                                                 <div class="tag-input mr-2">
                                                     <input
                                                         bind:checked={estudio.checked}
                                                         id={estudio.id}
                                                         type="checkbox"
                                                     />
                                                     <label
                                                         on:click={() =>
                                                             agregarEstudio({
                                                                 id: estudio.id,
                                                                 descripcion:
                                                                     estudio.descripcion,
                                                                 tipo: estudio.tipo,
                                                             })}
                                                         for={estudio.id}
                                                         >{estudio.descripcion}</label
                                                     >
                                                 </div>
                                             {/if}
     
                                     {/each} -->
                                 </div>
                             {/each}
                         </div>
                    {/if}

                    <ul class="list-info mt-2">
                        {#each estudiosSeleccionados.reverse() as item, i}
                            <li>
                                {#if item.tipo === "LAB"}
                                    <span class="badge badge-primary"
                                        ><i class="mdi mdi-microscope" /></span
                                    >
                                {:else}
                                    <span class="badge badge-primary"
                                        ><i class="mdi mdi-image" /></span
                                    >
                                {/if}
                                &nbsp;<span>{item.descripcion}</span>
                                {#if !disabled}
                                    <div
                                        style="position: absolute; top: 0; right: 0;padding: 10px; background-color: white; border-bottom-left-radius: 5px;"
                                    >
                                        <!-- <a
                                            href="#!"
                                            class="text-primary"
                                            title="Agregar comentarios"
                                            ><i
                                                class="mdi-18px mdi mdi-comment-plus-outline"
                                            /></a
                                        > -->
                                        <!-- content here -->
                                        <a
                                            href="#!"
                                            on:click|preventDefault={() =>
                                                eliminarEstudio(i)}
                                            class="text-danger"
                                            ><i
                                                class="mdi-18px mdi mdi-trash-can-outline"
                                            /></a
                                        >
                                    </div>
                                {/if}
                            </li>
                        {/each}
                        {#if estudiosSeleccionados.length === 0}
                            <div class="row">
                                <div class="col-md-12">
                                    <div
                                        class="alert border alert-light"
                                        role="alert"
                                    >
                                        <p class="alert-body text-center mt-3">
                                            No tienes agregado ningún estudio
                                        </p>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </ul>

                    
                </div>
            </div>
        </div>
    </div>

    <div class="card m-b-20">
        <div class="card-header">
            <div class="card-title">Instrucciones</div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-12">
                    <textarea
                        {disabled}
                        bind:value={instrucciones}
                        on:blur={() => dispatch("modificado")}
                        class="form-control"
                        style="width: 100%;"
                        rows="5"
                    />
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .btn-receta {
        position: absolute;
        right: 20px;
        top: 15px;
    }
    .icon-borrar {
        position: absolute;
        right: 3px;
        top: 3px;
    }
    .icon-borrar i {
        cursor: pointer;
    }
</style>
