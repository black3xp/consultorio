<script>
    import { url, isLogin } from '../../util/index';
    import axios from 'axios';
    import { push } from 'svelte-spa-router';
    import { link } from "svelte-spa-router";

    import Loading from '../../componentes/Loading.svelte';

</script>
<div class="container-fluid">
    <div class="row ">
        <div class="col-lg-4  bg-white">
            <div class="row align-items-center m-h-100">
                <div class="mx-auto col-md-8">
                    <form class="needs-validation" action="#" novalidate="novalidate">
                        <div class="p-b-20 text-center">
                            <p>
                                <img src="assets/img/logo.svg" width="80" alt="">

                            </p>
                            <p class="admin-brand-content">
                                registro xmedical
                            </p>
                        </div>
                        <div class="form-row">
                            <div class="form-group floating-label col-md-12">
                                <label for="">Titulo</label>
                                <select class="form-control" required>
                                    <option value=""> - seleccionar titulo - </option>
                                    <option value="Dr">Dr</option>
                                    <option value="Dra">Dra</option>
                                </select>
                            </div>
                            <div class="form-group floating-label col-md-12">
                                <label for="">Nombre</label>
                                <input type="text" class="form-control" required placeholder="Nombre">
                            </div>
                            <div class="form-group floating-label col-md-12">
                                <label for="">Apellido</label>
                                <input type="text" class="form-control" required placeholder="Apellido">
                            </div>
                            <div class="form-group floating-label col-md-12">
                                <label for="">Correo Electronico</label>
                                <input type="email" required="" class="form-control" placeholder="Correo Electronico">
                            </div>
                            <div class="form-group floating-label col-md-12">
                                <label for="">Contraseña</label>
                                <input type="password" required="" placeholder="Contraseña" class="form-control " id="password">
                            </div>
                        </div>
                        <div class="form-group floating-label">
                            <label for="">Repetir Contraseña</label>
                            <input type="password" class="form-control" required="" id="confirm_password" placeholder="Repetir Contraseña">
                        </div>

                        <p class="">
                            <label class="cstm-switch">
                                <input type="checkbox" checked="" name="option" value="1" class="cstm-switch-input">
                                <span class="cstm-switch-indicator "></span>
                                <span class="cstm-switch-description">  Aceptar terminos y condiciones. </span>
                            </label>


                        </p>

                        <button type="submit" class="btn btn-primary btn-block btn-lg">Crear cuenta</button>

                    </form>
                    <p class="text-right p-t-10">
                        <a href="/login" use:link class="text-underline">Estas registrado?</a>
                    </p>
                </div>

            </div>
        </div>
        <div class="col-lg-8 d-none d-md-block bg-cover" style="background-image: url('assets/img/register.svg');">

        </div>
    </div>
</div>