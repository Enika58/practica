// Инициализация данных
let users = JSON.parse(localStorage.getItem('travel-users')) || [];
let trips = JSON.parse(localStorage.getItem('travel-trips')) || [];
let currentUser = JSON.parse(localStorage.getItem('travel-currentUser'));
let map;
let marker;

// DOM элементы
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const addTripBtn = document.getElementById('add-trip-btn');
const logoutBtn = document.getElementById('logout-btn');
const authButtons = document.getElementById('auth-buttons');
const userMenu = document.getElementById('user-menu');
const usernameDisplay = document.getElementById('username-display');
const tripsContainer = document.getElementById('trips-container');
const countryFilter = document.getElementById('country-filter');
const userFilter = document.getElementById('user-filter');

// Модальные окна
const authModal = document.getElementById('auth-modal');
const tripModal = document.getElementById('trip-modal');
const viewTripModal = document.getElementById('view-trip-modal');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const nameField = document.getElementById('name-field');
const submitAuth = document.getElementById('submit-auth');
const closeButtons = document.querySelectorAll('.close');

// Форма путешествия
const tripForm = document.getElementById('trip-form');
const tripIdInput = document.getElementById('trip-id');
const deleteTripBtn = document.getElementById('delete-trip-btn');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    renderTrips();
    renderFilters();

    // Обработчики событий
    loginBtn.addEventListener('click', () => openAuthModal('login'));
    registerBtn.addEventListener('click', () => openAuthModal('register'));
    addTripBtn.addEventListener('click', () => openTripModal());
    logoutBtn.addEventListener('click', logout);
    
    authForm.addEventListener('submit', handleAuth);
    tripForm.addEventListener('submit', handleTripSubmit);
    deleteTripBtn.addEventListener('click', deleteTrip);
    
    countryFilter.addEventListener('change', renderTrips);
    userFilter.addEventListener('change', renderTrips);
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            authModal.style.display = 'none';
            tripModal.style.display = 'none';
            viewTripModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.style.display = 'none';
        if (e.target === tripModal) tripModal.style.display = 'none';
        if (e.target === viewTripModal) viewTripModal.style.display = 'none';
    });
});

// Обновление интерфейса
function updateUI() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Открытие модального окна авторизации
function openAuthModal(type) {
    authModal.style.display = 'block';
    
    if (type === 'login') {
        modalTitle.textContent = 'Вход';
        nameField.style.display = 'none';
        submitAuth.textContent = 'Войти';
    } else {
        modalTitle.textContent = 'Регистрация';
        nameField.style.display = 'block';
        submitAuth.textContent = 'Зарегистрироваться';
    }
}

// Обработка авторизации/регистрации
function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name')?.value || username;
    
    if (modalTitle.textContent === 'Регистрация') {
        // Регистрация
        if (users.some(user => user.username === username)) {
            alert('Пользователь с таким именем уже существует');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            name,
            username,
            password, // В реальном приложении нужно хэшировать пароль!
            trips: []
        };
        
        users.push(newUser);
        localStorage.setItem('travel-users', JSON.stringify(users));
        
        currentUser = newUser;
        localStorage.setItem('travel-currentUser', JSON.stringify(currentUser));
        
        alert('Регистрация успешна!');
        authModal.style.display = 'none';
    } else {
        // Вход
        const user = users.find(user => user.username === username && user.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('travel-currentUser', JSON.stringify(currentUser));
            authModal.style.display = 'none';
        } else {
            alert('Неверное имя пользователя или пароль');
        }
    }
    
    updateUI();
    renderTrips();
    renderFilters();
}

// Выход из системы
function logout() {
    currentUser = null;
    localStorage.removeItem('travel-currentUser');
    updateUI();
    renderTrips();
}

// Отрисовка фильтров
function renderFilters() {
    // Фильтр по странам
    const countries = [...new Set(trips.map(trip => trip.country))];
    countryFilter.innerHTML = '<option value="all">Все страны</option>';
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
    
    // Фильтр по пользователям
    const tripUsers = [...new Set(trips.map(trip => trip.user))];
    userFilter.innerHTML = '<option value="all">Все пользователи</option>';
    tripUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userFilter.appendChild(option);
    });
}

// Отрисовка путешествий
function renderTrips() {
    const country = countryFilter.value;
    const user = userFilter.value;
    
    let filteredTrips = [...trips];
    
    if (country !== 'all') {
        filteredTrips = filteredTrips.filter(trip => trip.country === country);
    }
    
    if (user !== 'all') {
        filteredTrips = filteredTrips.filter(trip => trip.user === user);
    }
    
    // Сортировка по дате (новые сначала)
    filteredTrips.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tripsContainer.innerHTML = '';
    
    if (filteredTrips.length === 0) {
        tripsContainer.innerHTML = '<p>Путешествий не найдено</p>';
        return;
    }
    
    filteredTrips.forEach(trip => {
        const tripElement = document.createElement('div');
        tripElement.className = 'trip-card';
        tripElement.innerHTML = `
            <div class="trip-image" style="background-image: url('${trip.image || 'https://via.placeholder.com/300x200?text=No+Image'}')"></div>
            <div class="trip-info">
                <h3 class="trip-title">${trip.title}</h3>
                <div class="trip-meta">
                    <span>${trip.country}, ${trip.city}</span>
                    <span>${new Date(trip.date).toLocaleDateString()}</span>
                    ${trip.cost ? `<span>${trip.cost} руб.</span>` : ''}
                    ${trip.rating ? `<span class="rating">★ ${trip.rating}/5</span>` : ''}
                </div>
                <p class="trip-description">${trip.description}</p>
                <div class="trip-actions">
                    <span>${trip.user}</span>
                    <button class="view-trip-btn" data-id="${trip.id}">Подробнее</button>
                </div>
            </div>
        `;
        
        tripsContainer.appendChild(tripElement);
    });
    
    // Добавляем обработчики для кнопок просмотра
    document.querySelectorAll('.view-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tripId = this.getAttribute('data-id');
            viewTrip(tripId);
        });
    });
}

// Просмотр путешествия
function viewTrip(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    document.getElementById('view-trip-title').textContent = trip.title;
    
    let content = `
        <div class="trip-view-image" style="background-image: url('${trip.image || 'https://via.placeholder.com/800x400?text=No+Image'}'); height: 300px; background-size: cover; background-position: center; margin-bottom: 1rem;"></div>
        <p><strong>Страна:</strong> ${trip.country}</p>
        <p><strong>Город:</strong> ${trip.city}</p>
        <p><strong>Дата:</strong> ${new Date(trip.date).toLocaleDateString()}</p>
        ${trip.cost ? `<p><strong>Стоимость:</strong> ${trip.cost} руб.</p>` : ''}
        ${trip.rating ? `<p><strong>Оценка:</strong> ${trip.rating}/5</p>` : ''}
        ${trip.places ? `<p><strong>Места для посещения:</strong> ${trip.places.split(',').join(', ')}</p>` : ''}
        ${trip.heritage ? `<p><strong>Места культурного наследия:</strong> ${trip.heritage}</p>` : ''}
        <p><strong>Описание:</strong></p>
        <p>${trip.description}</p>
    `;
    
    if (trip.location) {
        content += `<div id="view-trip-map" style="height: 300px; margin-top: 1rem;"></div>`;
    }
    
    document.getElementById('view-trip-content').innerHTML = content;
    viewTripModal.style.display = 'block';
    
    // Инициализация карты для просмотра
    if (trip.location) {
        setTimeout(() => {
            const [lat, lng] = trip.location.split(',').map(Number);
            const viewMap = L.map('view-trip-map').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(viewMap);
            L.marker([lat, lng]).addTo(viewMap)
                .bindPopup(`${trip.city}, ${trip.country}`);
        }, 100);
    }
}

// Открытие модального окна для добавления/редактирования путешествия
function openTripModal(tripId = null) {
    if (!currentUser) {
        alert('Для добавления путешествия необходимо войти в систему');
        openAuthModal('login');
        return;
    }
    
    document.getElementById('trip-modal-title').textContent = tripId ? 'Редактировать путешествие' : 'Новое путешествие';
    tripForm.reset();
    tripIdInput.value = tripId || '';
    deleteTripBtn.style.display = tripId ? 'inline-block' : 'none';
    
    // Инициализация карты
    if (map) {
        map.remove();
        map = null;
        marker = null;
    }
    
    const defaultLocation = [55.7558, 37.6173]; // Москва по умолчанию
    map = L.map('map').setView(defaultLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    if (tripId) {
        // Редактирование существующего путешествия
        const trip = trips.find(t => t.id === tripId);
        if (trip && trip.user === currentUser.username) {
            document.getElementById('trip-title').value = trip.title;
            document.getElementById('trip-country').value = trip.country;
            document.getElementById('trip-city').value = trip.city;
            document.getElementById('trip-date').value = trip.date.split('T')[0];
            document.getElementById('trip-cost').value = trip.cost || '';
            document.getElementById('trip-places').value = trip.places || '';
            document.getElementById('trip-heritage').value = trip.heritage || '';
            document.getElementById('trip-rating').value = trip.rating || '3';
            document.getElementById('trip-description').value = trip.description;
            document.getElementById('trip-image').value = trip.image || '';
            
            if (trip.location) {
                const [lat, lng] = trip.location.split(',').map(Number);
                map.setView([lat, lng], 13);
                marker = L.marker([lat, lng]).addTo(map);
                document.getElementById('trip-location').value = trip.location;
            }
        }
    }
    
    // Обработка клика по карте
    map.on('click', function(e) {
        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker(e.latlng).addTo(map);
        document.getElementById('trip-location').value = `${e.latlng.lat.toFixed(4)},${e.latlng.lng.toFixed(4)}`;
    });
    
    tripModal.style.display = 'block';
}

// Обработка сохранения путешествия
function handleTripSubmit(e) {
    e.preventDefault();
    
    const tripId = tripIdInput.value || Date.now().toString();
    const title = document.getElementById('trip-title').value;
    const country = document.getElementById('trip-country').value;
    const city = document.getElementById('trip-city').value;
    const date = document.getElementById('trip-date').value;
    const cost = document.getElementById('trip-cost').value;
    const places = document.getElementById('trip-places').value;
    const heritage = document.getElementById('trip-heritage').value;
    const rating = document.getElementById('trip-rating').value;
    const description = document.getElementById('trip-description').value;
    const image = document.getElementById('trip-image').value;
    const location = document.getElementById('trip-location').value;
    
    const trip = {
        id: tripId,
        title,
        country,
        city,
        date: new Date(date).toISOString(),
        cost: cost ? parseInt(cost) : null,
        places,
        heritage,
        rating: parseInt(rating),
        description,
        image,
        location,
        user: currentUser.username,
        createdAt: new Date().toISOString()
    };
    
    // Обновляем или добавляем путешествие
    const existingIndex = trips.findIndex(t => t.id === tripId);
    if (existingIndex >= 0) {
        trips[existingIndex] = trip;
    } else {
        trips.push(trip);
    }
    
    localStorage.setItem('travel-trips', JSON.stringify(trips));
    tripModal.style.display = 'none';
    renderTrips();
    renderFilters();
}

// Удаление путешествия
function deleteTrip() {
    const tripId = tripIdInput.value;
    if (!tripId || !confirm('Вы уверены, что хотите удалить это путешествие?')) return;
    
    trips = trips.filter(trip => trip.id !== tripId);
    localStorage.setItem('travel-trips', JSON.stringify(trips));
    tripModal.style.display = 'none';
    renderTrips();
    renderFilters();
}

// Инициализация тестовых данных при первом запуске
function initializeTestData() {
    if (!localStorage.getItem('travel-users')) {
        users = [
            {
                id: '1',
                name: 'Администратор',
                username: 'admin',
                password: 'admin123',
                trips: []
            }
        ];
        localStorage.setItem('travel-users', JSON.stringify(users));
    }
    
    if (!localStorage.getItem('travel-trips') || JSON.parse(localStorage.getItem('travel-trips')).length === 0) {
        trips = [
            {
                id: '1',
                title: 'Отдых в Сочи',
                country: 'Россия',
                city: 'Сочи',
                date: new Date('2023-07-15').toISOString(),
                cost: 35000,
                places: 'Дендрарий, Олимпийский парк, Сочи Парк',
                heritage: 'Красная Поляна',
                rating: 4,
                description: 'Прекрасный отдых на черноморском побережье с посещением достопримечательностей.',
                image: 'https://example.com/sochi.jpg',
                location: '43.5855,39.7231',
                user: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Экскурсия по Санкт-Петербургу',
                country: 'Россия',
                city: 'Санкт-Петербург',
                date: new Date('2023-05-20').toISOString(),
                cost: 25000,
                places: 'Эрмитаж, Петергоф, Исаакиевский собор',
                heritage: 'Исторический центр Санкт-Петербурга',
                rating: 5,
                description: 'Культурная поездка по северной столице с посещением музеев и дворцов.',
                image: 'https://example.com/spb.jpg',
                location: '59.9343,30.3351',
                user: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('travel-trips', JSON.stringify(trips));
    }
}

// Инициализация тестовых данных
initializeTestData();