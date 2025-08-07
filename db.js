// Инициализация базы данных
const initializeDB = () => {
    if (!localStorage.getItem('books')) {
        const initialBooks = [
            {
                id: '1',
                title: '1984',
                author: 'Джордж Оруэлл',
                category: 'Антиутопия',
                year: 1949,
                cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
                price: 500,
                status: 'available',
                rentedBy: null,
                rentEnd: null
            },
            {
                id: '2',
                title: 'Мастер и Маргарита',
                author: 'Михаил Булгаков',
                category: 'Классика',
                year: 1967,
                cover: 'https://covers.openlibrary.org/b/id/8428556-L.jpg',
                price: 450,
                status: 'available',
                rentedBy: null,
                rentEnd: null
            },
            {
                id: '3',
                title: 'Гарри Поттер и философский камень',
                author: 'Джоан Роулинг',
                category: 'Фэнтези',
                year: 1997,
                cover: 'https://covers.openlibrary.org/b/id/10516092-L.jpg',
                price: 600,
                status: 'available',
                rentedBy: null,
                rentEnd: null
            }
        ];
        localStorage.setItem('books', JSON.stringify(initialBooks));
    }

    if (!localStorage.getItem('users')) {
        const initialUsers = [
            {
                id: '1',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                rentedBooks: []
            },
            {
                id: '2',
                username: 'user',
                password: 'user123',
                role: 'user',
                rentedBooks: []
            }
        ];
        localStorage.setItem('users', JSON.stringify(initialUsers));
    }

    if (!localStorage.getItem('categories')) {
        const initialCategories = ['Антиутопия', 'Классика', 'Фэнтези', 'Научная фантастика', 'Детектив', 'Роман'];
        localStorage.setItem('categories', JSON.stringify(initialCategories));
    }
};

// Получение всех книг
const getBooks = () => {
    return JSON.parse(localStorage.getItem('books')) || [];
};

// Получение книги по ID
const getBookById = (id) => {
    const books = getBooks();
    return books.find(book => book.id === id);
};

// Обновление книги
const updateBook = (updatedBook) => {
    let books = getBooks();
    books = books.map(book => book.id === updatedBook.id ? updatedBook : book);
    localStorage.setItem('books', JSON.stringify(books));
};

// Получение пользователей
const getUsers = () => {
    return JSON.parse(localStorage.getItem('users')) || [];
};

// Получение текущего пользователя
const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('currentUser'));
};

// Установка текущего пользователя
const setCurrentUser = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
};

// Выход пользователя
const logout = () => {
    localStorage.removeItem('currentUser');
};

// Получение категорий
const getCategories = () => {
    return JSON.parse(localStorage.getItem('categories')) || [];
};

// Добавление новой категории
const addCategory = (category) => {
    const categories = getCategories();
    if (!categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
    }
};

// Аренда книги
const rentBook = (bookId, userId, days) => {
    const books = getBooks();
    const users = getUsers();
    
    const book = books.find(b => b.id === bookId);
    if (!book || book.status !== 'available') return false;
    
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    const rentEnd = new Date();
    rentEnd.setDate(rentEnd.getDate() + days);
    
    // Обновляем книгу
    book.status = 'rented';
    book.rentedBy = userId;
    book.rentEnd = rentEnd.toISOString();
    
    // Обновляем пользователя
    user.rentedBooks.push({
        bookId,
        rentEnd: book.rentEnd
    });
    
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
};

// Возврат книги
const returnBook = (bookId) => {
    const books = getBooks();
    const users = getUsers();
    
    const book = books.find(b => b.id === bookId);
    if (!book || book.status !== 'rented') return false;
    
    const user = users.find(u => u.id === book.rentedBy);
    if (user) {
        user.rentedBooks = user.rentedBooks.filter(b => b.bookId !== bookId);
    }
    
    // Обновляем книгу
    book.status = 'available';
    book.rentedBy = null;
    book.rentEnd = null;
    
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
};

// Проверка просроченных аренд
const checkExpiredRentals = () => {
    const books = getBooks();
    const now = new Date();
    let expired = [];
    
    books.forEach(book => {
        if (book.status === 'rented' && book.rentEnd) {
            const rentEnd = new Date(book.rentEnd);
            if (rentEnd < now) {
                expired.push({
                    bookId: book.id,
                    bookTitle: book.title,
                    userId: book.rentedBy
                });
            }
        }
    });
    
    return expired;
};

export {
    initializeDB,
    getBooks,
    getBookById,
    updateBook,
    getUsers,
    getCurrentUser,
    setCurrentUser,
    logout,
    getCategories,
    addCategory,
    rentBook,
    returnBook,
    checkExpiredRentals
};