const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { logError } = require('./logger');

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

async function handleFollowUser(req, res, userId) {
    try {
        const currentUserId = verifyAuth(req);

        if (!currentUserId) {
            return sendJSON(res, 401, { error: 'Por favor, faça login para acessar.' });
        }

        if (userId === currentUserId) {
            return sendJSON(res, 400, { error: 'Não é possível seguir a si mesmo.' });
        }

        const targetUser = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser) {
            return sendJSON(res, 404, { error: 'Usuário não encontrado.' });
        }

        const isFollowing = currentUser.seguindo.includes(userId);

        if (isFollowing) {
            currentUser.seguindo.pull(userId);
            targetUser.seguidores.pull(currentUserId);
            await currentUser.save();
            await targetUser.save();
            return sendJSON(res, 200, { message: 'Deixou de seguir o usuário.' });
        } else {
            currentUser.seguindo.push(userId);
            targetUser.seguidores.push(currentUserId);
            await currentUser.save();
            await targetUser.save();
            return sendJSON(res, 200, { message: 'Agora você está seguindo o usuário.' });
        }
    } catch (err) {
        console.error(err);
        logError(err);
        return sendJSON(res, 500, { error: 'Erro ao executar a ação de seguir/desseguir.' });
    }
}

module.exports = {
    verifyAuth,
    sendJSON,
    handleFollowUser
};