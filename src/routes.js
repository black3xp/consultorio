import {wrap} from 'svelte-spa-router/wrap';
import {push} from 'svelte-spa-router';
import { isLogin } from './util/index';

import Index from './Pages/Home/Index.svelte';
import Prueba from './Pages/Prueba.svelte';
import Pacientes from './Pages/Pacientes/Index.svelte';
import PacientePerfil from './Pages/Pacientes/PacientePerfil.svelte';
import PacienteCrear from './Pages/Pacientes/PacienteCrear.svelte';
import PacienteEditar from './Pages/Pacientes/PacienteEditar.svelte';
import AtencionHistoriaClinica from './Pages/AtencionMedica/HistoriaClinica.svelte';
import Login from './Pages/Home/Login.svelte';
import Usuarios from './Pages/Usuarios/Index.svelte';
import HistoriasClinicas from './Pages/AtencionMedica/Index.svelte';
import RecetaMedicamentos from './Pages/Recetas/Medicamentos.svelte';
import RecetaEstudios from './Pages/Recetas/Estudios.svelte';
import RecetaImagenes from './Pages/Recetas/Imagenes.svelte';
import RecetasIndex from './Pages/Recetas/Indicaciones/Index.svelte';
import ImprimirRecetas from './Pages/Recetas/ImprimirRecetas.svelte';
import EmpresaDetalle from './Pages/Empresa/Detalle.svelte';
import CitasIndex from './Pages/Citas/Index.svelte';
import HistoriaActual from './Pages/Reportes/HistoriaClinica/Actual.svelte';

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
    "/prueba": Prueba,
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
    "/pacientes/:idPaciente/editar": wrap({
        component: PacienteEditar,
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
    "/impresion/pacientes/:idPaciente/historias/:idHistoria/medicamentos": wrap({
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
    "/impresion/pacientes/:idPaciente/historias/:idHistoria/estudios/laboratorios": wrap({
        component: RecetaEstudios,
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
    "/impresion/pacientes/:idPaciente/historias/:idHistoria/estudios/imagenes": wrap({
        component: RecetaImagenes,
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
    "/pacientes/:idPaciente/historias/:idHistoria/imprimir/estudios": wrap({
        component: ImprimirRecetas,
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
    "/empresa/detalles": wrap({
        component: EmpresaDetalle,
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
    "/recetas": wrap({
        component: RecetasIndex,
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
    "/citas": wrap({
        component: CitasIndex,
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
    "/pacientes/:idPaciente/historias/:idHistoria/imprimir": wrap({
        component: HistoriaActual,
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