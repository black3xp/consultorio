<script>
    import { link } from "svelte-spa-router";
    export let motivo = '';
    export let historia = '';
    export let fecha = '';
    export let id = '';
    export let idPaciente = '';

    $: fechaHora = new Date(fecha).toLocaleString('es-DO')
</script>
<div class="list-unstyled">
    <div class="media">
        <div class="avatar mr-3  avatar-sm">
            <img class="avatar-img rounded-circle" src="assets/img/placeholder.svg" alt="imagen paciente">
        </div>
        <div class="media-body">
            <h6 class="mt-0 mb-1"> <span data-bind="text: atencionMedica.nombreMedico">Mariela Camilo</span>
                <span class="text-muted ml-3 small">{fechaHora} 
                    <a href={`/pacientes/${idPaciente}/historias/${id}`} use:link class="btn btn-primary btn-sm text-white" style="position: absolute; right:20px;"><i class="fab fa-share-square"></i> editar</a>
                </span>
            </h6>
            <small class="mt-4 mb-4 text-primary">Motivo de Consulta</small>
            <p data-bind="text: atencionMedica.motivoConsulta">{motivo}</p>
            <small class="mt-4 mb-4 text-primary">Historia de la Enfermedad</small>
            <p data-bind="text: atencionMedica.historiaEnfermedad">{historia}</p>
        </div>
    </div>
</div>