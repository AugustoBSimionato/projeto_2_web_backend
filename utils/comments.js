const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user');

// Remove JWT, usa apenas sessões
function verifyAuth(req) {
    if (!req.session || !req.session.userId) {
        return { success: false, error: 'Usuário não autenticado' };
    }
    return { success: true, userId: req.session.userId };
}

async function createComment(req, res) {
    const authResult = verifyAuth(req);
    if (!authResult.success) {
        return sendJSON(res, 401, authResult);
    }

    try {
        const { postId, content } = req.body;
        
        if (!postId || !content || content.trim() === '') {
            return sendJSON(res, 400, { success: false, error: 'Post ID e conteúdo são obrigatórios' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return sendJSON(res, 404, { success: false, error: 'Post não encontrado' });
        }

        const user = await User.findById(authResult.userId);
        if (!user) {
            return sendJSON(res, 404, { success: false, error: 'Usuário não encontrado' });
        }

        const comment = new Comment({
            content: content.trim(),
            author: authResult.userId,
            post: postId,
            createdAt: new Date()
        });

        await comment.save();
        await comment.populate('author', 'username');

        // Adicionar comentário ao post
        post.comments.push(comment._id);
        await post.save();

        sendJSON(res, 201, { 
            success: true, 
            message: 'Comentário criado com sucesso',
            comment: {
                _id: comment._id,
                content: comment.content,
                author: { _id: comment.author._id, username: comment.author.username },
                createdAt: comment.createdAt
            }
        });
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function getComments(req, res) {
    try {
        const { postId } = req.query;
        
        if (!postId) {
            return sendJSON(res, 400, { success: false, error: 'Post ID é obrigatório' });
        }

        const comments = await Comment.find({ post: postId })
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        sendJSON(res, 200, { success: true, comments });
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function deleteComment(req, res) {
    const authResult = verifyAuth(req);
    if (!authResult.success) {
        return sendJSON(res, 401, authResult);
    }

    try {
        const { id } = req.params;
        
        const comment = await Comment.findById(id);
        if (!comment) {
            return sendJSON(res, 404, { success: false, error: 'Comentário não encontrado' });
        }

        if (comment.author.toString() !== authResult.userId) {
            return sendJSON(res, 403, { success: false, error: 'Não autorizado a deletar este comentário' });
        }

        // Remover comentário do post
        await Post.findByIdAndUpdate(comment.post, {
            $pull: { comments: comment._id }
        });

        await Comment.findByIdAndDelete(id);
        
        sendJSON(res, 200, { success: true, message: 'Comentário deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

function sendJSON(res, status, data) {
    res.status(status).json(data);
}

module.exports = {
    createComment,
    getComments,
    deleteComment,
    verifyAuth
};