<script>
    import { onMount } from "svelte";

    export let id = "";
    export let nombre = "";
    export let antecedentes = [];
    onMount(() =>{
        console.log(id)
    })
</script>

<div>
    <h6>{nombre}</h6>
    <hr>
    {#each antecedentes as antecedente}
        {#if antecedente.categoria.id === id}
            {#if antecedente.activo}
                <div class="alert alert-secondary" style="padding: 10px;" role="alert">
                    <h5 class="alert-heading" style="margin-bottom: 0px;font-size:12px;text-transform: uppercase;font-weight: bold;">{antecedente.nombre}</h5>
                    <p style="padding: 0; margin:0;">{antecedente.descripcion}</p>
                </div>
            {/if}
        {/if}
    {/each}
</div>
