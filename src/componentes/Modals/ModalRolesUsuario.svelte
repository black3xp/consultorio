<script>
    export let usuario = {};
    export let roles = [];

    $: rolesMapeado = roles.map(x => {
        return {
            id: x.id,
            name: x.name,
            displayName: x.displayName,
            active: usuario.roles.some((y) => x.name === y)
        }
    });
</script>
<div class="modal fade modal-slide-right" id="modalRoles" tabindex="-1" role="dialog"
        aria-labelledby="modalRolesLabel" style="display: none; padding-right: 16px;" aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalRolesLabel">{usuario.nombre} {usuario.apellido}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">

                    <form id="">
                        <input type="hidden" name="idPaciente" value="">
                        <p><span class="badge badge-soft-primary" style="font-size: 17px;">{usuario.correo}</span>
                        </p>
                        <div class="form-group floating-label">
                            <label for="">Buscar</label>
                            <input type="text" class="form-control" placeholder="Buscar roles">
                        </div>
                        <div class="roles">
                            {#each rolesMapeado as role}
                                     <div class="lista-rol m-b-10">
                                         <label class="cstm-switch d-flex bd-highlight">
                                             <span class="cstm-switch-description mr-auto bd-highlight"
                                                 >{role.displayName} <a href="#!" data-toggle="popover"
                                                     title="Informacion Administrador" data-trigger="focus"
                                                     data-placement="bottom"
                                                     data-content="And here's some amazing content. It's very engaging. Right?"
                                                     class="icon-rol"><i
                                                         class="mdi-18px mdi mdi-information-outline"></i></a></span>
                                             <input type="checkbox"
                                                 bind:checked={role.active}
                                                 class="cstm-switch-input">
                                             <span class="cstm-switch-indicator bg-success bd-highlight"></span>
                                         </label>
                                     </div>
                            {/each}
                        </div>
                    </form>

                </div>
            </div>
        </div>
    </div>