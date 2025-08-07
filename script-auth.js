document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'login';
    
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const nameField = document.getElementById('name-field');
    const submitBtn = document.getElementById('submit-btn');
    const switchMode = document.getElementById('switch-mode');
    
    // Настройка формы в зависимости от типа (логин/регистрация)
    if (type === 'register') {
        authTitle.textContent = 'Регистрация';
        nameField.style.display = 'block';
        submitBtn.textContent = 'Зарегистрироваться';
        switchMode.innerHTML = 'Уже есть аккаунт? <a href="auth.html?type=login">Войдите</a>';
    } else {
        authTitle.textContent = 'Вход';
        nameField.style.display = 'none';
        submitBtn.textContent = 'Войти';
        switchMode.innerHTML = 'Нет аккаунта? <a href="auth.html?type=register">Зарегистрируйтесь</a>';
    }
    
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (type === 'register') {
            const name = document.getElementById('name').value;
            
            // Проверка, существует ли пользователь
            if (users.some(user => user.username === username)) {
                alert('Пользователь с таким именем уже существует');
                return;
            }
            
            // Создание нового пользователя
            users.push({
                name: name,
                username: username,
                password: password // В реальном приложении нужно хэшировать пароль!
            });
            
            localStorage.setItem('users', JSON.stringify(users));
            alert('Регистрация успешна! Теперь вы можете войти.');
            window.location.href = 'auth.html?type=login';
        } else {
            // Проверка логина
            const user = users.find(user => 
                user.username === username && user.password === password
            );
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify({
                    name: user.name,
                    username: user.username
                }));
                window.location.href = 'index.html';
            } else {
                alert('Неверное имя пользователя или пароль');
            }
        }
    });
});