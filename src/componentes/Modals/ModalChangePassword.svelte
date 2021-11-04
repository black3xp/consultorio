<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import { url } from "../../util";

    import Loading from '../../componentes/Loading.svelte';

    const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    let msgError = "";
    let cargando = false;
    let oldPassword = '';
    let newPassword = '';
    let repeatNewPassword = '';

    const changePassword = () => {
        cargando = true;
        const data = {
            newPassword,
            password: oldPassword,
        }
        const config = {
            method: 'post',
            url: `${url}/usuarios/reset`,
            data,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            }
        }
        msgError = ''
        if(newPassword.length < 6){
            cargando = false;
            return msgError = 'La contraseña debe tener al menos 6 carácteres'
        }

        if(newPassword !== repeatNewPassword){
            cargando = false;
            return msgError = 'Las contraseñas no coinciden';
        }
        axios(config)
            .then(res => {
                cargando = false;
                oldPassword = '';
                newPassword = '';
                repeatNewPassword = '';
                if(res.status === 200){
                    localStorage.removeItem('auth');
                    localStorage.setItem('auth', res.data)
                    Toast.fire({
                        icon: 'success',
                        title: 'Se ha cambiado la contraseña'
                    })
                }
            })
            .catch(err => {
                oldPassword = '';
                newPassword = '';
                repeatNewPassword = '';
                msgError = 'Ocurrio un error al contactar al servidor, comuniquese con el administrador'
                cargando = false;
                console.error(err)
            })
        return console.log('cambiando')
    }


    onMount(() => {

    });
</script>

<form class="col-md-12" on:submit|preventDefault={changePassword}>
    <div
        class="modal fade modal-slide-right"
        id="modalChangePassword"
        tabindex="-1"
        role="dialog"
        aria-labelledby="modalInterconsulta"
        style="display: none; padding-right: 16px;"
        aria-modal="true"
    >
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalInterconsulta">
                        Cambiar contrase&ntilde;a
                    </h5>
                    <button
                        type="button"
                        class="close"
                        data-dismiss="modal"
                        aria-label="Close"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                    {#if cargando}
                        <div class="cargando">
                            <Loading/>
                        </div>
                    {/if}
                    <div class="form-row">
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary">Contrase&ntilde;a anterior</label>
                            <input type="password" class="form-control" required bind:value={oldPassword} autocomplete="current-password">
                        </div>
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary">Nueva contrase&ntilde;a</label>
                            <input type="password" class="form-control" required bind:value={newPassword} autocomplete="new-password">
                        </div>
                        <div class="form-group col-md-12">
                            <label for="" class="text-primary">Repetir Nueva contrase&ntilde;a</label>
                            <input type="password" class="form-control" required bind:value={repeatNewPassword} autocomplete="new-password">
                        </div>
                    </div>

                    {#if msgError}
                        <div class="alert alert-danger" role="alert">
                            {msgError}
                        </div>
                    {/if}
                    <br />
                </div>
                <div class="modal-footer">
                    <div class="row text-center p-b-10">
                        <div class="col">
                            <a
                                href="/"
                                class="text-danger"
                                data-dismiss="modal"
                            >
                                <!-- svelte-ignore a11y-missing-content -->
                                <h3 class="mdi mdi-close-outline" />
                                <div class="text-overline">Cerrar</div>
                            </a>
                        </div>
                        <div class="col">
                            <button
                                class="text-success"
                                style="border: none; background-color: transparent;"
                            >
                                <!-- svelte-ignore a11y-missing-content -->
                                <h3 class="mdi mdi-send" />
                                <div class="text-overline">Crear</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>

<style>

</style>
