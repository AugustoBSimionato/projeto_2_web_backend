const Post = require('../models/post');
const Comment = require('../models/comment');
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

async function getPostById(req, res, postId) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const post = await Post.findById(postId)
      .populate('autor', 'nome email');
      
    if (!post) {
      return sendJSON(res, 404, { error: 'Post não encontrado.' });
    }
    
    sendJSON(res, 200, post);
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao buscar post.' });
  }
}

async function getPosts(req, res) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const parsedUrl = url.parse(req.url, true);
    const postId = parsedUrl.query.post;

    if (postId) {
      const comments = await Comment.find({ post: postId })
        .populate('autor', 'nome email')
        .sort({ dataCriacao: -1 });
      return sendJSON(res, 200, comments);
    }

    const posts = await Post.find()
      .populate('autor', 'nome email seguidores')
      .sort({ dataCriacao: -1 });
    sendJSON(res, 200, posts);
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao buscar posts ou comentários.' });
  }
}

async function createPost(req, res) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const body = await getRequestBody(req);
    const { post, conteudo } = body;

    if (post) {
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

      return sendJSON(res, 201, comment);
    }

    const newPost = new Post({
      autor: userId,
      conteudo
    });
    await newPost.save();
    await newPost.populate('autor', 'nome email');
    sendJSON(res, 201, { message: 'Post criado com sucesso!', post: newPost });
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao criar post ou comentário.' });
  }
}

async function searchPosts(req, res) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const query = parsedUrl.query.query;
    console.log('Query de busca:', query);
    
    const posts = await Post.find({
      conteudo: { $regex: query, $options: 'i' }
    }).populate('autor', 'nome email');
    
    sendJSON(res, 200, posts);
  } catch (err) {
    console.error(err);
    logError(err);
    sendJSON(res, 500, { error: 'Erro na busca de posts.' });
  }
}

async function deletePost(req, res, postId) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return sendJSON(res, 404, { error: 'Post não encontrado.' });
    }

    if (post.autor.toString() !== userId) {
      return sendJSON(res, 403, { error: 'Você não tem permissão para excluir este post.' });
    }

    await Post.findByIdAndDelete(postId);
    sendJSON(res, 200, { message: 'Post excluído com sucesso!' });
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao excluir post.' });
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

async function likePost(req, res, postId) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return sendJSON(res, 404, { error: 'Post não encontrado.' });
    }

    const index = post.curtidas.findIndex(id => id.toString() === userId);
    if (index === -1) {
      post.curtidas.push(userId);
    } else {
      post.curtidas = post.curtidas.filter(id => id.toString() !== userId);
    }

    await post.save();
    sendJSON(res, 200, { message: 'Ação realizada com sucesso!', curtidas: post.curtidas.length });
  } catch (err) {
    logError(err);
    sendJSON(res, 500, { error: 'Erro ao processar a ação.' });
  }
}

module.exports = {
  getPostById,
  getPosts,
  createPost,
  searchPosts,
  deletePost,
  deleteComment,
  likePost,
  verifyAuth,
  sendJSON
};