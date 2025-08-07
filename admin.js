import {
    getBooks,
    getBookById,
    updateBook,
    getCategories,
    addCategory,
    returnBook,
    checkExpiredRentals,
    logout
} from './db.js';

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('username').textContent = user.username;
    document.getElementById('logout-btn').addEventListener('click', () => {
        logout();
        window.location.href = 'index.html';
    });
    
    setupAdminEventListeners();
    renderAdminBooks();
    renderExpiredRentals();
    renderCategoryOptions();
});

// Настройка обработчиков событий
const setupAdminEventListeners = () => {
    const bookModal = document.getElementById('book-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    document.getElementById('add-book-btn').addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Добавить книгу';
        document.getElementById('book-form').reset();
        document.getElementById('book-id').value = '';
        document.getElementById('delete-book-btn').style.display = 'none';
        bookModal.style.display = 'block';
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            bookModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === bookModal) bookModal.style.display = 'none';
    });
    
    document.getElementById('book-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBook();
    });
    
    document.getElementById('delete-book-btn').addEventListener('click', deleteBook);
    
    document.getElementById('new-category').addEventListener('change', (e) => {
        if (e.target.value) {
            document.getElementById('book-category').value = '';
        }
    });
    
    document.getElementById('book-category').addEventListener('change', (e) => {
        if (e.target.value) {
            document.getElementById('new-category').value = '';
        }
    });
};

// Отрисовка книг в админке
const renderAdminBooks = () => {
    const books = getBooks();
    const booksList = document.getElementById('books-list');
    booksList.innerHTML = '';
    
    if (books.length === 0) {
        booksList.innerHTML = '<p>Книги не найдены</p>';
        return;
    }
    
    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-card';
        bookElement.innerHTML = `
            <div class="book-cover" style="background-image: url('${book.cover}')"></div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-meta">
                    <span>${book.year}</span>
                    <span>${book.status === 'available' ? 'Доступна' : 'Арендована'}</span>
                </div>
                <div class="book-actions">
                    <button class="edit-btn" data-id="${book.id}">Редактировать</button>
                    ${book.status === 'rented' ? 
                        `<button class="return-btn" data-id="${book.id}">Вернуть</button>` : ''}
                </div>
            </div>
        `;
        
        booksList.appendChild(bookElement);
    });
    
    // Обработчики для кнопок
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = e.target.getAttribute('data-id');
            openEditModal(bookId);
        });
    });
    
    document.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = e.target.getAttribute('data-id');
            if (confirm('Подтвердить возврат книги?')) {
                returnBook(bookId);
                renderAdminBooks();
                renderExpiredRentals();
            }
        });
    });
};

// Отрисовка просроченных аренд
const renderExpiredRentals = () => {
    const expired = checkExpiredRentals();
    const container = document.getElementById('expired-rentals');
    container.innerHTML = '';
    
    if (expired.length === 0) {
        container.innerHTML = '<p>Нет просроченных аренд</p>';
        return;
    }
    
    expired.forEach(item => {
        const book = getBookById(item.bookId);
        const element = document.createElement('div');
        element.className = 'expired-item';
        element.innerHTML = `
            <p><strong>${book.title}</strong> (ID: ${book.id})</p>
            <p>Арендована пользователем: ${item.userId}</p>
            <button class="return-btn" data-id="${book.id}">Вернуть</button>
            <button class="remind-btn" data-user="${item.userId}">Напомнить</button>
        `;
        container.appendChild(element);
    });
    
    // Обработчики для кнопок
    document.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = e.target.getAttribute('data-id');
            returnBook(bookId);
            renderAdminBooks();
            renderExpiredRentals();
        });
    });
    
    document.querySelectorAll('.remind-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user');
            alert(`Напоминание отправлено пользователю ${userId}`);
        });
    });
};

// Отрисовка категорий в селекте
const renderCategoryOptions = () => {
    const categories = getCategories();
    const select = document.getElementById('book-category');
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
};

// Открытие модального окна редактирования
const openEditModal = (bookId) => {
    const book = getBookById(bookId);
    if (!book) return;
    
    document.getElementById('modal-title').textContent = 'Редактировать книгу';
    document.getElementById('book-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-author').value = book.author;
    document.getElementById('book-category').value = book.category;
    document.getElementById('book-year').value = book.year;
    document.getElementById('book-cover').value = book.cover;
    document.getElementById('book-price').value = book.price;
    document.getElementById('book-status').value = book.status;
    document.getElementById('delete-book-btn').style.display = 'inline-block';
    
    document.getElementById('book-modal').style.display = 'block';
};

// Сохранение книги
const saveBook = () => {
    const form = document.getElementById('book-form');
    const id = form.querySelector('#book-id').value;
    const title = form.querySelector('#book-title').value;
    const author = form.querySelector('#book-author').value;
    let category = form.querySelector('#book-category').value;
    const newCategory = form.querySelector('#new-category').value;
    const year = parseInt(form.querySelector('#book-year').value);
    const cover = form.querySelector('#book-cover').value;
    const price = parseInt(form.querySelector('#book-price').value);
    const status = form.querySelector('#book-status').value;
    
    if (newCategory) {
        category = newCategory;
        addCategory(category);
    }
    
    const book = {
        id: id || Date.now().toString(),
        title,
        author,
        category,
        year,
        cover,
        price,
        status,
        rentedBy: status === 'rented' ? 'admin' : null,
        rentEnd: status === 'rented' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
    };
    
    updateBook(book);
    document.getElementById('book-modal').style.display = 'none';
    renderAdminBooks();
    renderCategoryOptions();
};

// Удаление книги
const deleteBook = () => {
    const id = document.getElementById('book-id').value;
    if (!id || !confirm('Вы уверены, что хотите удалить эту книгу?')) return;
    
    let books = getBooks();
    books = books.filter(book => book.id !== id);
    localStorage.setItem('books', JSON.stringify(books));
    
    document.getElementById('book-modal').style.display = 'none';
    renderAdminBooks();
};