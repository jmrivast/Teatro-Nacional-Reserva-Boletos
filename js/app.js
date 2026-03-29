// Teatro Nacional SPA con jQuery & Tailwind CSS

const localFallbackImage = document.body?.dataset?.fallbackImage || "teatro nacional app.png";

const fallbackEventsData = [
    {
        id: 1,
        title: "El Cascanueces",
        date: "2026-12-15",
        time: "20:00",
        description: "El ballet clásico de Tchaikovsky en una presentación magistral.",
        image: "https://balletdekiev.com/wp-content/uploads/2024/02/General_cascanueces_24_horizontal_2-scaled.jpg",
        price: 1500,
        category: "Ballet"
    },
    {
        id: 2,
        title: "Orquesta Sinfónica Nacional - Concierto de Primavera",
        date: "2026-04-10",
        time: "19:30",
        description: "La temporada sinfónica arranca con obras de Beethoven y Mozart.",
        image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
        price: 800,
        category: "Concierto"
    },
    {
        id: 3,
        title: "Romeo y Julieta",
        date: "2026-05-05",
        time: "20:00",
        description: "Obra teatral dirigida por María Castillo.",
        image: "https://anagnorisis.es/wp-content/uploads/2024/06/romeo-y-julieta-obra-de-teatro-1.jpg",
        price: 1000,
        category: "Obra de teatro"
    }
];

const eventsApiEndpoints = [
    "/api/eventos/",
    "http://127.0.0.1:8000/api/eventos/"
];
const authApiBaseEndpoints = [
    "/api/auth/",
    "http://127.0.0.1:8000/api/auth/"
];
const configApiEndpoints = [
    "/api/config/",
    "http://127.0.0.1:8000/api/config/"
];
const reservationsApiEndpoints = [
    "/api/reservas/",
    "http://127.0.0.1:8000/api/reservas/"
];
const fallbackAppConfig = {
    venueName: 'Teatro Nacional Eduardo Brito',
    seatMap: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F'],
        columns: 12
    }
};
const emptyBookingSummaryText = 'Selecciona al menos un asiento en el mapa para continuar';
const serverModeMessage = 'Para iniciar sesión y reservar boletos, abre la app desde http://127.0.0.1:8000/ con Django corriendo.';
const initialLoadingHtml = `
    <div class="glass-card rounded-2xl p-8 text-center text-white/70 animate-[fadeIn_0.3s_ease-in-out]">
        Cargando cartelera del Teatro Nacional...
    </div>
`;

let eventsData = fallbackEventsData.map((event) => normalizeEvent(event));
let appConfig = normalizeAppConfig(fallbackAppConfig);
let currentUser = null;
let integrationNotices = {
    events: { type: null, title: '', message: '' },
    config: { type: null, title: '', message: '' },
    reservations: { type: null, title: '', message: '' },
    seatAvailabilityByEvent: {}
};

const routes = {
    'home': renderHome,
    'events': renderEvents,
    'event-detail': renderEventDetail,
    'login': renderLogin,
    'dashboard': renderDashboard
};

$(document).ready(async function() {
    showInitialLoadingState();
    await loadAppConfig();
    await loadEvents();
    await restoreSession();
    handleRoute();
    bindGlobalUiEvents();
});

function setAppContent(html) {
    $('#app-content').html(html);
}

function showInitialLoadingState() {
    setAppContent(initialLoadingHtml);
}

function bindGlobalUiEvents() {
    $(window).on('hashchange', function() {
        handleRoute();
    });

    $('#mobile-menu-btn').on('click', function() {
        $('#mobile-nav').toggleClass('hidden');
    });

    $(document).on('click', '.mobile-link', function() {
        $('#mobile-nav').addClass('hidden');
    });
}

function getCurrentRoute() {
    let hash = window.location.hash.substring(1) || 'home';
    let path = hash.split('/')[0];

    if (path.includes('?')) {
        path = path.split('?')[0];
    }

    return {
        path: path,
        param: hash.split('/')[1]
    };
}

function isCurrentRoute(routeName) {
    return getCurrentRoute().path === routeName;
}

function clearCurrentUserState() {
    currentUser = null;
    clearIntegrationNotice('reservations');
    updateNavigation();
}

function isServerRenderedSessionAvailable() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

function handleRoute() {
    const { path, param } = getCurrentRoute();

    $('#app-content').empty();

    if (routes[path]) {
        routes[path](param);
    } else {
        renderHome();
    }
    window.scrollTo(0, 0);
}

function getAuthenticatedDesktopNavHtml() {
    return `
        <a href="#dashboard" class="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-primary-light transition-colors">Mis Reservas</a>
        <button id="btn-logout" class="flex items-center gap-2 text-sm font-medium text-danger hover:text-red-300 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> 
            Salir
        </button>
    `;
}

function getAuthenticatedMobileNavHtml() {
    return `
        <a href="#dashboard" class="flex items-center gap-2 text-base font-medium text-white/80 hover:text-primary-light mobile-link">Mis Reservas</a>
        <button id="btn-logout-mobile" class="flex items-center gap-2 text-base font-medium text-danger hover:text-red-300 mobile-link">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> 
            Cerrar Sesión
        </button>
    `;
}

function getGuestDesktopNavHtml() {
    return `
        <a href="#login" class="text-sm font-medium text-white/80 hover:text-primary-light transition-colors">Iniciar Sesión</a>
        <a href="#login?register=true" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors text-sm font-medium">Registrarse</a>
    `;
}

function getGuestMobileNavHtml() {
    return `
        <a href="#login" class="block text-center text-base font-medium border border-white/20 py-2 rounded-md hover:bg-white/5 mobile-link text-white/90">Iniciar Sesión</a>
        <a href="#login?register=true" class="block text-center text-base font-medium bg-primary hover:bg-primary-dark py-2 rounded-md mobile-link text-white">Registrarse</a>
    `;
}

async function handleLogout() {
    const confirmed = await showAppConfirmModal(
        '¿Seguro que quieres cerrar tu sesión actual?',
        {
            title: 'Cerrar Sesión',
            type: 'confirm',
            confirmLabel: 'Sí, salir',
            cancelLabel: 'Quedarme'
        }
    );

    if (!confirmed) {
        return;
    }

    await logoutRequest();
    clearCurrentUserState();
    window.location.hash = 'home';
}

function bindLogoutButtons() {
    $('#btn-logout, #btn-logout-mobile').on('click', handleLogout);
}

function updateNavigation() {
    if (currentUser) {
        $('#auth-actions').html(getAuthenticatedDesktopNavHtml());
        $('#mobile-auth-actions').html(getAuthenticatedMobileNavHtml());
        bindLogoutButtons();
        return;
    }

    $('#auth-actions').html(getGuestDesktopNavHtml());
    $('#mobile-auth-actions').html(getGuestMobileNavHtml());
}

function formatCurrency(value) {
    return `RD$ ${Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDateLabel(value) {
    if (!value) return 'Fecha por confirmar';

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('es-DO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatTimeLabel(value) {
    if (!value) return 'Hora por confirmar';

    const [hours = '0', minutes = '00'] = value.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString('es-DO', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function resolveApiEndpoint(endpoint) {
    if (/^https?:\/\//i.test(endpoint)) {
        return endpoint;
    }

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return endpoint;
    }

    return `http://127.0.0.1:8000${endpoint}`;
}

function getApiCandidates(endpoints) {
    const seen = new Set();

    return endpoints
        .map((endpoint) => resolveApiEndpoint(endpoint))
        .filter((endpoint) => {
            if (seen.has(endpoint)) {
                return false;
            }

            seen.add(endpoint);
            return true;
        });
}

function getAuthEndpointCandidates(action) {
    return getApiCandidates(authApiBaseEndpoints).map((endpoint) => `${endpoint}${action}/`);
}

function buildApiUrl(endpoint) {
    if (/^https?:\/\//i.test(endpoint)) {
        return new URL(endpoint);
    }

    return new URL(endpoint, window.location.origin);
}

function clearIntegrationNotice(key) {
    integrationNotices[key] = { type: null, title: '', message: '' };
}

function setIntegrationNotice(key, notice) {
    integrationNotices[key] = {
        type: notice.type || 'info',
        title: notice.title || 'Aviso',
        message: notice.message || ''
    };
}

function getIntegrationNotice(key) {
    return integrationNotices[key] || { type: null, title: '', message: '' };
}

function hasIntegrationNotice(key) {
    const notice = getIntegrationNotice(key);
    return Boolean(notice.type && notice.message);
}

function clearSeatAvailabilityNotice(eventId) {
    delete integrationNotices.seatAvailabilityByEvent[String(eventId)];
}

function setSeatAvailabilityNotice(eventId, notice) {
    integrationNotices.seatAvailabilityByEvent[String(eventId)] = {
        type: notice.type || 'info',
        title: notice.title || 'Aviso',
        message: notice.message || ''
    };
}

function getSeatAvailabilityNotice(eventId) {
    return integrationNotices.seatAvailabilityByEvent[String(eventId)] || {
        type: null,
        title: '',
        message: ''
    };
}

function normalizeAppConfig(config) {
    const seatMap = config.seatMap ?? config.seat_map ?? {};
    const rows = Array.isArray(seatMap.rows) ? seatMap.rows : fallbackAppConfig.seatMap.rows;
    const columns = Number(seatMap.columns ?? fallbackAppConfig.seatMap.columns);

    return {
        venueName: config.venueName ?? config.venue_name ?? fallbackAppConfig.venueName,
        seatMap: {
            rows: rows.length > 0 ? rows : fallbackAppConfig.seatMap.rows,
            columns: Number.isInteger(columns) && columns > 0 ? columns : fallbackAppConfig.seatMap.columns
        }
    };
}

function getSeatColumns() {
    return Array.from({ length: appConfig.seatMap.columns }, (_, index) => index + 1);
}

function buildReservationQrUrl(reservationId) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(reservationId)}`;
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));

    return {
        response: response,
        payload: payload
    };
}

async function loadAppConfig() {
    clearIntegrationNotice('config');

    for (const endpoint of getApiCandidates(configApiEndpoints)) {
        try {
            const { response, payload } = await requestJson(endpoint, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                continue;
            }

            appConfig = normalizeAppConfig(payload);
            return;
        } catch (error) {
            // Si el backend no responde, mantenemos la configuracion local.
        }
    }

    appConfig = normalizeAppConfig(fallbackAppConfig);

    if (isServerRenderedSessionAvailable()) {
        setIntegrationNotice('config', {
            type: 'error',
            title: 'Configuración Local Activa',
            message: 'No se pudo cargar la configuración real del teatro. Se usará la configuración local de respaldo mientras el backend vuelva a responder.'
        });
    }
}

function normalizeEvent(event) {
    const date = event.date ?? event.fecha ?? '';
    const time = event.time ?? event.hora ?? '';
    const priceValue = Number(event.priceValue ?? event.price ?? event.precio ?? 0);

    return {
        id: event.id,
        title: event.title ?? event.titulo ?? 'Evento sin título',
        date: date,
        dateLabel: event.dateLabel ?? event.date_label ?? formatDateLabel(date),
        time: time,
        timeLabel: event.timeLabel ?? event.time_label ?? formatTimeLabel(time),
        description: event.description ?? event.descripcion ?? '',
        image: event.image ?? event.imagen ?? localFallbackImage,
        priceValue: priceValue,
        priceLabel: event.priceLabel ?? event.price_label ?? formatCurrency(priceValue),
        category: event.category ?? event.categoria ?? 'Evento cultural'
    };
}

function normalizeReservation(reservation) {
    const seats = Array.isArray(reservation.seats)
        ? reservation.seats
        : Array.isArray(reservation.asientos)
            ? reservation.asientos
            : String(reservation.asientos ?? '')
                .split(',')
                .map((seat) => seat.trim())
                .filter(Boolean);

    return {
        id: reservation.id ?? reservation.codigo_reserva ?? Math.random().toString(36).slice(2, 8).toUpperCase(),
        event: normalizeEvent(reservation.event ?? reservation.evento ?? {}),
        seats: seats,
        total: Number(reservation.total ?? reservation.total_pagado ?? 0),
        date: reservation.fecha_reserva
            ? new Date(reservation.fecha_reserva).toLocaleDateString('es-DO')
            : new Date().toLocaleDateString('es-DO'),
        status: reservation.estado ?? 'confirmada'
    };
}

function normalizeUser(user) {
    return {
        id: user.id,
        name: user.name ?? user.nombre ?? user.username ?? 'Usuario',
        email: user.email ?? '',
        username: user.username ?? '',
        role: 'user',
        reservations: []
    };
}

async function loadEvents() {
    clearIntegrationNotice('events');

    for (const endpoint of getApiCandidates(eventsApiEndpoints)) {
        try {
            const { response, payload } = await requestJson(endpoint, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                continue;
            }

            if (Array.isArray(payload.eventos)) {
                eventsData = payload.eventos.map((event) => normalizeEvent(event));
                return;
            }
        } catch (error) {
            // Si el backend no está disponible, usamos los datos de demostración.
        }
    }

    if (isServerRenderedSessionAvailable()) {
        eventsData = [];
        setIntegrationNotice('events', {
            type: 'error',
            title: 'Cartelera No Disponible',
            message: 'No se pudo cargar la cartelera real desde el backend. Revisa que Django siga corriendo y vuelve a intentarlo.'
        });
        return;
    }

    eventsData = fallbackEventsData.map((event) => normalizeEvent(event));
}

async function loadReservations() {
    clearIntegrationNotice('reservations');

    for (const endpoint of getApiCandidates(reservationsApiEndpoints)) {
        try {
            const { response, payload } = await requestJson(endpoint, {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.status === 401) {
                return [];
            }

            if (!response.ok) {
                continue;
            }

            if (Array.isArray(payload.reservas)) {
                return payload.reservas.map((reservation) => normalizeReservation(reservation));
            }
        } catch (error) {
            // Si el backend no responde, dejamos el dashboard vacio.
        }
    }

    if (currentUser && isServerRenderedSessionAvailable()) {
        setIntegrationNotice('reservations', {
            type: 'error',
            title: 'Reservas No Sincronizadas',
            message: 'No se pudieron consultar tus reservas reales en este momento. Recarga la página e inténtalo nuevamente.'
        });
        return Array.isArray(currentUser.reservations) ? currentUser.reservations : [];
    }

    return [];
}

async function authRequest(action, payload) {
    let lastNetworkError = null;

    for (const endpoint of getAuthEndpointCandidates(action)) {
        try {
            const { response, payload: responsePayload } = await requestJson(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return responsePayload.usuario;
            }

            if (response.status >= 500) {
                lastNetworkError = new Error(responsePayload.mensaje || 'El servicio de autenticacion no respondio correctamente.');
                continue;
            }

            const error = new Error(responsePayload.mensaje || 'No se pudo completar la autenticacion.');
            error.status = response.status;
            error.payload = responsePayload;
            throw error;
        } catch (error) {
            if (typeof error.status === 'number') {
                throw error;
            }

            lastNetworkError = error;
        }
    }

    throw lastNetworkError || new Error('No fue posible conectar con el backend de autenticacion.');
}

async function loadSessionUser() {
    for (const endpoint of getAuthEndpointCandidates('session')) {
        try {
            const { response, payload } = await requestJson(endpoint, {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.status === 401) {
                return null;
            }

            if (!response.ok) {
                continue;
            }

            if (payload.usuario) {
                return normalizeUser(payload.usuario);
            }
        } catch (error) {
            // Si la sesion no puede consultarse, seguimos como invitado.
        }
    }

    return null;
}

async function restoreSession() {
    if (!isServerRenderedSessionAvailable()) {
        clearCurrentUserState();
        return;
    }

    const sessionUser = await loadSessionUser();

    currentUser = sessionUser;
    if (currentUser) {
        currentUser.reservations = await loadReservations();
    }

    updateNavigation();
}

function getReservationsSignature(reservations) {
    return JSON.stringify(
        (reservations || []).map((reservation) => ({
            id: reservation.id,
            seats: reservation.seats,
            total: reservation.total,
            status: reservation.status
        }))
    );
}

async function refreshCurrentUserReservations() {
    if (!currentUser) return false;

    const previousSignature = getReservationsSignature(currentUser.reservations);
    const previousNoticeMessage = getIntegrationNotice('reservations').message;
    const refreshedReservations = await loadReservations();

    if (!currentUser) return false;

    currentUser.reservations = refreshedReservations;
    return previousSignature !== getReservationsSignature(refreshedReservations)
        || previousNoticeMessage !== getIntegrationNotice('reservations').message;
}

async function handleUnauthorizedSession(message) {
    clearCurrentUserState();
    await showAppMessageModal(
        message || 'Tu sesión ya no está activa. Inicia sesión de nuevo para continuar.',
        { title: 'Sesión Expirada', type: 'error' }
    );
    window.location.hash = 'login';
}

async function logoutRequest() {
    for (const endpoint of getAuthEndpointCandidates('logout')) {
        try {
            const { response } = await requestJson(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.ok || response.status === 401) {
                return;
            }
        } catch (error) {
            // Si el backend no responde, limpiamos la sesion local igualmente.
        }
    }
}

async function loadBookedSeatsForEvent(eventId) {
    if (!eventId) return [];

    clearSeatAvailabilityNotice(eventId);

    for (const endpoint of getApiCandidates(reservationsApiEndpoints)) {
        try {
            const requestUrl = buildApiUrl(endpoint);
            requestUrl.searchParams.set('evento_id', eventId);

            const { response, payload } = await requestJson(requestUrl.toString(), {
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                continue;
            }

            if (Array.isArray(payload.asientos_reservados)) {
                return payload.asientos_reservados;
            }
        } catch (error) {
            // Si el backend no responde, dejamos el mapa sin ocupacion remota.
        }
    }

    if (isServerRenderedSessionAvailable()) {
        setSeatAvailabilityNotice(eventId, {
            type: 'error',
            title: 'Mapa No Sincronizado',
            message: 'No se pudo verificar la ocupación real de los asientos. Recarga la página antes de intentar comprar.'
        });
    }

    return [];
}

async function createReservation(payload) {
    let lastNetworkError = null;

    for (const endpoint of getApiCandidates(reservationsApiEndpoints)) {
        try {
            const { response, payload: responsePayload } = await requestJson(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return responsePayload.reserva;
            }

            if (response.status >= 500) {
                lastNetworkError = new Error(responsePayload.mensaje || 'El endpoint de reservas no respondio correctamente.');
                continue;
            }

            const error = new Error(responsePayload.mensaje || 'No se pudo crear la reserva.');
            error.status = response.status;
            error.payload = responsePayload;
            throw error;
        } catch (error) {
            if (typeof error.status === 'number') {
                throw error;
            }

            lastNetworkError = error;
        }
    }

    throw lastNetworkError || new Error('No fue posible conectar con el backend de reservas.');
}

function createSeatMapHtml(bookedSeats) {
    let seatRowsHtml = '';

    appConfig.seatMap.rows.forEach((row) => {
        let seatsHtml = '';

        getSeatColumns().forEach((col) => {
            const seatId = `${row}${col}`;
            const isBooked = bookedSeats.has(seatId);
            const baseClass = "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-medium transition-all seat-btn";
            const stateClass = isBooked
                ? 'bg-white/10 text-white/20 cursor-not-allowed booked'
                : 'bg-white/20 text-white/70 hover:bg-primary/80 hover:text-white cursor-pointer available';

            seatsHtml += `<button type="button" class="${baseClass} ${stateClass}" data-seat="${seatId}" ${isBooked ? 'disabled' : ''}>${col}</button>`;
        });

        seatRowsHtml += `
            <div class="flex items-center gap-2 sm:gap-4 justify-center mb-3">
                <span class="w-6 text-center font-bold text-white/50 text-sm">${row}</span>
                <div class="flex gap-1 sm:gap-2">${seatsHtml}</div>
                <span class="w-6 text-center font-bold text-white/50 text-sm">${row}</span>
            </div>
        `;
    });

    return seatRowsHtml;
}

function createBookingSummaryHtml(selectedSeats) {
    if (selectedSeats.length === 0) {
        return emptyBookingSummaryText;
    }

    return `
        ${selectedSeats.length} boleto(s): 
        <span class="text-primary-light font-bold Tracking-wider">${selectedSeats.join(', ')}</span>
    `;
}

function getModalVariantConfig(type = 'info') {
    const variants = {
        info: {
            borderClass: 'border-primary/20',
            iconRingClass: 'border-primary',
            iconTextClass: 'text-primary',
            primaryButtonClass: 'bg-primary hover:bg-primary-dark text-white',
            iconShadowClass: 'shadow-[0_0_15px_rgba(177,32,36,0.2)]',
            iconMarkup: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8h.01M11 12h1v4h1"></path><circle cx="12" cy="12" r="9" stroke-width="2"></circle></svg>'
        },
        error: {
            borderClass: 'border-red-500/25',
            iconRingClass: 'border-red-400',
            iconTextClass: 'text-red-400',
            primaryButtonClass: 'bg-red-500 hover:bg-red-400 text-white',
            iconShadowClass: 'shadow-[0_0_15px_rgba(248,113,113,0.2)]',
            iconMarkup: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01"></path><circle cx="12" cy="12" r="9" stroke-width="2"></circle></svg>'
        },
        confirm: {
            borderClass: 'border-primary/20',
            iconRingClass: 'border-primary',
            iconTextClass: 'text-primary',
            primaryButtonClass: 'bg-primary hover:bg-primary-dark text-white',
            iconShadowClass: 'shadow-[0_0_15px_rgba(177,32,36,0.2)]',
            iconMarkup: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="9" stroke-width="2"></circle></svg>'
        },
        success: {
            borderClass: 'border-emerald-500/25',
            iconRingClass: 'border-emerald-400',
            iconTextClass: 'text-emerald-400',
            primaryButtonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
            iconShadowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
            iconMarkup: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path><circle cx="12" cy="12" r="9" stroke-width="2"></circle></svg>'
        }
    };

    return variants[type] || variants.info;
}

function createInlineStatusCard(title, message, options = {}) {
    const variant = getModalVariantConfig(options.type || 'info');
    const compact = options.compact !== false;
    const paddingClass = compact ? 'p-4 rounded-xl' : 'p-6 rounded-2xl';
    const iconBoxClass = compact ? 'w-12 h-12' : 'w-14 h-14';
    const iconSizeClass = compact ? 'w-5 h-5' : 'w-6 h-6';
    const titleClass = compact ? 'text-base' : 'text-lg';
    const messageClass = compact ? 'text-sm' : 'text-base';

    return `
        <div class="glass-card border ${variant.borderClass} ${paddingClass} shadow-xl">
            <div class="flex items-start gap-4">
                <div class="${iconBoxClass} rounded-full border-4 ${variant.iconRingClass} ${variant.iconTextClass} ${variant.iconShadowClass} flex items-center justify-center shrink-0">
                    ${variant.iconMarkup.replace('w-8 h-8', iconSizeClass)}
                </div>
                <div class="min-w-0">
                    <h3 class="${titleClass} font-bold text-white mb-1">${title}</h3>
                    <p class="${messageClass} text-white/70 leading-relaxed">${message}</p>
                </div>
            </div>
        </div>
    `;
}

function getIntegrationNoticeHtml(key, options = {}) {
    const notice = getIntegrationNotice(key);

    if (!notice.type || !notice.message) {
        return '';
    }

    return createInlineStatusCard(notice.title, notice.message, {
        type: notice.type,
        compact: options.compact
    });
}

function getSeatAvailabilityNoticeHtml(eventId, options = {}) {
    const notice = getSeatAvailabilityNotice(eventId);

    if (!notice.type || !notice.message) {
        return '';
    }

    return createInlineStatusCard(notice.title, notice.message, {
        type: notice.type,
        compact: options.compact
    });
}

function updateEventDetailNotices(eventId, options = {}) {
    const notices = [];
    const configNoticeHtml = getIntegrationNoticeHtml('config', { compact: true });
    const seatNoticeHtml = getSeatAvailabilityNoticeHtml(eventId, { compact: true });

    if (configNoticeHtml) {
        notices.push(configNoticeHtml);
    }

    if (options.pendingSync) {
        notices.push(
            createInlineStatusCard(
                'Verificando Asientos',
                'Estamos consultando la ocupación real del evento antes de habilitar la compra.',
                { type: 'info', compact: true }
            )
        );
    }

    if (seatNoticeHtml) {
        notices.push(seatNoticeHtml);
    }

    const container = $('#event-detail-notices');
    if (!container.length) {
        return;
    }

    if (notices.length === 0) {
        container.addClass('hidden').empty();
        return;
    }

    container.removeClass('hidden').html(notices.join(''));
}

function createPurchaseModalHtml(event, reservation) {
    const variant = getModalVariantConfig('success');

    return `
        <div id="purchase-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-in-out]">
            <div class="bg-[#0a0a0a] border ${variant.borderClass} rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center">
                <div class="w-20 h-20 rounded-full border-4 ${variant.iconRingClass} ${variant.iconTextClass} ${variant.iconShadowClass} flex items-center justify-center mb-6">
                    ${variant.iconMarkup.replace('w-8 h-8', 'w-10 h-10')}
                </div>
                <h3 class="text-3xl font-bold text-white mb-2 tracking-wide text-center">¡Reserva Confirmada!</h3>
                <p class="text-white/70 text-center mb-8">Tus boletos para <strong class="text-white">${event.title}</strong> han sido reservados con éxito.</p>
                
                <div class="w-full bg-[#141414] rounded-xl p-5 mb-8 border border-white/5">
                    <div class="flex justify-between mb-4 mt-1">
                        <span class="text-white/50 text-base">Asientos:</span>
                        <span class="text-primary font-bold text-lg">${reservation.seats.join(', ')}</span>
                    </div>
                    <div class="flex justify-between mb-1">
                        <span class="text-white/50 text-base">Total pagado:</span>
                        <span class="text-white font-bold text-lg">${formatCurrency(reservation.total)}</span>
                    </div>
                </div>

                <div class="w-full flex gap-4">
                    <button id="modal-ver-reservas" class="flex-1 ${variant.primaryButtonClass} font-bold py-3 px-4 rounded-lg transition-colors shadow-lg">Ver mis reservas</button>
                    <button id="modal-seguir" class="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium py-3 px-4 rounded-lg transition-colors border border-white/5">Seguir explorando</button>
                </div>
            </div>
        </div>
    `;
}

function createAppMessageModalHtml(message, options = {}) {
    const title = options.title || 'Aviso';
    const buttonLabel = options.buttonLabel || 'Entendido';
    const variant = getModalVariantConfig(options.type || 'info');

    return `
        <div id="app-message-modal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-in-out]">
            <div class="bg-[#0a0a0a] border ${variant.borderClass} rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div class="w-16 h-16 rounded-full border-4 ${variant.iconRingClass} ${variant.iconTextClass} ${variant.iconShadowClass} flex items-center justify-center mb-6 mx-auto">
                    ${variant.iconMarkup}
                </div>
                <h3 class="text-2xl font-bold text-white mb-3 tracking-wide text-center">${title}</h3>
                <p class="text-white/70 text-center mb-8 leading-relaxed">${message}</p>
                <button id="app-message-modal-close" class="w-full ${variant.primaryButtonClass} font-medium py-3 px-4 rounded-lg transition-colors shadow-lg">${buttonLabel}</button>
            </div>
        </div>
    `;
}

function createAppConfirmModalHtml(message, options = {}) {
    const title = options.title || 'Confirmar';
    const confirmLabel = options.confirmLabel || 'Confirmar';
    const cancelLabel = options.cancelLabel || 'Cancelar';
    const variant = getModalVariantConfig(options.type || 'confirm');

    return `
        <div id="app-confirm-modal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-in-out]">
            <div class="bg-[#0a0a0a] border ${variant.borderClass} rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div class="w-16 h-16 rounded-full border-4 ${variant.iconRingClass} ${variant.iconTextClass} ${variant.iconShadowClass} flex items-center justify-center mb-6 mx-auto">
                    ${variant.iconMarkup}
                </div>
                <h3 class="text-2xl font-bold text-white mb-3 tracking-wide text-center">${title}</h3>
                <p class="text-white/70 text-center mb-8 leading-relaxed">${message}</p>
                <div class="flex gap-4">
                    <button id="app-confirm-modal-cancel" class="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium py-3 px-4 rounded-lg transition-colors border border-white/5">${cancelLabel}</button>
                    <button id="app-confirm-modal-confirm" class="flex-1 ${variant.primaryButtonClass} font-medium py-3 px-4 rounded-lg transition-colors shadow-lg">${confirmLabel}</button>
                </div>
            </div>
        </div>
    `;
}

function closeAppMessageModal() {
    $('#app-message-modal').remove();
}

function showAppMessageModal(message, options = {}) {
    closeAppMessageModal();
    $('body').append(createAppMessageModalHtml(message, options));

    return new Promise((resolve) => {
        $('#app-message-modal-close').on('click', function() {
            closeAppMessageModal();
            resolve();
        });

        $('#app-message-modal').on('click', function(event) {
            if (event.target === this) {
                closeAppMessageModal();
                resolve();
            }
        });
    });
}

function closeAppConfirmModal() {
    $('#app-confirm-modal').remove();
}

function showAppConfirmModal(message, options = {}) {
    closeAppConfirmModal();
    $('body').append(createAppConfirmModalHtml(message, options));

    return new Promise((resolve) => {
        $('#app-confirm-modal-cancel').on('click', function() {
            closeAppConfirmModal();
            resolve(false);
        });

        $('#app-confirm-modal-confirm').on('click', function() {
            closeAppConfirmModal();
            resolve(true);
        });

        $('#app-confirm-modal').on('click', function(event) {
            if (event.target === this) {
                closeAppConfirmModal();
                resolve(false);
            }
        });
    });
}

function bindPurchaseModalActions() {
    $('#modal-ver-reservas').on('click', function() {
        $('#purchase-modal').remove();
        window.location.hash = 'dashboard';
    });

    $('#modal-seguir').on('click', function() {
        $('#purchase-modal').remove();
        window.location.hash = 'events';
    });
}

function createEventDetailHtml(event, seatMapHtml) {
    return `
        <div class="animate-[fadeIn_0.3s_ease-in-out] max-w-5xl mx-auto w-full pb-24 md:pb-8">
            <div class="mb-6">
                <a href="#events" class="inline-flex items-center gap-2 text-primary-light hover:text-primary font-medium transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Volver a cartelera
                </a>
            </div>

            <div class="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row mb-8 shadow-2xl">
                <div class="w-full md:w-2/5 shrink-0">
                    <img src="${event.image}" class="w-full h-64 md:h-full object-cover bg-neutral-900" alt="${event.title}" onerror="this.src='${localFallbackImage}'">
                </div>
                <div class="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
                     <p class="text-primary-light font-medium flex items-center gap-2 mb-3 text-sm">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${event.dateLabel}
                     </p>
                    <h2 class="text-3xl md:text-4xl font-bold mb-4 text-white">${event.title}</h2>
                    <p class="text-lg text-white/70 leading-relaxed mb-8">${event.description}</p>
                    <p class="text-sm text-white/50 mb-8">Hora: ${event.timeLabel} | Categoría: ${event.category}</p>
                    
                    <div class="mt-auto pt-6 border-t border-white/10 flex justify-between items-center tracking-wide">
                         <div>
                            <span class="block text-sm text-white/50 mb-1">Precio Entradas Cajas</span>
                            <strong class="text-2xl text-primary-light">${event.priceLabel}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass-card rounded-2xl p-4 sm:p-8 mb-8 shadow-xl">
                <h3 class="text-2xl font-bold mb-2 text-center text-white">Selecciona tus asientos</h3>
                <p class="text-center text-white/60 mb-6 text-sm">Haz clic en los asientos disponibles para agregarlos a tu compra.</p>
                <div id="event-detail-notices" class="hidden space-y-4 mb-10"></div>
                
                <div class="w-full overflow-x-auto custom-scrollbar pb-6">
                    <div class="min-w-max mx-auto flex flex-col items-center px-4">
                        <div class="w-64 sm:w-80 h-10 bg-primary/20 border-t-2 border-x-2 border-primary rounded-t-[100px] mb-12 flex items-center justify-center shadow-[0_-10px_30px_rgba(177,32,36,0.15)] relative">
                            <span class="text-primary-light font-bold tracking-[0.2em] uppercase text-sm absolute bottom-2">Escenario</span>
                        </div>
                        
                        <div class="flex flex-col">
                            ${seatMapHtml}
                        </div>

                        <div class="flex flex-wrap gap-6 mt-12 justify-center bg-black/30 py-4 px-8 rounded-full border border-white/5">
                            <div class="flex items-center gap-3">
                                <div class="w-5 h-5 rounded-md bg-white/20"></div>
                                <span class="text-sm font-medium text-white/70">Disponible</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-5 h-5 rounded-md bg-primary shadow-[0_0_12px_rgba(177,32,36,0.6)]"></div>
                                <span class="text-sm font-medium text-white/70">Seleccionado</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-5 h-5 rounded-md bg-white/10"></div>
                                <span class="text-sm font-medium text-white/40">Ocupado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="fixed bottom-0 left-0 w-full md:static bg-black/95 md:bg-transparent md:border-none border-t border-white/10 backdrop-blur-xl p-4 md:p-0 z-40">
                <div class="max-w-5xl mx-auto md:glass-card md:rounded-2xl md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div class="w-full sm:w-auto text-center sm:text-left">
                        <h4 class="text-lg font-bold text-white mb-1">Resumen de Compra</h4>
                        <div id="booking-summary" class="text-white/60 text-sm min-h-[1.5rem]">
                            ${emptyBookingSummaryText}
                        </div>
                    </div>
                    
                    <button id="btn-comprar" class="w-full sm:w-auto bg-primary hover:bg-primary-dark disabled:bg-primary/30 disabled:text-white/30 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg" disabled>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                        Comprar Boletas
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createReservationCard(reservation) {
    return `
        <div class="flex flex-row bg-[#f5f1eb] rounded-2xl md:rounded-[24px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)] md:min-h-[280px]">
            <div class="w-16 md:w-[120px] bg-black relative flex items-center justify-center shrink-0 overflow-hidden">
                <img src="${reservation.event.image}" class="absolute inset-0 w-full h-full object-cover opacity-60" onerror="this.src='${localFallbackImage}'">
                <div class="relative z-10 w-full h-full py-4 md:px-4 flex items-center justify-center border-r-[2px] md:border-r-[3px] border-dashed border-white/40">
                     <span class="text-primary font-black tracking-[0.2em] md:tracking-[0.35em] uppercase rotate-180 whitespace-nowrap text-[10px] md:text-sm drop-shadow-md" style="writing-mode: vertical-rl;">${reservation.event.category || 'OBRA DE TEATRO'}</span>
                </div>
            </div>

            <div class="p-4 md:p-6 flex-1 text-black relative flex flex-col justify-between bg-[#f5f1eb]">
                <div class="hidden md:block absolute top-0 right-0 w-16 h-16 bg-[#e1ddd7] rounded-bl-[40px] shadow-inner"></div>

                <div class="relative z-10">
                    <h4 class="text-lg md:text-2xl font-black mb-3 md:mb-5 uppercase tracking-tight text-gray-900 leading-tight pr-0 md:pr-10">${reservation.event.title}</h4>
                    
                    <div class="space-y-2 md:space-y-3 mb-4">
                        <div class="flex items-center gap-2 md:gap-3 text-gray-700 text-xs md:text-sm">
                            <svg class="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span class="font-medium">${reservation.event.dateLabel}</span>
                        </div>
                        <div class="flex items-center gap-2 md:gap-3 text-gray-700 text-xs md:text-sm">
                            <svg class="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="font-medium">${reservation.event.timeLabel}</span>
                        </div>
                        <div class="flex items-center gap-2 md:gap-3 text-gray-700 text-xs md:text-sm">
                            <svg class="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span class="font-medium">${appConfig.venueName}</span>
                        </div>
                    </div>
                </div>
                
                <div class="border-t border-dashed border-gray-400 pt-3 md:pt-4 flex justify-between items-end gap-2 relative z-10">
                    <div>
                        <p class="text-[9px] md:text-[10px] text-gray-500 font-bold mb-0.5 md:mb-1 uppercase tracking-wider">Asientos Reservados</p>
                        <p class="text-base md:text-xl font-black text-primary mb-1 md:mb-2 leading-none">${reservation.seats.join(', ')}</p>
                        <p class="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Total Pagado</p>
                        <p class="text-xs md:text-sm font-black text-gray-900 leading-none">${formatCurrency(reservation.total)}</p>
                    </div>
                    <div class="text-center bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center shrink-0">
                        <img src="${buildReservationQrUrl(reservation.id)}" class="w-12 h-12 md:w-16 md:h-16 mb-1 mx-auto" alt="QR Code">
                        <p class="text-[8px] md:text-[9px] text-gray-500 font-bold tracking-widest uppercase">ID: ${reservation.id}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createEmptyReservationsHtml() {
    return `
        <div class="glass-card rounded-2xl p-6 md:p-8 shadow-2xl mt-10">
            <h3 class="text-xl font-semibold mb-6 flex items-center gap-3 text-white">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                Mis Boletas y Reservas
            </h3>
            <div class="bg-black/40 rounded-xl p-12 text-center border border-white/5">
                <svg class="w-20 h-20 text-white/10 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                <p class="text-white/60 mb-8 text-lg">Actualmente no cuentas con ninguna boleta o reserva activa para obras futuras.</p>
                <a href="#events" class="inline-block bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-md transition-colors border border-white/10 shadow-lg">Explorar Cartelera de Eventos</a>
            </div>
        </div>
    `;
}

function createDashboardHtml(reservationsHtml) {
    return `
        <div class="animate-[fadeIn_0.3s_ease-in-out] max-w-5xl mx-auto pt-4 pb-12">
            <div class="flex items-center gap-4 md:gap-6 mb-8 border-b border-white/10 pb-6 md:pb-10">
                <div class="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-[0_0_20px_rgba(177,32,36,0.4)] shrink-0">
                    ${currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 class="text-2xl md:text-3xl font-bold text-white mb-0.5 md:mb-1 tracking-tight">Mis Reservas</h2>
                    <p class="text-white/70 font-medium text-sm md:text-base">Hola, ${currentUser.name}. Aquí están tus boletos digitales.</p>
                </div>
            </div>

            ${reservationsHtml}
        </div>
    `;
}

// ----- PAGES ----- //

function renderHome() {
    const eventsNoticeHtml = getIntegrationNoticeHtml('events', { compact: false });
    const html = `
        <div class="animate-[fadeIn_0.3s_ease-in-out]">
            <div class="text-center py-12 md:py-24 px-4 bg-gradient-to-t from-black/60 to-transparent rounded-2xl mb-12 shadow-2xl border border-white/5">
                <h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-lg text-white">Bienvenidos al Teatro Nacional</h2>
                <p class="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">Descubre las obras, ballet, sinfonías y eventos culturales más importantes del país.</p>
                <a href="#events" class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-8 py-3 rounded-md transition-colors text-lg shadow-lg">
                    Ver Cartelera
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>

            ${eventsNoticeHtml ? `<div class="mb-8">${eventsNoticeHtml}</div>` : ''}
            <h2 class="text-2xl md:text-3xl font-bold mb-8 tracking-tight text-center md:text-left text-white border-b border-white/10 pb-4">Eventos Destacados</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" id="featured-events">
                <!-- Dynamically loaded -->
            </div>
        </div>
    `;

    setAppContent(html);

    appendEventCards($('#featured-events'), eventsData.slice(0, 3), {
        hideEmptyState: hasIntegrationNotice('events')
    });
}

function renderEvents() {
    const eventsNoticeHtml = getIntegrationNoticeHtml('events', { compact: false });
    const html = `
        <div class="animate-[fadeIn_0.3s_ease-in-out]">
            <h2 class="text-2xl md:text-3xl font-bold mb-8 tracking-tight text-center md:text-left text-white border-b border-white/10 pb-4">Cartelera Completa</h2>
            ${eventsNoticeHtml ? `<div class="mb-8">${eventsNoticeHtml}</div>` : ''}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" id="all-events"></div>
        </div>
    `;

    setAppContent(html);

    appendEventCards($('#all-events'), eventsData, {
        hideEmptyState: hasIntegrationNotice('events')
    });
}

function renderEventDetail(id) {
    const event = eventsData.find(e => e.id == id);
    if (!event) {
        window.location.hash = 'events';
        return;
    }

    const bookedSeats = new Set();
    let selectedSeats = [];
    let seatSyncReady = !isServerRenderedSessionAvailable();
    setAppContent(createEventDetailHtml(event, createSeatMapHtml(bookedSeats)));
    updateEventDetailNotices(event.id, { pendingSync: isServerRenderedSessionAvailable() });

    function markSeatAsBooked(seatId) {
        bookedSeats.add(seatId);
        selectedSeats = selectedSeats.filter((idSeleccionado) => idSeleccionado !== seatId);

        const seatButton = $(`.seat-btn[data-seat="${seatId}"]`);
        if (!seatButton.length) return;

        seatButton
            .prop('disabled', true)
            .removeClass('available selected bg-primary text-white scale-110 shadow-[0_0_12px_rgba(177,32,36,0.6)] z-10 relative bg-white/20 text-white/70 hover:bg-primary/80 hover:text-white cursor-pointer')
            .addClass('bg-white/10 text-white/20 cursor-not-allowed booked');
    }

    async function syncBookedSeats() {
        const remoteBookedSeats = await loadBookedSeatsForEvent(event.id);
        remoteBookedSeats.forEach((seatId) => markSeatAsBooked(seatId));
        seatSyncReady = !getSeatAvailabilityNotice(event.id).type;
        updateEventDetailNotices(event.id);
        updateBookingSummary();
    }

    // Dynamic Binding for Seats interaction
    $('.seat-btn.available').on('click', function() {
        if ($(this).hasClass('booked') || $(this).prop('disabled')) return;
        const seatId = $(this).data('seat');
        
        if ($(this).hasClass('selected')) {
            $(this)
                .removeClass('selected bg-primary text-white scale-110 shadow-[0_0_12px_rgba(177,32,36,0.6)]')
                .addClass('bg-white/20 text-white/70 hover:bg-primary/80 hover:text-white');
            selectedSeats = selectedSeats.filter(id => id !== seatId);
        } else {
            $(this)
                .removeClass('bg-white/20 text-white/70 hover:bg-primary/80 hover:text-white')
                .addClass('selected bg-primary text-white scale-110 shadow-[0_0_12px_rgba(177,32,36,0.6)] z-10 relative');
            selectedSeats.push(seatId);
        }
        updateBookingSummary();
    });

    function updateBookingSummary() {
        const summaryDiv = $('#booking-summary');
        const btnComprar = $('#btn-comprar');
        const seatNotice = getSeatAvailabilityNotice(event.id);
        const syncMessage = !seatSyncReady
            ? `<span class="block mt-2 ${seatNotice.type === 'error' ? 'text-red-300' : 'text-white/50'}">${seatNotice.message || 'Estamos verificando la disponibilidad real de los asientos.'}</span>`
            : '';

        summaryDiv.html(`${createBookingSummaryHtml(selectedSeats)}${syncMessage}`);
        btnComprar.prop('disabled', selectedSeats.length === 0 || !seatSyncReady);
    }

    $('#btn-comprar').on('click', async function() {
        if (selectedSeats.length === 0) return;
        if (!isServerRenderedSessionAvailable()) {
            await showAppMessageModal(serverModeMessage, { title: 'Modo De Uso', type: 'info' });
            return;
        }
        if (!currentUser) {
            await showAppMessageModal(
                'Debes iniciar sesión para completar la compra de boletas.',
                { title: 'Inicia Sesión', type: 'info' }
            );
            window.location.hash = 'login';
            return;
        }

        const btnComprar = $(this);
        const selectedSeatsSnapshot = [...selectedSeats];
        const originalButtonHtml = btnComprar.html();

        btnComprar.prop('disabled', true).html(`
            <span class="inline-flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Guardando reserva...
            </span>
        `);

        let reservation;
        try {
            const backendReservation = await createReservation({
                event_id: event.id,
                seats: selectedSeatsSnapshot
            });

            reservation = normalizeReservation(backendReservation);

            if (!currentUser.reservations) currentUser.reservations = [];
            currentUser.reservations.unshift(reservation);
            selectedSeatsSnapshot.forEach((seatId) => markSeatAsBooked(seatId));
            updateBookingSummary();
        } catch (error) {
            if (error?.status === 401) {
                await handleUnauthorizedSession('Tu sesión ya no está activa. Inicia sesión de nuevo para continuar.');
                btnComprar.html(originalButtonHtml);
                return;
            }

            if (error?.status === 409 && Array.isArray(error.payload?.asientos_en_conflicto)) {
                error.payload.asientos_en_conflicto.forEach((seatId) => markSeatAsBooked(seatId));
                updateBookingSummary();
            }

            await showAppMessageModal(
                error.message || 'No se pudo guardar la reserva en la base de datos.',
                { title: 'No Se Pudo Completar', type: 'error' }
            );
            btnComprar.html(originalButtonHtml);
            updateBookingSummary();
            return;
        }

        btnComprar.html(originalButtonHtml);

        $('body').append(createPurchaseModalHtml(event, reservation));
        bindPurchaseModalActions();
    });

    updateBookingSummary();
    syncBookedSeats();
}

function renderLogin() {
    const isRegister = window.location.hash.includes('register=true');
    const title = isRegister ? "Crear Nueva Cuenta" : "Iniciar Sesión";
    const btnText = isRegister ? "Registrarse y Entrar" : "Ingresar a mi cuenta";
    const toggleText = isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí";
    const toggleLink = isRegister ? "#login" : "#login?register=true";

    const html = `
        <div class="animate-[fadeIn_0.3s_ease-in-out] flex items-center justify-center min-h-[65vh]">
            <div class="glass-card w-full max-w-md p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/10">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-white tracking-wide">${title}</h2>
                </div>
                
                <form id="login-form" class="space-y-5">
                    ${isRegister ? `
                    <div>
                        <label class="block text-sm font-medium text-white/70 mb-1.5" for="name">Nombre Completo</label>
                        <input type="text" id="name" class="w-full bg-black/40 border border-white/20 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-white/30" required placeholder="Juan Pérez">
                    </div>` : ''}
                    <div>
                        <label class="block text-sm font-medium text-white/70 mb-1.5" for="email">Correo Electrónico</label>
                        <input type="email" id="email" class="w-full bg-black/40 border border-white/20 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-white/30" required placeholder="tu@correo.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-white/70 mb-1.5" for="password">Contraseña</label>
                        <input type="password" id="password" class="w-full bg-black/40 border border-white/20 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-white/30" required placeholder="••••••••">
                    </div>
                    <div class="pt-4">
                        <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-md transition-colors shadow-lg">${btnText}</button>
                    </div>
                </form>

                <div class="mt-8 pt-6 border-t border-white/10 text-center">
                    <a href="${toggleLink}" class="text-sm font-medium text-white/60 hover:text-primary-light transition-colors">${toggleText}</a>
                </div>
            </div>
        </div>
    `;
    setAppContent(html);

    $(document).off('submit', '#login-form').on('submit', '#login-form', async function(e) {
        e.preventDefault();
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.text();
        const email = $('#email').val().trim().toLowerCase();
        const typedName = isRegister ? $('#name').val().trim() : '';
        const password = $('#password').val();

        if (!isServerRenderedSessionAvailable()) {
            await showAppMessageModal(serverModeMessage, { title: 'Modo De Uso', type: 'info' });
            return;
        }

        submitButton.prop('disabled', true).text(isRegister ? 'Creando cuenta...' : 'Iniciando sesión...');

        try {
            const backendUser = await authRequest(
                isRegister ? 'register' : 'login',
                {
                    name: typedName,
                    email: email,
                    password: password
                }
            );

            currentUser = normalizeUser(backendUser);
            currentUser.reservations = await loadReservations();

            updateNavigation();
            window.location.hash = 'dashboard';
        } catch (error) {
            await showAppMessageModal(
                error.message || 'No se pudo comunicar el formulario con el backend.',
                { title: 'Acción No Disponible', type: 'error' }
            );
        } finally {
            submitButton.prop('disabled', false).text(originalText);
        }
    });
}

function renderDashboard() {
    if (!currentUser) { window.location.hash = 'login'; return; }

    const reservationsNoticeHtml = getIntegrationNoticeHtml('reservations', { compact: false });
    const hasReservations = currentUser.reservations && currentUser.reservations.length > 0;
    let reservationsHtml = hasReservations
        ? `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-10">${currentUser.reservations.map((reservation) => createReservationCard(reservation)).join('')}</div>`
        : createEmptyReservationsHtml();

    if (reservationsNoticeHtml) {
        reservationsHtml = hasReservations
            ? `${reservationsNoticeHtml}${reservationsHtml}`
            : reservationsNoticeHtml;
    }

    setAppContent(createDashboardHtml(reservationsHtml));

    const renderedSignature = getReservationsSignature(currentUser.reservations);
    const renderedNoticeMessage = getIntegrationNotice('reservations').message;
    refreshCurrentUserReservations().then((changed) => {
        if (!changed || !currentUser || !isCurrentRoute('dashboard')) {
            return;
        }

        if (
            renderedSignature !== getReservationsSignature(currentUser.reservations)
            || renderedNoticeMessage !== getIntegrationNotice('reservations').message
        ) {
            renderDashboard();
        }
    });
}

// Helpers
function createEventCard(event) {
    return `
        <div class="glass-card rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(177,32,36,0.15)] hover:border-primary/40 flex flex-col h-full group">
            <a href="#event-detail/${event.id}" class="block relative overflow-hidden shrink-0">
                <div class="absolute inset-0 bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                    <span class="bg-black/70 text-white px-4 py-2 rounded-full font-medium tracking-wide backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">Ver Detalles</span>
                </div>
                <img src="${event.image}" alt="${event.title}" class="w-full h-48 sm:h-56 object-cover bg-neutral-900 transition-transform duration-500 group-hover:scale-105" onerror="this.src='${localFallbackImage}'">
            </a>
            <div class="p-6 flex flex-col flex-1">
                <p class="text-primary-light font-medium text-sm flex items-center gap-2 mb-3">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${event.dateLabel}
                </p>
                <h3 class="text-xl md:text-2xl font-bold mb-3 text-white leading-tight">${event.title}</h3>
                <p class="text-white/60 text-sm mb-2">${event.category}</p>
                <p class="text-white/60 text-sm mb-6 flex-1 leading-relaxed">${event.description.substring(0, 85)}</p>
                <a href="#event-detail/${event.id}" class="block w-full text-center border border-white/20 group-hover:border-primary/50 group-hover:bg-primary/10 text-white font-medium py-2.5 rounded-md transition-colors mt-auto">Más Información</a>
            </div>
        </div>
    `;
}

function appendEventCards(container, items, options = {}) {
    if (items.length === 0) {
        if (options.hideEmptyState) {
            return;
        }

        container.html(`
            <div class="glass-card rounded-2xl p-8 text-center text-white/70 md:col-span-2 lg:col-span-3">
                No hay eventos publicados todavía. Puedes agregarlos desde <strong class="text-white">/admin</strong>.
            </div>
        `);
        return;
    }

    items.forEach(event => {
        container.append(createEventCard(event));
    });
}
