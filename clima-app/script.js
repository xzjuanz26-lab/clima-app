const API_KEY = '5977396e572b9ce7e456220abd447522';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const API_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const estado = document.getElementById('estado');
const pronostico = document.getElementById('pronostico');
const historialDiv = document.getElementById('historial');
const btnUbicacion = document.getElementById('btnUbicacion');
const btnTema = document.getElementById('btnTema');

let ultimoClima = null;

async function consultarClima(ciudad) {
    estado.textContent = 'Consultando el clima...';
    resultado.classList.remove('visible');
    pronostico.innerHTML = '';

    try {
        const ciudadCodificada = encodeURIComponent(ciudad);
        const url = `${API_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            if (respuesta.status === 404) throw new Error('Ciudad no encontrada');
            if (respuesta.status === 401) throw new Error('API Key invalida');
            throw new Error('Error en la peticion: ' + respuesta.status);
        }

        const datos = await respuesta.json();
        mostrarClima(datos);
        guardarHistorial(datos.name);
        cargarPronostico(datos.name);
        estado.textContent = 'Datos actualizados correctamente.';
    } catch (error) {
        console.error('Error:', error);
        estado.textContent = `${error.message}. Intenta con otra ciudad.`;
        resultado.classList.remove('visible');
    }
}

function mostrarClima(datos) {
    const ciudad = datos.name;
    const pais = datos.sys.country;
    const temperatura = Math.round(datos.main.temp);
    const sensacion = Math.round(datos.main.feels_like);
    const humedad = datos.main.humidity;
    const presion = datos.main.pressure;
    const viento = datos.wind.speed;
    const descripcion = datos.weather[0].description;
    const icono = datos.weather[0].icon;
    const iconoUrl = `https://openweathermap.org/img/wn/${icono}@2x.png`;

    ultimoClima = { ciudad, temperatura, descripcion };

    resultado.innerHTML = `
        <div class="ciudad">${ciudad}</div>
        <div class="pais">${pais}</div>
        <img src="${iconoUrl}" alt="${descripcion}" class="icono-clima">
        <div class="temperatura">${temperatura} C</div>
        <div class="descripcion">${descripcion}</div>
        <div class="detalles">
            <div class="detalle">
                <div class="etiqueta">Sensacion</div>
                <div class="valor">${sensacion} C</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Humedad</div>
                <div class="valor">${humedad}%</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Presion</div>
                <div class="valor">${presion} hPa</div>
            </div>
            <div class="detalle">
                <div class="etiqueta">Viento</div>
                <div class="valor">${viento} m/s</div>
            </div>
        </div>
        <button class="btn-whatsapp" onclick="compartirWhatsApp()">Compartir en WhatsApp</button>
    `;

    resultado.classList.add('visible');
    cambiarFondoSegunClima(datos.weather[0].main);
}

function cambiarFondoSegunClima(clima) {
    document.body.classList.remove('clima-soleado', 'clima-nublado', 'clima-lluvioso', 'clima-nieve');
    const climaLower = clima.toLowerCase();

    if (climaLower.includes('clear')) document.body.classList.add('clima-soleado');
    else if (climaLower.includes('cloud')) document.body.classList.add('clima-nublado');
    else if (climaLower.includes('rain') || climaLower.includes('drizzle') || climaLower.includes('thunderstorm')) document.body.classList.add('clima-lluvioso');
    else if (climaLower.includes('snow')) document.body.classList.add('clima-nieve');
}

btnUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) {
        estado.textContent = 'Tu navegador no soporta geolocalizacion.';
        return;
    }

    estado.textContent = 'Obteniendo ubicacion...';

    navigator.geolocation.getCurrentPosition(
        async (posicion) => {
            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;

            try {
                const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
                const respuesta = await fetch(url);
                const datos = await respuesta.json();
                mostrarClima(datos);
                guardarHistorial(datos.name);
                cargarPronostico(datos.name);
                estado.textContent = 'Clima de tu ubicacion actual.';
            } catch (error) {
                estado.textContent = 'Error al obtener el clima.';
            }
        },
        () => {
            estado.textContent = 'No se pudo obtener tu ubicacion.';
        }
    );
});

async function cargarPronostico(ciudad) {
    try {
        const ciudadCodificada = encodeURIComponent(ciudad);
        const url = `${API_FORECAST}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        const dias = {};
        datos.list.forEach(item => {
            const fecha = item.dt_txt.split(' ')[0];
            if (!dias[fecha] && Object.keys(dias).length < 5) {
                dias[fecha] = item;
            }
        });

        pronostico.innerHTML = Object.entries(dias).map(([fecha, item]) => {
            const dia = new Date(fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric' });
            return `
                <div class="dia">
                    <div class="fecha">${dia}</div>
                    <div class="temp">${Math.round(item.main.temp)} C</div>
                    <div class="desc">${item.weather[0].description}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error pronostico:', error);
    }
}

function guardarHistorial(ciudad) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial = historial.filter(c => c.toLowerCase() !== ciudad.toLowerCase());
    historial.unshift(ciudad);
    historial = historial.slice(0, 5);
    localStorage.setItem('historial', JSON.stringify(historial));
    mostrarHistorial();
}

function mostrarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial')) || [];
    historialDiv.innerHTML = historial.map(c =>
        `<button onclick="consultarClima('${c}')">${c}</button>`
    ).join('');
}

btnTema.addEventListener('click', () => {
    document.body.classList.toggle('claro');
    btnTema.textContent = document.body.classList.contains('claro') ? 'Oscuro' : 'Claro';
});

function compartirWhatsApp() {
    if (!ultimoClima) return;
    const texto = `El clima en ${ultimoClima.ciudad} es ${ultimoClima.temperatura} C con ${ultimoClima.descripcion}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const ciudad = inputCiudad.value.trim();
    if (!ciudad) {
        estado.textContent = 'Escribe el nombre de una ciudad.';
        return;
    }
    consultarClima(ciudad);
});

estado.textContent = 'Escribe una ciudad y presiona "Consultar".';
mostrarHistorial();
