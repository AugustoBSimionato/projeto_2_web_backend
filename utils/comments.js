const Comment = require('../models/comment');
const Post = require('../models/post');
const jwt = require('jsonwebtoken');
const { logError } = require('./logger');
const url = require('url');

function verifyAuth(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    return decoded.id;
  } catch (err) {
    return null;
  }
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

function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
  });
}

async function getComments(req, res) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const parsedUrl = url.parse(req.url, true);
    const postId = parsedUrl.query.post;
    
    if (!postId) {
      return sendJSON(res, 400, { error: 'ID do post é obrigatório.' });
    }
    
    const comments = await Comment.find({ post: postId })
      .populate('autor', 'nome email')
      .sort({ dataCriacao: -1 });
      
    sendJSON(res, 200, comments);
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao buscar comentários.' });
  }
}

async function createComment(req, res) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const body = await getRequestBody(req);
    const { post, conteudo } = body;
    
    const postExists = await Post.findById(post);
    if (!postExists) {
      return sendJSON(res, 404, { error: 'Post não encontrado.' });
    }
    
    const comment = new Comment({
      autor: userId,
      post,
      conteudo
    });
    
    await comment.save();
    await comment.populate('autor', 'nome email');
    
    sendJSON(res, 201, comment);
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao criar comentário.' });
  }
}

async function deleteComment(req, res, commentId) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return sendJSON(res, 404, { error: 'Comentário não encontrado.' });
    }
    
    if (comment.autor.toString() !== userId) {
      return sendJSON(res, 403, { error: 'Você não tem permissão para excluir este comentário.' });
    }
    
    await Comment.findByIdAndDelete(commentId);
    sendJSON(res, 200, { message: 'Comentário excluído com sucesso!' });
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao excluir comentário.' });
  }
}

module.exports = {
  getComments,
  createComment,
  deleteComment,
  verifyAuth,
  sendJSON
};