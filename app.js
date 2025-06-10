const http = require('http');
const url = require('url');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');

const { logError } = require('./utils/logger');
const { verifyToken, hashPassword, comparePassword, generateToken } = require('./utils/auth');
const { handleFollowUser } = require('./utils/users');
const { 
  getPostById, 
  getPosts, 
  createPost, 
  searchPosts, 
  deletePost, 
  deleteComment: deletePostComment, 
  likePost 
} = require('./utils/posts');
const { 
  getComments, 
  createComment, 
  deleteComment: deleteCommentFromComments 
} = require('./utils/comments');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nuvy')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  console.log(`${method} ${path}`);

  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  try {
    if (path === '/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { nome, email, senha } = body;

      if (!nome || !email || !senha) {
        return sendJSON(res, 400, { error: 'Todos os campos são obrigatórios.' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendJSON(res, 400, { error: 'Este email já está em uso.' });
      }

      const hashedPassword = await hashPassword(senha);
      const user = new User({ nome, email, senha: hashedPassword });
      await user.save();

      sendJSON(res, 201, { message: 'Usuário registrado com sucesso!' });
    }
    
    else if (path === '/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, senha } = body;

      if (!email || !senha) {
        return sendJSON(res, 400, { error: 'Email e senha são obrigatórios.' });
      }

      const user = await User.findOne({ email });
      if (!user || !(await comparePassword(senha, user.senha))) {
        return sendJSON(res, 401, { error: 'Credenciais inválidas' });
      }

      const token = generateToken(user._id);
      sendJSON(res, 200, { token, message: 'Login realizado com sucesso!' });
    }
    
    else if (path === '/auth/profile' && method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const userId = verifyToken(token);
      
      if (!userId) {
        return sendJSON(res, 401, { error: 'Token inválido.' });
      }

      const user = await User.findById(userId).select('-senha');
      if (!user) {
        return sendJSON(res, 404, { error: 'Usuário não encontrado.' });
      }

      sendJSON(res, 200, {
        id: user._id,
        nome: user.nome,
        email: user.email,
        descricao: user.descricao,
        dataCriacao: user.dataCriacao,
        seguidores: user.seguidores,
        seguindo: user.seguindo
      });
    }
    
    else if (path === '/api/posts' && method === 'GET') {
      await getPosts(req, res);
    }
    
    else if (path.match(/^\/api\/posts\/[^\/]+$/) && method === 'GET' && !path.includes('/like') && !path.includes('/comment') && !path.includes('/search')) {
      const postId = path.split('/')[3];
      await getPostById(req, res, postId);
    }
    
    else if (path === '/api/posts' && method === 'POST') {
      await createPost(req, res);
    }
    
    else if (path === '/api/posts/search' && method === 'GET') {
      await searchPosts(req, res);
    }
    
    else if (path.match(/^\/api\/posts\/[^\/]+$/) && method === 'DELETE' && !path.includes('/comment')) {
      const postId = path.split('/')[3];
      await deletePost(req, res, postId);
    }
    
    else if (path.match(/^\/api\/posts\/[^\/]+\/comment$/) && method === 'DELETE') {
      const commentId = path.split('/')[3];
      await deletePostComment(req, res, commentId);
    }
    
    else if (path.match(/^\/api\/posts\/[^\/]+\/like$/) && method === 'PATCH') {
      const postId = path.split('/')[3];
      await likePost(req, res, postId);
    }
    
    else if (path === '/api/comments' && method === 'GET') {
      await getComments(req, res);
    }
    
    else if (path === '/api/comments' && method === 'POST') {
      await createComment(req, res);
    }
    
    else if (path.match(/^\/api\/comments\/[^\/]+$/) && method === 'DELETE') {
      const commentId = path.split('/')[3];
      await deleteCommentFromComments(req, res, commentId);
    }
    
    else if (path.startsWith('/api/users/follow/') && method === 'PATCH') {
      const userId = path.split('/')[4];
      await handleFollowUser(req, res, userId);
    }
    
    else {
      sendJSON(res, 404, { error: 'Rota não encontrada.' });
    }
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    logError(error);
    sendJSON(res, 500, { error: 'Erro interno do servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});