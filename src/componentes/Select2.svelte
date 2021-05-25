<script>
import { onMount } from 'svelte'
export let id
export let datos;
export let valor;
export let placeholder;
export let label;

onMount(() => {
    jQuery(`#${id}`).select2({ placeholder: `${placeholder}`});
    jQuery(`#${id}`).on("select2:select", e => {
        valor = e.params.data.id;
    });
})
</script>
<label for={id}>{label}</label>
<select
    class={`form-control ${id}`}
    style="width:100%;"
    id={id}
>
    <option value=""> {placeholder} </option>
    {#each datos as item}
        <option value={item.id}>{item.nombre}</option>
    {/each}
</select>
<style>

</style>
