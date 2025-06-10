const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const apiUrl = `/api/posts/${postId}`;

async function carregarPost() {
  const res = await fetch(apiUrl, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  const post = await res.json();
  document.getElementById('postDetalhe').innerHTML = `
    <h2>${post.autor.nome}</h2>
    <p>${post.conteudo}</p>
    <p><small>${new Date(post.dataCriacao).toLocaleString()}</small></p>
  `;
  carregarComentarios();
}

window.onload = carregarPost;