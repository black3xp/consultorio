import {push} from 'svelte-spa-router';
import jwtDecode from "jwt-decode";
// const url = 'https://xmconsulta.cthrics.com/api'
// const url = 'http://localhost:3000/api'
const url = 'http://localhost:1337/api'
const isLogin = () => {
    if(localStorage.getItem('auth')){
        return true
    }
    else
    {
        return false
    }
}

const logout = () => { 
    localStorage.removeItem('auth')
    return push('/login')
};

const user = () => {
    const decoded = jwtDecode(localStorage.getItem('auth'));
    return decoded;
}

const calcularEdad = (fecha) => {
    let hoy = new Date();
    let cumpleanos = new Date(fecha);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    let m = hoy.getMonth() - cumpleanos.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }

    return edad;
  }

export { url, isLogin, logout, user, calcularEdad }