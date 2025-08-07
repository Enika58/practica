// Инициализация данных
let users = JSON.parse(localStorage.getItem('users')) || [];
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || {};

// DOM элементы
const loginLink = document.getElementById('login-link');
const registerLink = document.getElementById('register-link');
const newPostLink = document.getElementById('new-post-link');
const logoutLink = document.getElementById('logout-link');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const postsList = document.getElementById('posts-list');
const subscriptionsList = document.getElementById('subscriptions-list');
const subscribeInput = document.getElementById('subscribe-input');
const subscribeBtn = document.getElementById('subscribe-btn');
const filterSelect = document.getElementById('filter-select');
const tagsFilter = document.getElementById('tags-filter');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    renderPosts();
    renderSubscriptions();

    // Обработчики событий
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'auth.html?type=login';
    });

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'auth.html?type=register';
    });

    newPostLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'post-editor.html';
    });

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    subscribeBtn.addEventListener('click', subscribeToUser);
    filterSelect.addEventListener('change', updateFilter);
    tagsFilter.addEventListener('input', renderPosts);
});

// Функции

function updateUI() {
    if (currentUser) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        newPostLink.style.display = 'inline';
        logoutLink.style.display = 'inline';
        userInfo.style.display = 'block';
        usernameDisplay.textContent = currentUser.username;
    } else {
        loginLink.style.display = 'inline';
        registerLink.style.display = 'inline';
        newPostLink.style.display = 'none';
        logoutLink.style.display = 'none';
        userInfo.style.display = 'none';
    }
}

function renderPosts() {
    const filter = filterSelect.value;
    const tags = tagsFilter.value.split(',').map(tag => tag.trim().toLowerCase());
    
    let filteredPosts = [...posts];
    
    // Фильтрация
    if (filter === 'subscribed' && currentUser) {
        const subscribedUsers = subscriptions[currentUser.username] || [];
        filteredPosts = filteredPosts.filter(post => 
            subscribedUsers.includes(post.author) || post.author === currentUser.username
        );
    }
    
    if (tagsFilter.style.display !== 'none' && tags[0]) {
        filteredPosts = filteredPosts.filter(post => 
            post.tags.some(tag => tags.includes(tag.toLowerCase()))
        );
    }
    
    // Сортировка по дате (новые сначала)
    filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Отрисовка
    postsList.innerHTML = '';
    
    if (filteredPosts.length === 0) {
        postsList.innerHTML = '<p>Постов не найдено</p>';
        return;
    }
    
    filteredPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = `post ${post.isPublic ? '' : 'private'}`;
        
        const canEdit = currentUser && (currentUser.username === post.author);
        
        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <div class="post-meta">
                Автор: ${post.author} | 
                ${new Date(post.createdAt).toLocaleString()} |
                ${post.isPublic ? 'Публичный' : 'Приватный'}
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <p>${post.content}</p>
            ${canEdit ? `
            <div class="actions">
                <a href="post-editor.html?id=${post.id}">Редактировать</a>
                <a href="#" class="delete-post" data-id="${post.id}">Удалить</a>
            </div>
            ` : ''}
            <div class="comments" id="comments-${post.id}">
                <h4>Комментарии (${post.comments ? post.comments.length : 0})</h4>
                ${post.comments ? post.comments.map(comment => `
                    <div class="comment">
                        <strong>${comment.author}:</strong> ${comment.text}
                    </div>
                `).join('') : ''}
                ${currentUser ? `
                <form class="comment-form" data-post="${post.id}">
                    <input type="text" placeholder="Ваш комментарий" required>
                    <button type="submit">Отправить</button>
                </form>
                ` : ''}
            </div>
        `;
        
        postsList.appendChild(postElement);
    });
    
    // Добавляем обработчики для динамически созданных элементов
    document.querySelectorAll('.delete-post').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.getAttribute('data-id');
            deletePost(postId);
        });
    });
    
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const postId = this.getAttribute('data-post');
            const commentText = this.querySelector('input').value;
            addComment(postId, commentText);
            this.querySelector('input').value = '';
        });
    });
}

function renderSubscriptions() {
    if (!currentUser) return;
    
    const userSubscriptions = subscriptions[currentUser.username] || [];
    subscriptionsList.innerHTML = '';
    
    if (userSubscriptions.length === 0) {
        subscriptionsList.innerHTML = '<p>Вы ни на кого не подписаны</p>';
        return;
    }
    
    userSubscriptions.forEach(username => {
        const subElement = document.createElement('div');
        subElement.innerHTML = `
            <span>${username}</span>
            <button class="unsubscribe-btn" data-user="${username}">Отписаться</button>
        `;
        subscriptionsList.appendChild(subElement);
    });
    
    document.querySelectorAll('.unsubscribe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            unsubscribeFromUser(this.getAttribute('data-user'));
        });
    });
}

function subscribeToUser() {
    if (!currentUser) return;
    
    const username = subscribeInput.value.trim();
    if (!username) return;
    
    if (!subscriptions[currentUser.username]) {
        subscriptions[currentUser.username] = [];
    }
    
    if (!subscriptions[currentUser.username].includes(username)) {
        subscriptions[currentUser.username].push(username);
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        renderSubscriptions();
        renderPosts();
        subscribeInput.value = '';
    }
}

function unsubscribeFromUser(username) {
    if (!currentUser) return;
    
    subscriptions[currentUser.username] = subscriptions[currentUser.username].filter(
        user => user !== username
    );
    
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    renderSubscriptions();
    renderPosts();
}

function updateFilter() {
    if (filterSelect.value === 'tags') {
        tagsFilter.style.display = 'block';
    } else {
        tagsFilter.style.display = 'none';
    }
    renderPosts();
}

function deletePost(postId) {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;
    
    posts = posts.filter(post => post.id !== postId);
    localStorage.setItem('posts', JSON.stringify(posts));
    renderPosts();
}

function addComment(postId, text) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (!post.comments) {
        post.comments = [];
    }
    
    post.comments.push({
        author: currentUser.username,
        text: text,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('posts', JSON.stringify(posts));
    renderPosts();
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateUI();
    renderPosts();
}