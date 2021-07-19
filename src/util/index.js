import {push} from 'svelte-spa-router';
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

export { url, isLogin, logout }