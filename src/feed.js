document.addEventListener("DOMContentLoaded", async () => {
  const apiUrl = "http://127.0.0.1:3000/api/posts";
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  let deletePostId = null;

  const postForm = document.querySelector(".post-composer");
  const postInput = document.getElementById("conteudo");
  const postBtn = document.getElementById("postBtn");
  const feedContainer = document.getElementById("feed");
  const meusPostsContainer = document.getElementById("meus-posts");

  const newPostBtn = document.getElementById("newPostBtn");
  const newPostPopup = document.getElementById("newPostPopup");
  const closePopup = document.getElementById("closePopup");
  const newPostContent = document.getElementById("newPostContent");
  const submitNewPost = document.getElementById("submitNewPost");

  const searchIcon = document.getElementById("searchIcon");
  const searchPopup = document.getElementById("searchPopup");
  const closeSearchPopup = document.getElementById("closeSearchPopup");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const searchResults = document.getElementById("searchResults");

  async function carregarPosts() {
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: "Bearer " + token },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "login.html";
          return;
        }
        throw new Error("Erro ao carregar posts");
      }

      const posts = await res.json();

      feedContainer.innerHTML = "";

      posts.forEach((post) => {
        const postElement = criarElementoPost(post);
        feedContainer.appendChild(postElement);
      });

      const usuarioAtual = getUserId();
      const meusPostsArray = posts.filter((post) => {
        const authorId =
          typeof post.autor === "object" && post.autor._id
            ? post.autor._id.toString()
            : post.autor;
        return authorId === usuarioAtual;
      });

      meusPostsContainer.innerHTML = "";

      if (meusPostsArray.length === 0) {
        meusPostsContainer.innerHTML =
          "<p class='no-posts-message'>Você ainda não possui posts</p>";
      } else {
        meusPostsArray.forEach((post) => {
          const postElement = criarElementoPostLateral(post);
          meusPostsContainer.appendChild(postElement);
        });
      }
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
    }
  }

  function criarElementoPost(post) {
    const postElement = document.createElement("article");
    postElement.className = "post";

    const data = new Date(post.dataCriacao);
    const agora = new Date();
    const diferenca = agora - data;

    let timeStr;
    if (diferenca < 60000) {
      timeStr = "agora";
    } else if (diferenca < 3600000) {
      const minutos = Math.floor(diferenca / 60000);
      timeStr = `${minutos} min`;
    } else if (diferenca < 86400000) {
      const horas = Math.floor(diferenca / 3600000);
      timeStr = `${horas}h`;
    } else {
      const dias = Math.floor(diferenca / 86400000);
      timeStr = `${dias} dias`;
    }

    const isOwner =
      post.autor && post.autor._id && post.autor._id.toString() === getUserId();

    let isFollowing = false;
    if (
      !isOwner &&
      post.autor &&
      post.autor.seguidores &&
      Array.isArray(post.autor.seguidores)
    ) {
      isFollowing = post.autor.seguidores
        .map((id) => id.toString())
        .includes(getUserId());
    }

    let controlHtml = "";
    if (isOwner) {
      controlHtml = `<button class="delete-post-btn" data-id="${post._id}"><i class="fa-solid fa-trash"></i></button>`;
    } else if (!isFollowing) {
      controlHtml = `<button class="follow-btn" data-id="${post.autor._id}">Seguir</button>`;
    }

    postElement.innerHTML = `
    <div class="post-header">
      <div class="profile-pic"></div>
        <div class="post-user-info">
          <div class="post-username">${post.autor.nome}</div>
          <div class="post-meta">
            <span class="post-time">${timeStr}</span>
          </div>
        </div>
        ${controlHtml}
      </div>
      <div class="post-content">
        <p>${post.conteudo}</p>
      </div>
      <div class="post-actions">
        <div class="post-action like-action" data-id="${post._id}">
          ${
            post.curtidas.includes(getUserId())
              ? '<i class="fa-solid fa-heart"></i>'
              : '<i class="fa-regular fa-heart"></i>'
          } 
          <span class="action-count">${post.curtidas.length}</span>
        </div>
        <div class="post-action comment-btn" data-id="${post._id}" title="Comentar">
          <i class="fa-solid fa-comment"></i>
        </div>
      </div>
    `;

    const likeButton = postElement.querySelector(".like-action");
    if (likeButton) {
      likeButton.addEventListener("click", async () => {
        await curtirPost(post._id);
      });
    }

    const commentBtn = postElement.querySelector(".comment-btn");
    if (commentBtn) {
      commentBtn.addEventListener("click", () => {
        window.location.href = `postComments.html?id=${post._id}`;
      });
    }

    if (isOwner) {
      const deleteBtn = postElement.querySelector(".delete-post-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          openDeletePopup(post._id);
        });
      }
    } else if (!isFollowing) {
      const followBtn = postElement.querySelector(".follow-btn");
      if (followBtn) {
        followBtn.addEventListener("click", async () => {
          try {
            const res = await fetch(
              `http://127.0.0.1:3000/api/users/follow/${post.autor._id}`,
              {
                method: "PATCH",
                headers: { Authorization: "Bearer " + token },
              }
            );
            if (!res.ok) {
              throw new Error("Erro ao seguir/desseguir usuário");
            }
            await carregarPosts();
          } catch (error) {
            console.error("Erro ao alternar seguir:", error);
          }
        });
      }
    }

    return postElement;
  }

  function criarElementoPostLateral(post) {
    const postElement = document.createElement("article");
    postElement.className = "post sidebar-post";

    const data = new Date(post.dataCriacao);
    const agora = new Date();
    const diferenca = agora - data;

    let timeStr;
    if (diferenca < 60000) {
      timeStr = "agora";
    } else if (diferenca < 3600000) {
      const minutos = Math.floor(diferenca / 60000);
      timeStr = `${minutos} min`;
    } else if (diferenca < 86400000) {
      const horas = Math.floor(diferenca / 3600000);
      timeStr = `${horas}h`;
    } else {
      const dias = Math.floor(diferenca / 86400000);
      timeStr = `${dias} dias`;
    }

    const isOwner =
      post.autor && post.autor._id && post.autor._id.toString() === getUserId();
    const controlHtml = isOwner
      ? `<button class="delete-post-btn" data-id="${post._id}"><i class="fa-solid fa-trash"></i></button>`
      : ``;

    postElement.innerHTML = `
      <div class="post-header">
        <div class="profile-pic"></div>
        <div class="post-user-info">
          <div class="post-username">${post.autor.nome}</div>
          <div class="post-meta">
            <span class="post-time">${timeStr}</span>
          </div>
        </div>
        ${controlHtml}
      </div>
      <div class="post-content">
        <p>${post.conteudo}</p>
      </div>
      <div class="post-actions">
        <div class="post-action"><i class="fa-solid fa-heart"></i> <span class="action-count">${post.curtidas.length}</span></div>
      </div>
    `;

    if (isOwner) {
      const deleteBtn = postElement.querySelector(".delete-post-btn");
      deleteBtn.addEventListener("click", () => {
        openDeletePopup(post._id);
      });
    }

    return postElement;
  }

  async function curtirPost(postId) {
    try {
      const res = await fetch(`${apiUrl}/${postId}/like`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token },
      });

      if (!res.ok) {
        throw new Error("Erro ao curtir post");
      }

      await carregarPosts();
    } catch (error) {
      console.error("Erro ao curtir post:", error);
    }
  }

  function getUserId() {
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      return tokenPayload.id;
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  }

  async function enviarPost(conteudo) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ conteudo }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar post");
      }

      await carregarPosts();
    } catch (error) {
      console.error("Erro ao enviar post:", error);
    }
  }

  postBtn.addEventListener("click", async () => {
    const conteudo = postInput.value.trim();
    if (conteudo) {
      await enviarPost(conteudo);
      postInput.value = "";
    } else {
      alert("Não é possível postar: o campo de texto está vazio.");
    }
  });

  function openPopup() {
    newPostPopup.classList.add("active");
    newPostContent.focus();
    document.body.style.overflow = "hidden";
  }

  function closePopupFunc() {
    newPostPopup.classList.remove("active");
    newPostContent.value = "";
    document.body.style.overflow = "";
  }

  function openDeletePopup(postId) {
    deletePostId = postId;
    const deletePopup = document.getElementById("deletePostPopup");
    deletePopup.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDeletePopup() {
    deletePostId = null;
    const deletePopup = document.getElementById("deletePostPopup");
    deletePopup.classList.remove("active");
    document.body.style.overflow = "";
  }

  newPostBtn.addEventListener("click", openPopup);
  closePopup.addEventListener("click", closePopupFunc);

  newPostPopup.addEventListener("click", function (e) {
    if (e.target === newPostPopup) {
      closePopupFunc();
    }
  });

  submitNewPost.addEventListener("click", async function () {
    const content = newPostContent.value.trim();
    if (content) {
      await enviarPost(content);
      closePopupFunc();
    } else {
      alert("Não é possível postar: o campo de texto está vazio.");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && newPostPopup.classList.contains("active")) {
      closePopupFunc();
    }
  });

  postInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      postBtn.click();
    }
  });

  newPostContent.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      submitNewPost.click();
    }
  });

  const closeDeleteBtn = document.getElementById("closeDeletePopup");
  closeDeleteBtn.addEventListener("click", closeDeletePopup);

  const cancelDeleteBtn = document.getElementById("cancelDeletePost");
  cancelDeleteBtn.addEventListener("click", closeDeletePopup);

  const confirmDeleteBtn = document.getElementById("confirmDeletePost");
  confirmDeleteBtn.addEventListener("click", async () => {
    if (deletePostId) {
      try {
        const res = await fetch(`${apiUrl}/${deletePostId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        });
        if (!res.ok) {
          throw new Error("Erro ao excluir post");
        }
        await carregarPosts();
      } catch (error) {
        console.error("Erro ao excluir post:", error);
      }
      closeDeletePopup();
    }
  });

  searchIcon.addEventListener("click", () => {
    searchPopup.classList.add("active");
    searchInput.value = "";
    searchResults.innerHTML = "<p>Nada foi encontrado</p>";
    document.body.style.overflow = "hidden";
  });

  closeSearchPopup.addEventListener("click", () => {
    searchPopup.classList.remove("active");
    document.body.style.overflow = "";
  });

  searchButton.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    searchResults.innerHTML = "";

    try {
      const url = `${apiUrl}/search?query=${encodeURIComponent(query)}`;

      const res = await fetch(url, {
        headers: { Authorization: "Bearer " + token },
      });

      if (!res.ok) throw new Error("Erro na busca");

      const data = await res.json();
      const resultsArray = Array.isArray(data) ? data : [];

      if (resultsArray.length === 0) {
        searchResults.innerHTML = "<p>Nada foi encontrado</p>";
      } else {
        resultsArray.forEach((item) => {
          const resultItem = document.createElement("div");
          resultItem.className = "search-result-item";
          resultItem.innerHTML = `<h3>${item.autor.nome}</h3><p>${item.conteudo}</p>`;
          searchResults.appendChild(resultItem);
        });
      }
    } catch (error) {
      console.error("Erro ao realizar busca:", error);
      searchResults.innerHTML = "<p>Erro ao realizar busca</p>";
    }
  });

  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) {
    profileIcon.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  await carregarPosts();
});
