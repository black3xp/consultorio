import {wrap} from 'svelte-spa-router/wrap';
import {push} from 'svelte-spa-router';
import { isLogin } from './util/index';

import Index from './Pages/Home/Index.svelte';
import Pacientes from './Pages/Pacientes/Index.svelte';
import PacientePerfil from './Pages/Pacientes/PacientePerfil.svelte';
import PacienteCrear from './Pages/Pacientes/PacienteCrear.svelte';
import AtencionHistoriaClinica from './Pages/AtencionMedica/HistoriaClinica.svelte';
import Login from './Pages/Home/Login.svelte';
import Usuarios from './Pages/Usuarios/Index.svelte';
import HistoriasClinicas from './Pages/AtencionMedica/Index.svelte';
import RecetaMedicamentos from './Pages/Recetas/Medicamentos.svelte';


const routes = {
    "/": wrap({
        component: Index,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/login": Login,
    "/pacientes": wrap({
        component: Pacientes,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/pacientes/perfil/:id": wrap({
        component: PacientePerfil,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/pacientes/crear": wrap({
        component: PacienteCrear,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/pacientes/:idPaciente/historias/:idHistoria": wrap({
        component: AtencionHistoriaClinica,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/historias": wrap({
        component: HistoriasClinicas,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/usuarios": wrap({
        component: Usuarios,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
    "/impresion/pacientes/:idPaciente/historias/:idHistoria": wrap({
        component: RecetaMedicamentos,
        conditions: [
            async (detail) => {
                if(isLogin()){
                    return true
                }else{
                    return push('/login')
                }
            }
        ]
    }),
}

export default routes;