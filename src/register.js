const apiUrl = 'http://localhost:3000/auth';

function validarCampos() {
  const nome = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const senha = document.getElementById('regSenha').value.trim();
  const msgElement = document.getElementById('registerMsg');
  
  msgElement.textContent = '';
  if (!nome) {
    msgElement.textContent = 'Por favor, informe seu nome de usuário.';
    msgElement.style.color = 'var(--msg)';
    document.getElementById('regNome').focus();
    return false;
  }
  
  if (!email) {
    msgElement.textContent = 'Por favor, informe seu email.';
    msgElement.style.color = 'var(--msg)';
    document.getElementById('regEmail').focus();
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    msgElement.textContent = 'Por favor, informe um email válido.';
    msgElement.style.color = 'var(--msg)';
    document.getElementById('regEmail').focus();
    return false;
  }
  
  if (!senha) {
    msgElement.textContent = 'Por favor, informe uma senha.';
    msgElement.style.color = 'var(--msg)';
    document.getElementById('regSenha').focus();
    return false;
  }
  
  if (senha.length < 6) {
    msgElement.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    msgElement.style.color = 'var(--msg)';
    document.getElementById('regSenha').focus();
    return false;
  }
  
  return true;
}

document.addEventListener('DOMContentLoaded', function() {
  // Verificar se já está logado
  checkAuthStatus();

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
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

async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorMessage = document.getElementById('errorMessage');
  
  // Limpar mensagens de erro anteriores
  errorMessage.style.display = 'none';
  
  // Validações
  if (!username || !email || !password || !confirmPassword) {
      showError('Por favor, preencha todos os campos.');
      return;
  }
  
  if (password !== confirmPassword) {
      showError('As senhas não coincidem.');
      return;
  }
  
  if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres.');
      return;
  }
  
  try {
      const response = await fetch('/auth/register', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          credentials: 'include', // Importante para sessões
          body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
          // Registro bem-sucedido - não precisa mais armazenar token
          window.location.href = '/feed';
      } else {
          showError(data.error || 'Erro no registro');
      }
  } catch (error) {
      console.error('Erro no registro:', error);
      showError('Erro de conexão. Tente novamente.');
  }
}

function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

document.getElementById('regNome').addEventListener('input', () => {
  document.getElementById('registerMsg').textContent = '';
});

document.getElementById('regEmail').addEventListener('input', () => {
  document.getElementById('registerMsg').textContent = '';
});

document.getElementById('regSenha').addEventListener('input', () => {
  document.getElementById('registerMsg').textContent = '';
});