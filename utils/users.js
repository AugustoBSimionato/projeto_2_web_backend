const User = require('../models/user');

// Remove JWT, usa apenas sessões
function verifyAuth(req) {
    if (!req.session || !req.session.userId) {
        return { success: false, error: 'Usuário não autenticado' };
    }
    return { success: true, userId: req.session.userId };
}

async function handleRegisterUser(req, res) {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return sendJSON(res, 400, { success: false, error: 'Todos os campos são obrigatórios' });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return sendJSON(res, 400, { success: false, error: 'Usuário ou email já existe' });
        }

        const user = new User({ username, email, password });
        await user.save();
        
        // Criar sessão após registro
        req.session.userId = user._id;
        req.session.username = user.username;
        
        sendJSON(res, 201, { 
            success: true, 
            message: 'Usuário criado com sucesso',
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function handleLoginUser(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return sendJSON(res, 400, { success: false, error: 'Email e senha são obrigatórios' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return sendJSON(res, 401, { success: false, error: 'Credenciais inválidas' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return sendJSON(res, 401, { success: false, error: 'Credenciais inválidas' });
        }

        // Criar sessão
        req.session.userId = user._id;
        req.session.username = user.username;
        
        sendJSON(res, 200, { 
            success: true, 
            message: 'Login realizado com sucesso',
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function handleLogoutUser(req, res) {
    try {
        req.session.destroy((err) => {
            if (err) {
                return sendJSON(res, 500, { success: false, error: 'Erro ao fazer logout' });
            }
            res.clearCookie('connect.sid');
            sendJSON(res, 200, { success: true, message: 'Logout realizado com sucesso' });
        });
    } catch (error) {
        console.error('Erro no logout:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

async function handleFollowUser(req, res) {
    const authResult = verifyAuth(req);
    if (!authResult.success) {
        return sendJSON(res, 401, authResult);
    }

    try {
        const { userIdToFollow } = req.body;
        const currentUserId = authResult.userId;

        if (currentUserId === userIdToFollow) {
            return sendJSON(res, 400, { success: false, error: 'Você não pode seguir a si mesmo' });
        }

        const currentUser = await User.findById(currentUserId);
        const userToFollow = await User.findById(userIdToFollow);

        if (!userToFollow) {
            return sendJSON(res, 404, { success: false, error: 'Usuário não encontrado' });
        }

        const isFollowing = currentUser.following.includes(userIdToFollow);

        if (isFollowing) {
            currentUser.following.pull(userIdToFollow);
            userToFollow.followers.pull(currentUserId);
        } else {
            currentUser.following.push(userIdToFollow);
            userToFollow.followers.push(currentUserId);
        }

        await currentUser.save();
        await userToFollow.save();

        sendJSON(res, 200, { 
            success: true, 
            message: isFollowing ? 'Deixou de seguir' : 'Seguindo usuário',
            isFollowing: !isFollowing
        });
    } catch (error) {
        console.error('Erro ao seguir usuário:', error);
        sendJSON(res, 500, { success: false, error: 'Erro interno do servidor' });
    }
}

function sendJSON(res, status, data) {
    res.status(status).json(data);
}

module.exports = {
    handleRegisterUser,
    handleLoginUser,
    handleLogoutUser,
    handleFollowUser,
    verifyAuth
};