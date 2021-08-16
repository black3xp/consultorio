<div class="cargando">
    <img class="imagen-error" src="./assets/img/error.svg" alt="">
    <h3>Ocurrió un error al comunicarnos con el servidor</h3>
    <p>Si el problema persiste, contacte al administrador. Disculpe los inconvenientes</p>
    <button
        class="btn btn-outline-primary"
        on:click={()=>location.reload()}
    >
        <i class="mdi mdi-refresh"></i> Recargar
    </button>
</div>
<style>
    .cargando{
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        z-index: 10000;
    }
    .imagen-error{
        width: 200px;
    }
    h3{
        color: #e5646e;
        text-align: center;
    }
    p{
        width: 400px;
        text-align: center;
    }
</style>