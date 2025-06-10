const apiUrl = 'http://localhost:3000/auth';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();

  if (!email || !senha) {
    document.getElementById('loginMsg').style.color = '#d32f2f';
    document.getElementById('loginMsg').textContent = 'Preencha todos os campos obrigatórios.';
    return;
  }

  const res = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    document.getElementById('loginMsg').style.color = 'green';
    document.getElementById('loginMsg').textContent = 'Login realizado com sucesso!';
    setTimeout(() => window.location.href = 'feed.html', 1500);
  } else {
    document.getElementById('loginMsg').style.color = '#d32f2f';
    if (res.status === 401 || data.error === 'Credenciais inválidas') {
      document.getElementById('loginMsg').textContent = 'E-mail ou senha incorretos.';
    } else {
      document.getElementById('loginMsg').textContent = data.error || 'Erro ao realizar login.';
    }
  }
});
