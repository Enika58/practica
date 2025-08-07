document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    
    const postForm = document.getElementById('post-form');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const postTags = document.getElementById('post-tags');
    const postPublic = document.getElementById('post-public');
    const editorTitle = document.getElementById('editor-title');
    const submitBtn = document.getElementById('submit-post');
    
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'auth.html?type=login';
        return;
    }
    
    // Если редактирование существующего поста
    if (postId) {
        const post = posts.find(p => p.id === postId);
        
        if (!post || post.author !== currentUser.username) {
            window.location.href = 'index.html';
            return;
        }
        
        editorTitle.textContent = 'Редактирование поста';
        submitBtn.textContent = 'Обновить';
        
        postTitle.value = post.title;
        postContent.value = post.content;
        postTags.value = post.tags.join(', ');
        postPublic.checked = post.isPublic;
    }
    
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = postTitle.value.trim();
        const content = postContent.value.trim();
        const tags = postTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const isPublic = postPublic.checked;
        
        if (!title || !content) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        if (postId) {
            // Обновление существующего поста
            posts = posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        title,
                        content,
                        tags,
                        isPublic,
                        updatedAt: new Date().toISOString()
                    };
                }
                return post;
            });
        } else {
            // Создание нового поста
            const newPost = {
                id: generateId(),
                title,
                content,
                author: currentUser.username,
                tags,
                isPublic,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                comments: []
            };
            
            posts.push(newPost);
        }
        
        localStorage.setItem('posts', JSON.stringify(posts));
        window.location.href = 'index.html';
    });
});

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}