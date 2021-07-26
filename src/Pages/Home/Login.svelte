<script>
    import { url, isLogin } from '../../util/index';
    import axios from 'axios';
    import { push } from 'svelte-spa-router';

    let inpCorreo = '';
    let inpPassword = '';

    const login = () => {
        const data = {
            correo: inpCorreo,
            password: inpPassword,
        }
        const config = {
            method: 'post',
            url: `${url}/login`,
            headers: {
                'Authorization': `${localStorage.getItem('auth')}` 
            },
            data 
        };
        axios(config)
            .then(res => {
                localStorage.setItem('auth', res.data);
                console.log(res.data)
                if(isLogin()){
                   return push('/')
                }
            })
    }
</script>
<div class="container-fluid">
    <div class="row ">
        <div class="col-lg-4  bg-white">
            <div class="row align-items-center m-h-100">
                <div class="mx-auto col-md-8">
                    <div class="p-b-20 text-center">
                        <p>
                            <img src="assets/img/logo.svg" width="80" alt="">

                        </p>
                        <p class="admin-brand-content">
                            xmedical pro
                        </p>
                    </div>
                    <form class="needs-validation" on:submit|preventDefault={login} >
                        <div class="form-row">
                            <div class="form-group floating-label col-md-12">
                                <label for="">Correo</label>
                                <input type="email" bind:value={inpCorreo} required="true" autocomplete="username" class="form-control" placeholder="Correo">
                            </div>
                            <div class="form-group floating-label col-md-12">
                                <label for="">Contrase&ntilde;a</label>
                                <input type="password" bind:value={inpPassword} autocomplete="current-password" placeholder="Contrase&ntilde;a" required="true" class="form-control ">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block btn-lg">Entrar</button>

                    </form>
                    <p class="text-right p-t-10">
                        <a href="#!" class="text-underline">Olvide mi contrase&ntilde;a?</a>
                    </p>
                </div>

            </div>
        </div>
        <div class="col-lg-8 d-none d-md-block bg-cover" style="background-image: url('assets/img/login.svg');">

        </div>
    </div>
</div>