import {push} from 'svelte-spa-router';
import jwtDecode from "jwt-decode";
import axios from 'axios';
// const url = 'https://xmconsulta.cthrics.com/api'
// const url = 'http://localhost:3000/api'
// const url = 'http://serenidad.xmedical.online:1337/api';
const url = 'https://consulta.xmedical.online/api';
// const url = 'http://localhost:1337/api';

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

const cargarImagenEmpresa = (idConsultorio, idImagen, logo) => {
    const config = {
        method: 'get',
        url: `${url}/imagenes/${idConsultorio}/${idImagen}`,
        responseType:"blob", 
        headers: {
            Authorization: `${localStorage.getItem("auth")}`,
        },
    }
    axios(config)
    .then(res => {
        return logo = URL.createObjectURL(res.data)
    })
    .catch(err => {
        console.error(err)
    })
}



let ciudades = [
    {id: 'Distrito Nacional', nombre: 'Distrito Nacional'},
    {id: 'Santiago de los Caballeros', nombre: 'Santiago de los Caballeros'},
    {id: 'Santo Domingo Este', nombre: 'Santo Domingo Este'},
    {id: 'Santo Domingo Norte', nombre: 'Santo Domingo Norte'},
    {id: 'Santo Domingo Oeste', nombre: 'Santo Domingo Oeste'},
    {id: 'San Felipe de Puerto Plata', nombre: 'San Felipe de Puerto Plata'},
    {id: 'Higüey', nombre: 'Higüey'},
    {id: 'San Francisco de Macorís', nombre: 'San Francisco de Macorís'},
    {id: 'San Cristóbal', nombre: 'San Cristóbal'},
    {id: 'San Pedro de Macoris', nombre: 'San Pedro de Macoris'},
    {id: 'Los Alcarrizos', nombre: 'Los Alcarrizos'},
    {id: 'La Vega', nombre: 'La Vega'},
    {id: 'La Romana', nombre: 'La Romana'},
    {id: 'Moca', nombre: 'Moca'},
    {id: 'Villa Altagracia', nombre: 'Villa Altagracia'},
    {id: 'San Juan de La Maguana', nombre: 'San Juan de La Maguana'},
    {id: 'Haina', nombre: 'Haina'},
    {id: 'Bonao', nombre: 'Bonao'},
    {id: 'Cotuí', nombre: 'Cotuí'},
    {id: 'Baní', nombre: 'Baní'},
    {id: 'Santa Cruz de Barahona', nombre: 'Santa Cruz de Barahona'},
    {id: 'Azua de Compostela', nombre: 'Azua de Compostela'},
    {id: 'Boca Chica', nombre: 'Boca Chica'},
    {id: 'Villa hermosa', nombre: 'Villa hermosa'},
    {id: 'Mao', nombre: 'Mao'},
    {id: 'Pedro Brand', nombre: 'Pedro Brand'},
    {id: 'San Antonio de Guerra', nombre: 'San Antonio de Guerra'},
    {id: 'San Ignacio de Sabaneta', nombre: 'San Ignacio de Sabaneta'},
    {id: 'Santa Cruz del Seibo', nombre: 'Santa Cruz del Seibo'},
    {id: 'Tamboril', nombre: 'Tamboril'},
    {id: 'Nagua', nombre: 'Nagua'},
    {id: 'Puñal', nombre: 'Puñal'},
    {id: 'Hato', nombre: 'Hato'},
    {id: 'Esperanza', nombre: 'Esperanza'},
    {id: 'Sosúa', nombre: 'Sosúa'},
    {id: 'Jarabacoa', nombre: 'Jarabacoa'},
    {id: 'San José de las Matas', nombre: 'San José de las Matas'},
    {id: 'Yamasá', nombre: 'Yamasá'},
    {id: 'Monte Plata', nombre: 'Monte Plata'},
    {id: 'Villa González', nombre: 'Villa González'},
];

let provincias = [
    {id: 'Santiago', nombre: 'Santiago'},
    {id: 'Puerto Plata', nombre: 'Puerto Plata'},
    {id: 'La Altagracia', nombre: 'La Altagracia'},
    {id: 'Duarte', nombre: 'Duarte'},
    {id: 'San Cristóbal', nombre: 'San Cristóbal'},
    {id: 'San pedro de Macoris', nombre: 'San pedro de Macoris'},
    {id: 'La vega', nombre: 'La vega'},
    {id: 'La Romana', nombre: 'La Romana'},
    {id: 'Espaillat', nombre: 'Espaillat'},
    {id: 'San Cristóbal', nombre: 'San Cristóbal'},
    {id: 'San Juan de La Maguana', nombre: 'San Juan de La Maguana'},
    {id: 'San Cristóbal', nombre: 'San Cristóbal'},
    {id: 'Monseñor Nouel', nombre: 'Monseñor Nouel'},
    {id: 'Sánchez Ramírez', nombre: 'Sánchez Ramírez'},
    {id: 'Peravia	', nombre: 'Peravia	'},
    {id: 'Barahona', nombre: 'Barahona'},
    {id: 'Azua', nombre: 'Azua'},
    {id: 'La Romana', nombre: 'La Romana'},
    {id: 'Valverde', nombre: 'Valverde'},
    {id: 'Santo Domingo', nombre: 'Santo Domingo'},
    {id: 'Santiago Rodríguez', nombre: 'Santiago Rodríguez'},
    {id: 'El Seibo', nombre: 'El Seibo'},
    {id: 'Santiago', nombre: 'Santiago'},
    {id: 'Maria Trinidad Sanchez', nombre: 'Maria Trinidad Sanchez'},
    {id: 'Santiago', nombre: 'Santiago'},
    {id: 'Mayor del Rey	Hato Mayor', nombre: 'Mayor del Rey	Hato Mayor'},
    {id: 'Valverde Mao', nombre: 'Valverde Mao'},
    {id: 'Puerto Plata', nombre: 'Puerto Plata'},
    {id: 'La vega', nombre: 'La vega'},
    {id: 'Santiago', nombre: 'Santiago'},
    {id: 'Monte plata	', nombre: 'Monte plata	'},
    {id: 'Monte Plata', nombre: 'Monte Plata'},
    {id: 'Santiago', nombre: 'Santiago'},
];
let nacionalidades = [
    {id: 'afgano', nombre: 'afgano'},
    {id: 'alemán', nombre: 'alemán'},
    {id: 'árabe', nombre: 'árabe'},
    {id: 'argentino', nombre: 'argentino'},
    {id: 'australiano', nombre: 'australiano'},
    {id: 'belga', nombre: 'belga'},
    {id: 'boliviano', nombre: 'boliviano'},
    {id: 'brasileño', nombre: 'brasileño'},
    {id: 'camboyano', nombre: 'camboyano'},
    {id: 'canadiense', nombre: 'canadiense'},
    {id: 'chileno', nombre: 'chileno'},
    {id: 'chino', nombre: 'chino'},
    {id: 'colombiano', nombre: 'colombiano'},
    {id: 'coreano', nombre: 'coreano'},
    {id: 'costarricense', nombre: 'costarricense'},
    {id: 'cubano', nombre: 'cubano'},
    {id: 'danés', nombre: 'danés'},
    {id: 'ecuatoriano', nombre: 'ecuatoriano'},
    {id: 'egipcio', nombre: 'egipcio'},
    {id: 'salvadoreño', nombre: 'salvadoreño'},
    {id: 'escocés', nombre: 'escocés'},
    {id: 'español', nombre: 'español'},
    {id: 'estadounidense', nombre: 'estadounidense'},
    {id: 'estonio', nombre: 'estonio'},
    {id: 'etiope', nombre: 'etiope'},
    {id: 'filipino', nombre: 'filipino'},
    {id: 'finlandés', nombre: 'finlandés'},
    {id: 'francés', nombre: 'francés'},
    {id: 'galés', nombre: 'galés'},
    {id: 'griego', nombre: 'griego'},
    {id: 'guatemalteco', nombre: 'guatemalteco'},
    {id: 'haitiano', nombre: 'haitiano'},
    {id: 'holandés', nombre: 'holandés'},
    {id: 'hondureño', nombre: 'hondureño'},
    {id: 'indonés', nombre: 'indonés'},
    {id: 'inglés', nombre: 'inglés'},
    {id: 'iraquí', nombre: 'iraquí'},
    {id: 'iraní', nombre: 'iraní'},
    {id: 'irlandés', nombre: 'irlandés'},
    {id: 'israelí', nombre: 'israelí'},
    {id: 'italiano', nombre: 'italiano'},
    {id: 'japonés', nombre: 'japonés'},
    {id: 'jordano', nombre: 'jordano'},
    {id: 'laosiano', nombre: 'laosiano'},
    {id: 'letón', nombre: 'letón'},
    {id: 'letonés', nombre: 'letonés'},
    {id: 'malayo', nombre: 'malayo'},
    {id: 'marroquí', nombre: 'marroquí'},
    {id: 'mexicano', nombre: 'mexicano'},
    {id: 'nicaragüense', nombre: 'nicaragüense'},
    {id: 'noruego', nombre: 'noruego'},
    {id: 'neozelandés', nombre: 'neozelandés'},
    {id: 'panameño', nombre: 'panameño'},
    {id: 'paraguayo', nombre: 'paraguayo'},
    {id: 'peruano', nombre: 'peruano'},
    {id: 'polaco', nombre: 'polaco'},
    {id: 'portugués', nombre: 'portugués'},
    {id: 'puertorriqueño', nombre: 'puertorriqueño'},
    {id: 'dominicano', nombre: 'dominicano'},
    {id: 'rumano', nombre: 'rumano'},
    {id: 'ruso', nombre: 'ruso'},
    {id: 'sueco', nombre: 'sueco'},
    {id: 'suizo', nombre: 'suizo'},
    {id: 'tailandés', nombre: 'tailandés'},
    {id: 'taiwanes', nombre: 'taiwanes'},
    {id: 'turco', nombre: 'turco'},
    {id: 'ucraniano', nombre: 'ucraniano'},
    {id: 'uruguayo', nombre: 'uruguayo'},
    {id: 'venezolano', nombre: 'venezolano'},
    {id: 'vietnamita', nombre: 'vietnamita'},
];

let exploracionFisica = [
    {nombre: 'Cabeza', activo: false, text: ''},
    {nombre: 'Cuello', activo: false, text: ''},
    {nombre: 'Torax', activo: false, text: ''},
    {nombre: 'Abdomen', activo: false, text: ''},
    {nombre: 'Espalda', activo: false, text: ''},
    {nombre: 'Extremidades superiores e inferiores', activo: false, text: ''},
    {nombre: 'Genitales', activo: false, text: ''}
]

export { url, isLogin, logout, user, calcularEdad, ciudades, provincias, nacionalidades, cargarImagenEmpresa }