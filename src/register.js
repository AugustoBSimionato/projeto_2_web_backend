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

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgElement = document.getElementById('registerMsg');
  
  if (!validarCampos()) {
    return;
  }
  
  const nome = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const senha = document.getElementById('regSenha').value.trim();

  try {
    msgElement.textContent = 'Enviando...';
    
    console.log('Enviando para:', `${apiUrl}/register`);
    console.log('Dados:', { nome, email, senha });
    
    const res = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    
    const responseText = await res.text();
    console.log('Status da resposta:', res.status);
    console.log('Headers:', [...res.headers.entries()]);
    console.log('Texto da resposta:', responseText);
    
    if (!responseText) {
      throw new Error('Resposta vazia do servidor');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('Erro ao analisar JSON:', responseText);
      throw new Error('Resposta inválida do servidor');
    }
    
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao registrar');
    }
    
    msgElement.textContent = data.message || 'Usuário registrado com sucesso!';
    msgElement.style.color = 'green';
    
    if (data.message) {
      setTimeout(() => window.location.href = 'login.html', 1500);
    }
  } catch (error) {
    console.error('Erro:', error);
    msgElement.textContent = error.message || 'Ocorreu um erro ao registrar';
    msgElement.style.color = 'var(--msg)';
  }
});

document.getElementById('regNome').addEventListener('input', () => {
  document.getElementById('registerMsg').textContent = '';
});

document.getElementById('regEmail').addEventListener('input', () => {
  document.getElementById('registerMsg').textContent = '';
});

document.getElementById('regSenha').addEventListener('input', () => {
  document.getElementById('registerMsg').textContent = '';
});