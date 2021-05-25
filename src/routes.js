import {wrap} from 'svelte-spa-router/wrap'
import {push} from 'svelte-spa-router'
import Index from './Pages/Home/Index.svelte'
import Pacientes from './Pages/Pacientes/Index.svelte';
import PacientePerfil from './Pages/Pacientes/PacientePerfil.svelte';
import PacienteCrear from './Pages/Pacientes/PacienteCrear.svelte';

const isAdmin = () => {
    const roles = ['admin', 'patient', 'assitent']
    if(roles.includes('admin')){
        return true
    }else{
        return false
    }
}

const routes = {
    "/": wrap({
        component: Index,
        conditions: [
            async (detail) => {
                if(isAdmin()){
                    return true
                }else{
                    return push('/pacientes/crear')
                }
            }
        ]
    }),
    "/pacientes": Pacientes,
    "/pacientes/perfil/:id": PacientePerfil,
    "/pacientes/crear": PacienteCrear,
}

export default routes;