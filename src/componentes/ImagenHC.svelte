<script>
    import axios from "axios";
    import { createEventDispatcher } from "svelte";
    import { url } from "../util/index";


    export let idImagen;
    export let idHistoria;
    let imagen = '';
    const dipatch = createEventDispatcher();

    $: if(idImagen){
        getImagenHC();
    }

    const getImagenHC = () => {
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

    const deleteImage = (image) => {
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
                axios.delete(`${url}/imagenes/historia/${idHistoria}/${image}`, {
                    headers: {
                        Authorization: `${localStorage.getItem("auth")}`,
                    },
                })
                    .then(function (response) {
                        dipatch('cargarHistoria')
                    })
                    .catch(function (error) {
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