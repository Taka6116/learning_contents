// アプリケーション
const app = {
    currentPage: 'home',
    currentPostId: null,
    currentEditId: null,
    filteredAuthor: null,
    searchQuery: '',
    pageNumber: 1,
    postsPerPage: 9,
    likes: {},

    // 初期化
	    async init() {
	        this.loadTheme();
	        await this.loadData(); // データ読み込みを待つ
	        this.render();
	        // 初期化後に投稿を新しい順にソート
	        this.sortPosts();
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    // ルーティング処理
    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, id] = hash.split('/').filter(Boolean);

        if (hash === '' || hash === '/') {
            this.goHome();
        } else if (path === 'new') {
            this.goNew();
        } else if (path === 'post' && id) {
            this.goDetail(id);
        } else {
            this.goHome();
        }
    },

    // ページ遷移
    goHome() {
        window.location.hash = '/';
        this.currentPage = 'home';
        this.currentEditId = null;
        this.filteredAuthor = null;
        document.getElementById('searchInput').value = '';
        document.getElementById('filterAuthorBtn').style.display = 'none';
        this.render();
    },

    goNew() {
        window.location.hash = '/new';
        this.currentPage = 'new';
        this.currentEditId = null;
        this.resetForm();
        this.render();
    },

    goDetail(id) {
        window.location.hash = `/post/${id}`;
        this.currentPage = 'detail';
        this.currentPostId = id;
        this.render();
    },

    // ページ表示
    render() {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(this.currentPage).classList.add('active');

        if (this.currentPage === 'home') {
            this.renderHome();
        } else if (this.currentPage === 'detail') {
            this.renderDetail();
        } else if (this.currentPage === 'new') {
            this.renderNewForm();
        }
    },

	    // ホームページレンダリング
	    renderHome() {
	        const posts = this.getFilteredPosts();
	        
	        // ページネーションの調整
	        const totalPages = Math.ceil(posts.length / this.postsPerPage);
	        
	        // 現在のページ番号が総ページ数を超えないように調整
	        if (this.pageNumber > totalPages && totalPages > 0) {
	            this.pageNumber = totalPages;
	        } else if (this.pageNumber === 0 && totalPages > 0) {
	            this.pageNumber = 1;
	        } else if (totalPages === 0) {
	            this.pageNumber = 1;
	        }
	        
	        const start = (this.pageNumber - 1) * this.postsPerPage;
	        const end = start + this.postsPerPage;
	        const paginatedPosts = posts.slice(start, end);

        const postsList = document.getElementById('postsList');
        postsList.innerHTML = '';

        if (paginatedPosts.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        document.getElementById('emptyState').style.display = 'none';

        paginatedPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.onclick = () => this.goDetail(post.id);

            const date = new Date(post.createdAt);
            const formattedDate = this.formatDate(date);

            card.innerHTML = `
                <div class="post-header">
                    <div>
                        <div class="post-author" onclick="event.stopPropagation(); app.filterByAuthor('${this.escapeHtml(post.name)}')">${this.escapeHtml(post.name)}</div>
                        <div class="post-date">${formattedDate}</div>
                    </div>
                </div>
                <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                <p class="post-preview">${this.escapeHtml(post.body)}</p>
                <div class="post-meta">
                    <div class="post-stats">
                        <span>💬 ${post.comments ? post.comments.length : 0}</span>
                        <span id="like-count-${post.id}">❤️ ${this.likes[post.id] || 0}</span>
                    </div>
                </div>
            `;

            postsList.appendChild(card);
        });

        this.renderPagination(totalPages);
    },

    // ページネーション
    renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

	        const prevBtn = document.createElement('button');
	        prevBtn.textContent = '← 前のページ';
	        prevBtn.className = 'pagination-button';
        prevBtn.disabled = this.pageNumber === 1;
        prevBtn.onclick = () => {
            if (this.pageNumber > 1) {
                this.pageNumber--;
                this.renderHome();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        pagination.appendChild(prevBtn);

        // ページ番号表示
        const startPage = Math.max(1, this.pageNumber - 2);
        const endPage = Math.min(totalPages, this.pageNumber + 2);

        if (startPage > 1) {
            const btn = document.createElement('button');
            btn.textContent = '1';
            btn.onclick = () => {
                this.pageNumber = 1;
                this.renderHome();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            pagination.appendChild(btn);

            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.className = 'pagination-dots';
                pagination.appendChild(dots);
            }
        }

	        for (let i = startPage; i <= endPage; i++) {
	            const btn = document.createElement('button');
	            btn.textContent = i;
	            btn.className = this.pageNumber === i ? 'pagination-button active' : 'pagination-button';
	            btn.onclick = () => {
	                this.pageNumber = i;
	                this.renderHome();
	                window.scrollTo({ top: 0, behavior: 'smooth' });
	            };
	            pagination.appendChild(btn);
	        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.className = 'pagination-dots';
                pagination.appendChild(dots);
            }

            const btn = document.createElement('button');
            btn.textContent = totalPages;
            btn.onclick = () => {
                this.pageNumber = totalPages;
                this.renderHome();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            pagination.appendChild(btn);
        }

	        const nextBtn = document.createElement('button');
	        nextBtn.textContent = '次のページ →';
	        nextBtn.className = 'pagination-button';
        nextBtn.disabled = this.pageNumber === totalPages;
        nextBtn.onclick = () => {
            if (this.pageNumber < totalPages) {
                this.pageNumber++;
                this.renderHome();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        pagination.appendChild(nextBtn);
    },

    // 詳細ページレンダリング
    renderDetail() {
        const post = this.data.posts.find(p => p.id === this.currentPostId);
        if (!post) {
            this.goHome();
            return;
        }

        const date = new Date(post.createdAt);
        const formattedDate = this.formatDate(date);

        document.getElementById('detailTitle').textContent = post.title;
        document.getElementById('detailAuthor').textContent = post.name;
        document.getElementById('detailDate').textContent = formattedDate;
        document.getElementById('detailBody').textContent = post.body;

        // いいねボタン
        const likeBtn = document.getElementById('likeBtn');
        if (this.likes[post.id]) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }

        // コメント表示
        this.renderComments(post.id);
    },

    // コメント表示
    renderComments(postId) {
        const post = this.data.posts.find(p => p.id === postId);
        const commentsList = document.getElementById('commentsList');
        const noComments = document.getElementById('noComments');

        commentsList.innerHTML = '';

        if (!post.comments || post.comments.length === 0) {
            noComments.style.display = 'block';
            return;
        }

        noComments.style.display = 'none';

        post.comments.forEach((comment, index) => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment';

            const date = new Date(comment.createdAt);
            const formattedDate = this.formatDate(date);

            commentEl.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">${this.escapeHtml(comment.name)}</div>
                    <div class="comment-date">${formattedDate}</div>
                </div>
                <div class="comment-body">${this.escapeHtml(comment.body)}</div>
                <div class="comment-actions-small">
                    <button class="comment-delete-btn" onclick="app.deleteComment('${postId}', ${index})">削除</button>
                </div>
            `;

            commentsList.appendChild(commentEl);
        });
    },

    // 新規投稿フォームレンダリング
    renderNewForm() {
        const formTitle = document.getElementById('formTitle');
        const nameInput = document.getElementById('nameInput');
        const titleInput = document.getElementById('titleInput');
        const bodyInput = document.getElementById('bodyInput');

        if (this.currentEditId) {
            formTitle.textContent = '投稿を編集';
            const post = this.data.posts.find(p => p.id === this.currentEditId);
            if (post) {
                nameInput.value = post.name;
                titleInput.value = post.title;
                bodyInput.value = post.body;
            }
        } else {
            formTitle.textContent = '新規投稿';
            this.resetForm();
        }
    },

    // フォームリセット
    resetForm() {
        document.getElementById('postForm').reset();
        document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('.form-input, .form-textarea').forEach(el => el.classList.remove('error'));
    },

    // フォーム送信
    async handleSubmit(event) {
        event.preventDefault();

        const name = document.getElementById('nameInput').value.trim();
        const title = document.getElementById('titleInput').value.trim();
        const body = document.getElementById('bodyInput').value.trim();

        // バリデーション
        let isValid = true;
        if (!name) {
            this.showError('nameInput', 'nameError', '名前を入力してください');
            isValid = false;
        }
        if (!title) {
            this.showError('titleInput', 'titleError', 'タイトルを入力してください');
            isValid = false;
        }
        if (!body) {
            this.showError('bodyInput', 'bodyError', '概要・学びを入力してください');
            isValid = false;
        }

        if (!isValid) return;

	        if (this.currentEditId) {
	            // 編集
	            const post = this.data.posts.find(p => p.id === this.currentEditId);
	            if (post) {
	                post.name = name;
	                post.title = title;
	                post.body = body;
	                post.updatedAt = new Date().toISOString();
	                this.sortPosts(); // 更新後もソートを維持
	            }
	            this.showToast('投稿を更新しました', 'success');
	        } else {
	            // 新規作成
	            const newPost = {
	                id: Date.now().toString(),
	                name,
	                title,
	                body,
	                createdAt: new Date().toISOString(),
	                updatedAt: new Date().toISOString(),
	                comments: []
	            };
	            this.data.posts.push(newPost); // sortPostsでソートするのでpushに変更
	            this.sortPosts(); // 新規投稿後もソートを維持
	            this.showToast('投稿を保存しました', 'success');
	        }

        await this.saveData();
        this.goHome();
    },

    // エラー表示
    showError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        input.classList.add('error');
        error.textContent = message;
        error.classList.add('show');
    },

    // 検索処理
    handleSearch() {
        this.searchQuery = document.getElementById('searchInput').value.toLowerCase();
        this.pageNumber = 1;
        this.renderHome();
    },

    // 作者でフィルタ
    filterByAuthor(author) {
        this.filteredAuthor = author;
        this.searchQuery = '';
        this.pageNumber = 1;
        document.getElementById('searchInput').value = '';
        document.getElementById('filterAuthorBtn').style.display = 'inline-block';
        this.renderHome();
    },

    // フィルタクリア
    clearAuthorFilter() {
        this.filteredAuthor = null;
        this.pageNumber = 1;
        document.getElementById('filterAuthorBtn').style.display = 'none';
        this.renderHome();
    },

	    // フィルタ済み投稿取得
	    getFilteredPosts() {
	        let posts = [...this.data.posts];
	
	        // 投稿はloadDataとsortPostsでソート済み
	
	        if (this.filteredAuthor) {
	            posts = posts.filter(p => p.name === this.filteredAuthor);
	        }
	
	        if (this.searchQuery) {
	            const query = this.searchQuery.toLowerCase();
	            posts = posts.filter(p =>
	                p.title.toLowerCase().includes(query) ||
	                p.body.toLowerCase().includes(query) ||
	                p.name.toLowerCase().includes(query)
	            );
	        }
	
	        return posts;
	    },

    // 投稿編集
    editPost() {
        this.currentEditId = this.currentPostId;
        this.goNew();
    },

    // 投稿削除
    deletePost() {
        document.getElementById('deleteModal').classList.add('active');
    },

    // 削除確認
	    async confirmDelete() {
	        this.data.posts = this.data.posts.filter(p => p.id !== this.currentPostId);
	        this.sortPosts(); // 削除後もソートを維持
	        delete this.likes[this.currentPostId];
	        await this.saveData();
	        await this.saveLikes();
	        this.closeModal();
	        this.showToast('投稿を削除しました', 'success');
	        this.goHome();
	    },

    // モーダルクローズ
    closeModal() {
        document.getElementById('deleteModal').classList.remove('active');
    },

    // いいねトグル
    async toggleLike() {
        if (this.likes[this.currentPostId]) {
            this.likes[this.currentPostId]--;
            if (this.likes[this.currentPostId] === 0) {
                delete this.likes[this.currentPostId];
            }
        } else {
            this.likes[this.currentPostId] = 1;
        }
        await this.saveLikes();
        this.renderDetail();
    },

    // コメント追加
    async addComment() {
        const nameInput = document.getElementById('commentNameInput');
        const bodyInput = document.getElementById('commentBodyInput');

        const name = nameInput.value.trim();
        const body = bodyInput.value.trim();

        if (!name || !body) {
            this.showToast('名前とコメントを入力してください', 'error');
            return;
        }

        const post = this.data.posts.find(p => p.id === this.currentPostId);
        if (!post) return;

        if (!post.comments) {
            post.comments = [];
        }

        post.comments.push({
            name,
            body,
            createdAt: new Date().toISOString()
        });

	        await this.saveData();
	        nameInput.value = '';
	        bodyInput.value = '';
	        this.showToast('コメントを追加しました', 'success');
	        this.renderComments(this.currentPostId);
	        this.renderHome(); // コメント数更新のためホームも再レンダリング
	    },

    // コメント削除
    async deleteComment(postId, index) {
        if (confirm('このコメントを削除しますか？')) {
            const post = this.data.posts.find(p => p.id === postId);
            if (post && post.comments) {
	                post.comments.splice(index, 1);
	                await this.saveData();
	                this.showToast('コメントを削除しました', 'success');
	                this.renderComments(postId);
	                this.renderHome(); // コメント数更新のためホームも再レンダリング
	            }
	        }
	    },

    // トースト通知
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // 日付フォーマット
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    // HTML エスケープ
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // データ管理
    data: {
        posts: []
    },

	    // データ読み込み（localStorageを使用）
	    async loadData() {
	        try {
	            const dataString = localStorage.getItem('learningAppData');
	            if (dataString) {
	                this.data = JSON.parse(dataString);
	                // データの整合性チェック
	                if (!this.data.posts) {
	                    this.data.posts = [];
	                }
	            } else {
	                // 初回アクセス時は初期データを作成
	                await this.initDummyData();
	            }
	        } catch (error) {
	            console.error('データ読み込みエラー:', error);
	            // エラー時も空のデータで続行
	            this.data.posts = [];
	            await this.initDummyData();
	        }
	        await this.loadLikes();
	        this.sortPosts(); // 読み込み後にソート
	        
	        // データ読み込み後にホームページを再レンダリング
	        if (this.currentPage === 'home') {
	            this.renderHome();
	        }
	    },
	
	    // 初期データ作成（サンプルは全部削除の要望に基づき、データが存在しない場合のみ作成）
	    async initDummyData() {
            // サンプルデータは削除の要望があるため、データが存在しない場合のみ空の配列を設定
            if (!this.data.posts || this.data.posts.length === 0) {
                this.data.posts = [];
            }
	        await this.saveData();
	    },
	
	    // データ保存（localStorageを使用）
	    async saveData() {
	        try {
	            localStorage.setItem('learningAppData', JSON.stringify(this.data));
	        } catch (error) {
	            console.error('データ保存エラー:', error);
	            this.showToast('データの保存に失敗しました', 'error');
	        }
	    },

	    // いいね読み込み
	    async loadLikes() {
	        try {
	            const likesString = localStorage.getItem('learningAppLikes');
	            if (likesString) {
	                this.likes = JSON.parse(likesString);
	            }
	        } catch (error) {
	            console.log('いいねデータ読み込みエラー');
	        }
	    },
	
	    // いいね保存
	    async saveLikes() {
	        try {
	            localStorage.setItem('learningAppLikes', JSON.stringify(this.likes));
	        } catch (error) {
	            console.error('いいね保存エラー:', error);
	        }
	    },

	    // テーマ管理
	    async loadTheme() {
	        try {
	            const theme = localStorage.getItem('learningAppTheme') || 'light';
	            if (theme === 'dark') {
	                document.body.classList.add('dark-mode');
	                document.querySelector('.theme-toggle').textContent = '☀️';
	            }
	        } catch (error) {
	            // デフォルトはライトモード
	        }
	    },
	
	    async toggleTheme() {
	        document.body.classList.toggle('dark-mode');
	        const isDark = document.body.classList.contains('dark-mode');
	        try {
	            localStorage.setItem('learningAppTheme', isDark ? 'dark' : 'light');
	        } catch (error) {
	            console.error('テーマ保存エラー:', error);
	        }
	        document.querySelector('.theme-toggle').textContent = isDark ? '☀️' : '🌙';
	    },
	
	    // 投稿を新しい順にソートするヘルパー関数
	    sortPosts() {
	        this.data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	    }
};

// アプリ起動
document.addEventListener('DOMContentLoaded', () => app.init());
