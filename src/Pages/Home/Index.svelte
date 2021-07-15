<script>
  import Header from "../../Layout/Header.svelte";
  import Aside from "../../Layout/Aside.svelte";
</script>

<Aside />

<main class="admin-main">
  <Header />
  <section class="admin-content">
    <div class="p-2">
      <div class="row" />
      <div class="col-12 m-b-30 mt-4">
        <h3>Resumen</h3>
      </div>
      <div class="col-lg-4">
        <div class="card m-b-30">
          <div class="card-body">
            <div class="row">
              <div class="col my-auto">
                <div class="h6 text-muted ">Pacientes</div>
              </div>

              <div class="col-auto my-auto">
                <div class="avatar">
                  <div class="avatar-title rounded-circle badge-soft-danger">
                    <i class="mdi mdi-account"></i>
                  </div>
                </div>
              </div>
            </div>
            <h1 class="display-4 fw-600">16k</h1>
            <div class="h6">
              Todos los registrados
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
