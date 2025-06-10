const bcrypt = require('bcrypt');

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

// Função para verificar autenticação no frontend (opcional)
async function checkAuth() {
    try {
        const response = await fetch('/auth/check', {
            credentials: 'include'
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Erro de conexão' };
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    checkAuth
};