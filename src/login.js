const apiUrl = 'http://localhost:3000/auth';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já está logado
    checkAuthStatus();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/check', {
            method: 'GET',
            credentials: 'include' // Importante para sessões
        });
        
        if (response.ok) {
            // Já está logado, redirecionar para o feed
            window.location.href = '/feed';
        }
    } catch (error) {
        console.log('Usuário não autenticado');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Limpar mensagens de erro anteriores
    errorMessage.style.display = 'none';
    
    // Validação básica
    if (!email || !password) {
        showError('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Importante para sessões
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Login bem-sucedido - não precisa mais armazenar token
            window.location.href = '/feed';
        } else {
            showError(data.error || 'Erro no login');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Erro de conexão. Tente novamente.');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Limpar mensagens ao digitar
document.getElementById('loginEmail').addEventListener('input', () => {
  document.getElementById('loginMsg').textContent = '';
});

document.getElementById('loginSenha').addEventListener('input', () => {
  document.getElementById('loginMsg').textContent = '';
});
