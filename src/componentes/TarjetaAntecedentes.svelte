<script>
    import { onMount } from "svelte";

    export let id = "";
    export let nombre = "";
    export let antecedentes = [];
    onMount(() =>{
        console.log(antecedentes)
    })
</script>

<div>
    <h6>{nombre}</h6>
    <hr>
    {#if antecedentes.length === 0}
        <p class="opacity-75">
            No hay {nombre}
        </p>
    {/if}
</div>
