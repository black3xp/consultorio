<script>
  export let nombres;
  export let apellidos;
  export let cedula;
  export let edad;
  export let id;
  
</script>
<div class="bg-dark m-b-30">
    <div class="">
      <div class="col-md-12">
        <div class="row p-b-60 p-t-60">
          <div class="col-md-6 text-white p-b-30">
            <div class="media">
              <div class="avatar mr-3  avatar-xl">
                <span class="avatar-title rounded-circle">HL</span>
              </div>
              <div class="media-body m-auto">
                <h5 class="mt-0"> 
                  <span data-bind="text: paciente().nombreParaMostrar">{`${nombres} ${apellidos}`}</span> 
                  <a href="/" class="btn ml-2 btn-primary btn-sm" data-toggle="modal"
                    data-target="#modalDatosPersonales">
                    <i class="mdi mdi-comment-eye"></i> Ver datos personales
                  </a>
                </h5>
                <div class="opacity-75"><span data-bind="text: paciente().edad">{edad} años</span> | <span
                    data-bind="text: paciente().cedula">No. Cedula: {cedula}</span> </div>
              </div>
            </div>

          </div>

          <div class="col-md-6" style="text-align: right">
            <div class="dropdown">
              <a href={`/${id}`} type="button" class="btn text-white m-b-30 ml-2 mr-2 ml-3 btn-primary" data-toggle="modal"
                data-target="#modalNuevaAtencion"><i class="mdi mdi-progress-check"></i>
                Iniciar nueva atención
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>