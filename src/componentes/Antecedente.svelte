<script>
    export let tipoAntecedente = '';
    export let descripcionAntecedente = '';
</script>
<div class="alert alert-border-danger  alert-dismissible fade show" role="alert">
    <div class="d-flex">
      <div class="content">
        <strong data-bind="text: new Date(fechaIngreso).toLocaleDateString('es-DO')">{tipoAntecedente}</strong>
        <br>
        <small>{descripcionAntecedente}</small>
      </div>
    </div>
    <a
      class="close" data-toggle="tooltip" data-placement="top" data-original-title="Ir"
      href="/AtencionMedica/Trabajar/1#resumen-page">
      <i class="mdi mdi-open-in-new"></i>
    </a>
</div>