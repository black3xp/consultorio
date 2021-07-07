<script>
    export let motivo = '';
    export let historia = '';
    export let fecha = '';

    $: fechaHora = new Date(fecha).toLocaleString('es-DO')
</script>
<div class="list-unstyled">
    <div class="media">
        <div class="avatar mr-3  avatar-sm">
            <img class="avatar-img rounded-circle" src="assets/img/placeholder.svg" alt="imagen paciente">
        </div>
        <div class="media-body">
            <h6 class="mt-0 mb-1"> <span data-bind="text: atencionMedica.nombreMedico">Mariela Camilo</span>
                <span class="text-muted ml-3 small">{fechaHora}</span>
            </h6>
            <small class="mt-4 mb-4 text-primary">Motivo de Consulta</small>
            <p data-bind="text: atencionMedica.motivoConsulta">{motivo}</p>
            <small class="mt-4 mb-4 text-primary">Historia de la Enfermedad</small>
            <p data-bind="text: atencionMedica.historiaEnfermedad">{historia}</p>
        </div>
    </div>
</div>