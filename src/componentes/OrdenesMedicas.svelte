<script>
    import { createEventDispatcher } from "svelte";
    let dispatch = createEventDispatcher();

    export let instrucciones;
    export let medicamentos;
    export let sltBuscarMedicamentos;
    export let sltBuscarEstudios;
    export let medicamentosSeleccionados;
    export let estudios;
    export let estudiosSeleccionados;

</script>

<div class="alert alert-secondary" role="alert">
    <h4 class="alert-heading">Receta</h4>
    <div class="card m-b-20 mt-3">
        <div class="card-header">
            <div class="card-title">Medicamentos</div>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-12 mb-2">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="dropdown">
                                <input
                                    type="text"
                                    class="form-control"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="true"
                                    placeholder="Buscar medicamentos"
                                    bind:value={sltBuscarMedicamentos}
                                    on:input={() => dispatch("buscarMedicamentos")}
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
                                                    on:click={() => dispatch("agregarMedicamento",medicamento.descripcion)}
                                                >
                                                    {medicamento.descripcion}
                                                </div>
                                            </li>
                                        {/each}
                                    </div>
                                    <li class="defecto">
                                        <a href="#!"
                                        on:click|preventDefault={() => dispatch("agregarMedicamento",sltBuscarMedicamentos)}
                                            ><i
                                                class="mdi mdi-plus"
                                            />Agregar manualmente</a
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
                                                     type="text"
                                                     class="form-control"
                                                     on:blur={() => dispatch("modificado")}
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
                                                     type="text"
                                                     class="form-control"
                                                     on:blur={() => dispatch("modificado")}
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
                                                 type="text"
                                                 class="form-control"
                                                 on:blur={() => dispatch("modificado")}
                                                 bind:value={med.frecuencia}
                                                 />
                                                </div>
                                            </div>
                                        </div>
                                        <div class="icon-borrar" data-tooltip="Eliminar">
                                            <i class="mdi mdi-close text-red" on:click={() => dispatch("eliminarMedicamento",i)}></i>
                                        </div>
                                 </div>
                                 {:else}
                                 <div class="row">
                                    <div class="col-md-12 mt-3">
                                        <div class="alert border alert-light" role="alert">
                                            <p class="alert-body text-center mt-3">
                                                No tienes medicamentos agregados
                                            </p>
                                        </div>
                                        <ul class="list-info" data-bind="foreach: estudios" />
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
        </div>
        <div class="card-controls">
            <div class="dropdown dropdown-vnc">
                <a
                    href="/"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                >
                    <i class="icon mdi  mdi-dots-vertical" />
                </a>
                <div class="dropdown-menu dropdown-menu-right">
                    <button class="dropdown-item text-primary" type="button"
                        ><i class="mdi mdi-printer" />
                        Imprimir estudios</button
                    >
                    <button class="dropdown-item text-success" type="button"
                        ><i class="mdi mdi-plus" />
                        Agregar nuevo estudio</button
                    >
                </div>
            </div>
        </div>

        <div class="card-body">
            <div class="row">
                <div class="col-12 row">
                        <div class="col-lg-6 col-md-12">
                            <div
                                class="form-group buscardor dropdown dropdown-vnc"
                            >
                                <input
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
                                            on:click={() => dispatch("agregarEstudio",{id: estudio.id, descripcion: estudio.descripcion, tipo: estudio.tipo})}>
                                            <div
                                                class="p-2"
                                                style="cursor: pointer;"
                                            >
                                            {#if estudio.tipo === 'LAB'}
                                                <span class="badge badge-primary">
                                                    <i class="mdi mdi-microscope"></i>
                                                </span>
                                                {:else}
                                                <span class="badge badge-primary">
                                                    <i class="mdi mdi-image"></i>
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
                    <ul class="list-info">
                        {#each estudiosSeleccionados as item, i}
                            <li>
                                {#if item.tipo === 'LAB'}
                                        <span class="badge badge-primary"
                                            ><i class="mdi mdi-microscope"></i></span
                                        >
                                     {:else}
                                     <span class="badge badge-primary"
                                         ><i class="mdi mdi-image"></i></span
                                     >
                                {/if}
                                &nbsp;<span>{item.descripcion}</span>
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
                                    <a
                                        href="#!"
                                        on:click|preventDefault={() => dispatch("eliminarEstudio", i)}
                                        class="text-danger"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        data-original-title="Eliminar diagnostico"
                                        ><i
                                            class="mdi-18px mdi mdi-trash-can-outline"
                                        /></a
                                    >
                                </div>
                            </li>
                        {/each}
                        {#if estudiosSeleccionados.length === 0}
                            <div class="row">
                                <div class="col-md-12">
                                    <div
                                        class="alert border alert-light"
                                        role="alert"
                                    >
                                        <p
                                            class="alert-body text-center mt-3"
                                        >
                                            No tienes agregado ningún
                                            estudio
                                        </p>
                                    </div>
                                    <ul
                                        class="list-info"
                                        data-bind="foreach: estudios"
                                    />
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
    .icon-borrar{
        position: absolute;
        right: 3px;
        top: 3px;
    }
    .icon-borrar i {
        cursor: pointer;
    }
</style>