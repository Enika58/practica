import {
    initializeDB,
    getBooks,
    getBookById,
    getCurrentUser,
    setCurrentUser,
    logout,
    getCategories,
    rentBook
} from './db.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeDB();
    setupEventListeners();
    renderBooks();
    renderFilters();
    updateUI();
});

// Настройка обработчиков событий
const setupEventListeners = () => {
    // Модальные окна
    const loginModal = document.getElementById('login-modal');
    const rentModal = document.getElementById('rent-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    document.getElementById('login-btn').addEventListener('click', () => {
        loginModal.style.display = 'block';
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            rentModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === rentModal) rentModal.style.display = 'none';
    });
    
    // Форма входа
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    // Форма аренды
    document.getElementById('rent-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleRent();
    });
    
    // Фильтры
    document.getElementById('category-filter').addEventListener('change', renderBooks);
    document.getElementById('author-filter').addEventListener('change', renderBooks);
    document.getElementById('year-filter').addEventListener('change', renderBooks);
    document.getElementById('availability-filter').addEventListener('change', renderBooks);
    
    // Ссылка на админку
    document.getElementById('admin-link').addEventListener('click', (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (user && user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            alert('Доступ только для администратора');
        }
    });
};

// Обновление интерфейса в зависимости от авторизации
const updateUI = () => {
    const user = getCurrentUser();
    const usernameElement = document.getElementById('username');
    const loginBtn = document.getElementById('login-btn');
    const adminLink = document.getElementById('admin-link');
    
    if (user) {
        usernameElement.textContent = user.username;
        loginBtn.textContent = 'Выйти';
        loginBtn.onclick = handleLogout;
        adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
    } else {
        usernameElement.textContent = 'Гость';
        loginBtn.textContent = 'Войти';
        loginBtn.onclick = () => document.getElementById('login-modal').style.display = 'block';
        adminLink.style.display = 'none';
    }
};

// Обработка входа
const handleLogin = () => {
    const form = document.getElementById('login-form');
    const username = form.querySelector('input[type="text"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        setCurrentUser(user);
        document.getElementById('login-modal').style.display = 'none';
        updateUI();
        renderBooks();
    } else {
        alert('Неверное имя пользователя или пароль');
    }
};

// Обработка выхода
const handleLogout = () => {
    logout();
    updateUI();
    renderBooks();
};

// Отрисовка фильтров
const renderFilters = () => {
    const books = getBooks();
    const categories = getCategories();
    const categoryFilter = document.getElementById('category-filter');
    const authorFilter = document.getElementById('author-filter');
    const yearFilter = document.getElementById('year-filter');
    
    // Категории
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Авторы
    const authors = [...new Set(books.map(book => book.author))];
    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
    
    // Годы
    const years = [...new Set(books.map(book => book.year))].sort((a, b) => b - a);
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
};

// Отрисовка книг
const renderBooks = () => {
    const books = getBooks();
    const category = document.getElementById('category-filter').value;
    const author = document.getElementById('author-filter').value;
    const year = document.getElementById('year-filter').value;
    const availability = document.getElementById('availability-filter').value;
    const user = getCurrentUser();
    
    let filteredBooks = [...books];
    
    // Применяем фильтры
    if (category !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.category === category);
    }
    
    if (author !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.author === author);
    }
    
    if (year !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.year === parseInt(year));
    }
    
    if (availability !== 'all') {
        if (availability === 'available') {
            filteredBooks = filteredBooks.filter(book => book.status === 'available');
        } else if (availability === 'rented') {
            filteredBooks = filteredBooks.filter(book => book.status === 'rented');
        }
    }
    
    // Отрисовываем книги
    const booksList = document.getElementById('books-list');
    booksList.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        booksList.innerHTML = '<p>Книги не найдены</p>';
        return;
    }
    
    filteredBooks.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-card';
        bookElement.innerHTML = `
            <div class="book-cover" style="background-image: url('${book.cover}')"></div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-meta">
                    <span>${book.year}</span>
                    <span>${book.category}</span>
                </div>
                <div class="book-actions">
                    <span>${book.price} руб.</span>
                    ${book.status === 'available' ? 
                        `<button class="rent-btn" data-id="${book.id}">Арендовать</button>` : 
                        `<button class="rented" disabled>${user && user.id === book.rentedBy ? 'Ваша аренда' : 'Занято'}</button>`}
                </div>
            </div>
        `;
        
        booksList.appendChild(bookElement);
    });
    
    // Добавляем обработчики для кнопок аренды
    document.querySelectorAll('.rent-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = e.target.getAttribute('data-id');
            openRentModal(bookId);
        });
    });
};

// Открытие модального окна аренды
const openRentModal = (bookId) => {
    const user = getCurrentUser();
    if (!user) {
        alert('Для аренды книги необходимо войти в систему');
        document.getElementById('login-modal').style.display = 'block';
        return;
    }
    
    document.getElementById('rent-book-id').value = bookId;
    document.getElementById('rent-modal').style.display = 'block';
};

// Обработка аренды
const handleRent = () => {
    const bookId = document.getElementById('rent-book-id').value;
    const days = parseInt(document.getElementById('rent-period').value);
    const user = getCurrentUser();
    
    if (rentBook(bookId, user.id, days)) {
        alert('Книга успешно арендована!');
        document.getElementById('rent-modal').style.display = 'none';
        renderBooks();
    } else {
        alert('Не удалось арендовать книгу');
    }
};