document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  if (!postId) {
    alert("Post ID inválido");
    window.location.href = "feed.html";
    return;
  }

  const postDetailsEl = document.getElementById("postDetails");
  const commentsContainer = document.getElementById("commentsContainer");
  const commentInput = document.getElementById("commentInput");
  const postCommentBtn = document.getElementById("postCommentBtn");

  let deleteCommentId = null;

  async function carregarPost() {
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/posts/${postId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Erro ao carregar post");
      const post = await res.json();
      renderPostDetails(post);
    } catch (error) {
      console.error("Erro ao carregar post:", error);
    }
  }

  function renderPostDetails(post) {
    const data = new Date(post.dataCriacao);
    const agora = new Date();
    const diff = agora - data;
    let timeStr;
    if (diff < 60000) {
      timeStr = "agora";
    } else if (diff < 3600000) {
      timeStr = `${Math.floor(diff / 60000)} min`;
    } else if (diff < 86400000) {
      timeStr = `${Math.floor(diff / 3600000)}h`;
    } else {
      timeStr = `${Math.floor(diff / 86400000)} dias`;
    }
    postDetailsEl.innerHTML = `
            <div class="post-header">
                <span class="post-username">${post.autor.nome}</span>
                <span class="post-meta">${timeStr}</span>
            </div>
            <p>${post.conteudo}</p>
            <div class="post-stats">
                <span><i class="fa-solid fa-heart"></i> ${post.curtidas.length}</span>
            </div>
        `;
  }

  async function carregarComentarios() {
    try {
      const res = await fetch(
        `http://127.0.0.1:3000/api/comments?post=${postId}`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      if (!res.ok) throw new Error("Erro ao carregar comentários");
      const comments = await res.json();
      renderComentarios(comments);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    }
  }

  function renderComentarios(comments) {
    commentsContainer.innerHTML = "";
    if (comments.length === 0) {
      commentsContainer.innerHTML = "<p>Nenhum comentário adicionado.</p>";
      return;
    }
    comments.forEach((comment) => {
      const commentEl = document.createElement("div");
      commentEl.className = "comment-item";
      const data = new Date(comment.dataCriacao);
      const agora = new Date();
      let diff = agora - data;
      let timeStr;
      if (diff < 60000) {
        timeStr = "agora";
      } else if (diff < 3600000) {
        timeStr = `${Math.floor(diff / 60000)} min`;
      } else if (diff < 86400000) {
        timeStr = `${Math.floor(diff / 3600000)}h`;
      } else {
        timeStr = `${Math.floor(diff / 86400000)} dias`;
      }
      commentEl.innerHTML = `
                <div class="comment-header">
                    <span class="comment-username">${comment.autor.nome}</span>
                    <span class="comment-meta">${timeStr}</span>
                </div>
                <p>${comment.conteudo}</p>
            `;
      if (comment.autor._id === getUserId()) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-comment-btn";
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        deleteBtn.addEventListener("click", () => {
          deleteCommentId = comment._id;
          openDeletePopup();
        });
        commentEl.appendChild(deleteBtn);
      }
      commentsContainer.appendChild(commentEl);
    });
  }

  function getUserId() {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  }

  async function postarComentario() {
    const conteudo = commentInput.value.trim();
    if (!conteudo) return;
    try {
      const res = await fetch("http://127.0.0.1:3000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ post: postId, conteudo }),
      });
      if (!res.ok) throw new Error("Erro ao postar comentário");
      commentInput.value = "";
      carregarComentarios();
    } catch (error) {
      console.error("Erro ao postar comentário:", error);
    }
  }

  postCommentBtn.addEventListener("click", postarComentario);

  const deleteCommentPopup = document.getElementById("deleteCommentPopup");
  const closeDeleteCommentPopup = document.getElementById(
    "closeDeleteCommentPopup"
  );
  const cancelDeleteComment = document.getElementById("cancelDeleteComment");
  const confirmDeleteComment = document.getElementById("confirmDeleteComment");

  function openDeletePopup() {
    deleteCommentPopup.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDeletePopup() {
    deleteCommentPopup.classList.remove("active");
    document.body.style.overflow = "";
  }

  closeDeleteCommentPopup.addEventListener("click", closeDeletePopup);
  cancelDeleteComment.addEventListener("click", closeDeletePopup);
  deleteCommentPopup.addEventListener("click", (e) => {
    if (e.target === deleteCommentPopup) {
      closeDeletePopup();
    }
  });

  confirmDeleteComment.addEventListener("click", async () => {
    if (deleteCommentId) {
      try {
        const res = await fetch(
          `http://127.0.0.1:3000/api/comments/${deleteCommentId}`,
          {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token },
          }
        );
        if (!res.ok) throw new Error("Erro ao excluir comentário");
        carregarComentarios();
      } catch (error) {
        console.error("Erro ao excluir comentário:", error);
      }
      closeDeletePopup();
    }
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back();
  });

  await carregarPost();
  await carregarComentarios();
});
