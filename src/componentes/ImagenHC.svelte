<script>
    import axios from "axios";
    import { createEventDispatcher } from "svelte";
    import { url } from "../util/index";

    export let imagenes;
    export let idImagen = "";
    export let idHistoria;
    let imagen = '';
    const dipatch = createEventDispatcher();

    $: if(idImagen){
        getImagenHC();
    }

    const getImagenHC = () => {
        console.log(idImagen);
        if(!idImagen){
            return;
        }
        imagen = '/assets/img/placeholder.svg';
        const config = {
            method: "get",
            responseType: 'blob',
            url: `${url}/imagenes/historia/${idImagen}`,
            headers: {
                'Content-Type': `multipart/form-data`,
                Authorization: `${localStorage.getItem("auth")}`,
            },
        }
        axios(config)
            .then(function (response) {
                imagen = URL.createObjectURL(response.data);
            })
            .catch(function (error) {
                imagen = '/assets/img/placeholder.svg';
                console.log(error);
            });
    }

    const deleteImage = (idImagen) => {
        console.log(imagenes)
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Se eliminara la imagen que seleccionaste!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Eliminarla!",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                console.log(idImagen);
                axios.delete(`${url}/imagenes/historia/${idHistoria}/${idImagen}`, {
                    headers: {
                        Authorization: `${localStorage.getItem("auth")}`,
                    },
                })
                    .then(async function (response) {
                        if(response?.status === 200){
                            imagenes = imagenes.filter(imagen => {
                                return imagen != idImagen;
                            });
                            console.log(imagenes);
                            idImagen = '';
                            await dipatch("eliminarImagenHC", imagenes);
                            await dipatch('cargarHistoria')
                        }
                    })
                    .catch(async function (error) {
                        if(error?.response?.status === 400){

                            if(error?.response?.data?.code == "E_IMAGE_DELETE"){
                                Swal.fire({
                                    title: "Error",
                                    text: "No se puede eliminar la imagen",
                                    icon: "error",
                                    confirmButtonColor: "#3085d6",
                                    confirmButtonText: "Ok",
                                });
                                return
                            }

                            imagenes = imagenes.filter(imagen => {
                                return imagen != idImagen;
                            });
                            console.log(imagenes);
                            idImagen = '';
                            await dipatch("eliminarImagenHC", imagenes);
                            await dipatch('cargarHistoria')
                            return
                        }
                        Swal.fire({
                            title: "Error",
                            text: "Problemas de comunicación con el servidor",
                            icon: "error",
                            confirmButtonColor: "#3085d6",
                            confirmButtonText: "Ok",
                        });
                        console.log(error);
                    });
            }
        });
    }
</script>
<!-- svelte-ignore a11y-img-redundant-alt -->
<div class="img-content">
    <div class="icon" on:click={() => deleteImage(idImagen)}>
        <i class="mdi mdi-close-circle"></i>
    </div>
    <a href={imagen} data-lightbox="hc" data-title="Historia Clinica">    
        <img
            src={imagen}
            class="img-fluid img-hc"
            alt="hc imagen"
            loading="lazy"
        />
    </a>
</div>
<style>
    .img-content{
        position: relative;
    }
    .img-hc {
        width: 100%;
        height: 150px;
        max-height: 150px;
        object-fit: cover;
        border-radius: 5px;
    }
    .icon{
        position: absolute;
        top: -7px;
        right: -5px;
        font-size: 20px;
        cursor: pointer;
        color: #f2545b;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
    }
</style>