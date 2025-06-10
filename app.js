const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

// Importar utils que agora usam MongoDB
const { handleRegisterUser, handleLoginUser, handleLogoutUser, handleFollowUser } = require('./utils/users');
const { createPost, getPosts, deletePost, likePost, searchPosts } = require('./utils/posts');
const { createComment, getComments, deleteComment } = require('./utils/comments');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nuvy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
});

// Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão com MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'blog_secret_key_2025',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/nuvy'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir arquivos estáticos
app.use(express.static('public'));
app.use('/src', express.static('src'));

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }
    next();
};

// Rotas de autenticação
app.post('/auth/register', handleRegisterUser);
app.post('/auth/login', handleLoginUser);
app.post('/auth/logout', handleLogoutUser);

// Rota para verificar se está logado
app.get('/auth/check', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            success: true, 
            user: { 
                id: req.session.userId, 
                username: req.session.username 
            } 
        });
    } else {
        res.status(401).json({ success: false, error: 'Não autenticado' });
    }
});

// Rotas dos posts
app.get('/api/posts', getPosts);
app.post('/api/posts', requireAuth, createPost);
app.delete('/api/posts/:id', requireAuth, deletePost);
app.post('/api/posts/like', requireAuth, likePost);
app.get('/api/posts/search', searchPosts);

// Rotas dos comentários
app.get('/api/comments', getComments);
app.post('/api/comments', requireAuth, createComment);
app.delete('/api/comments/:id', requireAuth, deleteComment);

// Rotas dos usuários
app.post('/api/users/follow', requireAuth, handleFollowUser);

// Rotas das páginas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/feed', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'feed.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;