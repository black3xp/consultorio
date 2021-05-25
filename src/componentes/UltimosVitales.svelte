<script>
    export let peso = '';
    export let temperatura = '';
    export let frecuenciaRespiratoria = '';
    export let frecuenciaCardiaca = '';
    export let presionAlterial = '';
</script>
<div class="card m-b-30">
    <div class="card-header">
      <div class="avatar mr-2 avatar-xs">
        <div class="avatar-title bg-dark rounded-circle">
          <i class="mdi mdi-account-heart mdi-18px"></i>
        </div>
      </div>
      Ultimos Signo Vitales
    </div>
    <div class="card-controls">
      <div class="dropdown">
        <a href="#" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i
            class="icon mdi  mdi-dots-vertical"></i> </a>

        <div class="dropdown-menu dropdown-menu-right">
          <button class="dropdown-item" type="button">Action</button>
          <button class="dropdown-item" type="button">Another action</button>
          <button class="dropdown-item" type="button">Something else here</button>
        </div>
      </div>
    </div>
    <div class="list-group list  list-group-flush" data-bind="using: ultimosSignosVitales">

      <div class="list-group-item ">

        <div class="row">
          <div class="col-lg-9 col-sm-10">
            <i class="mdi mdi-speedometer mdi-18px"></i> Peso
          </div>
          <div class="col-lg-3 col-sm-2">
            <p>{peso} Lb</p>
          </div>
        </div>

        <div class="row">
          <div class="col-lg-9 col-sm-10">
            <i class="mdi mdi-thermometer mdi-18px"></i> Temperatura
          </div>
          <div class="col-lg-3 col-sm-2">
            <p>{temperatura} °C</p>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-9 col-sm-10">
            <i class="mdi mdi-chart-line mdi-18px"></i> Frecuencia Respiratoria
          </div>
          <div class="col-lg-3 col-sm-2">
            <p data-bind="text: frecuenciaRespiratoria">{frecuenciaRespiratoria}</p>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-9 col-sm-10">
            <i class="mdi mdi-heart-pulse mdi-18px"></i> Frecuencia Cardiaca
          </div>
          <div class="col-lg-3 col-sm-2">
            <p data-bind="text: frecuenciaCardiaca">{frecuenciaCardiaca}</p>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-9 col-sm-10">
            <i class="mdi mdi-heart-pulse mdi-18px"></i> Presion Alterial (mmHg)
          </div>
          <div class="col-lg-3 col-sm-2">
            <p data-bind="text: tensionArterialSistolica +'/' + tensionArterialDiastolica">{presionAlterial}</p>
          </div>
        </div>

      </div>

    </div>
  </div>