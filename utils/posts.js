const Post = require('../models/post');
const User = require('../models/user');

// Remove JWT, usa apenas sessões
function verifyAuth(req) {
    if (!req.session || !req.session.userId) {
        return { success: false, error: 'Usuário não autenticado' };
    }
    return { success: true, userId: req.session.userId };
}

async function createPost(req, res) {
    const authResult = verifyAuth(req);
    if (!authResult.success) {
        return sendJSON(res, 401, authResult);
    }

    try {
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return sendJSON(res, 400, { success: false, error: 'Conteúdo do post é obrigatório' });
        }

        const user = await User.findById(authResult.userId);
        if (!user) {
            return sendJSON(res, 404, { success: false, error: 'Usuário não encontrado' });
        }

        const post = new Post({
            content: content.trim(),
            author: authResult.userId,
            createdAt: new Date()
        });

        await post.save();
        await post.populate('author', 'username');

        sendJSON(res, 201, { 
            success: true, 
            message: 'Post criado com sucesso',
            post: {
                _id: post._id,
                content: post.content,
                author: { _id: post.author._id, username: post.author.username },
                createdAt: post.createdAt,
                likes: post.likes,
                comments: post.comments
            }
        });
    } catch (error) {
        console.error('Erro ao criar post:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function getPosts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments();

        sendJSON(res, 200, { 
            success: true, 
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Erro ao buscar posts:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function deletePost(req, res) {
    const authResult = verifyAuth(req);
    if (!authResult.success) {
        return sendJSON(res, 401, authResult);
    }

    try {
        const { id } = req.params;
        
        const post = await Post.findById(id);
        if (!post) {
            return sendJSON(res, 404, { success: false, error: 'Post não encontrado' });
        }

        if (post.author.toString() !== authResult.userId) {
            return sendJSON(res, 403, { success: false, error: 'Não autorizado a deletar este post' });
        }

        await Post.findByIdAndDelete(id);
        
        sendJSON(res, 200, { success: true, message: 'Post deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar post:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function likePost(req, res) {
    const authResult = verifyAuth(req);
    if (!authResult.success) {
        return sendJSON(res, 401, authResult);
    }

    try {
        const { postId } = req.body;
        const userId = authResult.userId;

        const post = await Post.findById(postId);
        if (!post) {
            return sendJSON(res, 404, { success: false, error: 'Post não encontrado' });
        }

        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();

        sendJSON(res, 200, { 
            success: true, 
            message: hasLiked ? 'Like removido' : 'Post curtido',
            likesCount: post.likes.length,
            hasLiked: !hasLiked
        });
    } catch (error) {
        console.error('Erro ao curtir post:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function searchPosts(req, res) {
    try {
        const { query } = req.query;
        
        if (!query || query.trim() === '') {
            return sendJSON(res, 400, { success: false, error: 'Termo de busca é obrigatório' });
        }

        const posts = await Post.find({
            content: { $regex: query, $options: 'i' }
        })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(20);

        sendJSON(res, 200, { success: true, posts });
    } catch (error) {
        console.error('Erro na busca:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

function sendJSON(res, status, data) {
    res.status(status).json(data);
}

module.exports = {
    createPost,
    getPosts,
    deletePost,
    likePost,
    searchPosts,
    verifyAuth
};