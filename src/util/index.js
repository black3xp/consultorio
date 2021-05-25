const url = 'https://xmconsulta.cthrics.com/api'
// const url = 'http://localhost:3000/api'
const isLogin = () => localStorage.getItem('auth');

export { url, isLogin }