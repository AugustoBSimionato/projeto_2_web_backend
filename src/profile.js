document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  function getUserIdFromToken() {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  }

  const userId = getUserIdFromToken();
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  let userInfo = null;
  try {
    const res = await fetch("http://127.0.0.1:3000/auth/profile", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    if (!res.ok) {
      throw new Error("Erro ao buscar informações do usuário.");
    }
    userInfo = await res.json();
  } catch (error) {
    console.error(
      "Não foi possível buscar dados do usuário, usando fallback:",
      error
    );
    userInfo = {
      id: userId,
      nome: "(nome não disponível)",
      email: "(email não disponível)",
      dataCriacao: new Date().toISOString(),
      seguidores: [],
      seguindo: [],
    };
  }

  let creationDate = new Date(userInfo.dataCriacao);
  if (isNaN(creationDate.getTime())) {
    creationDate = new Date();
  }
  const formattedDate = creationDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const profileInfo = document.getElementById("profileInfo");
  profileInfo.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
          userInfo.nome
        )}&background=222&color=fff&size=128" alt="Avatar">
      </div>
      <div class="profile-details">
        <h2>${userInfo.nome}</h2>
        <p class="profile-email"><strong>Email:</strong> ${userInfo.email}</p>
        <ul class="profile-list">
          <li><strong>ID:</strong> ${userInfo.id}</li>
          <li><strong>Data de Criação:</strong> ${formattedDate}</li>
          <li><strong>Seguidores:</strong> ${userInfo.seguidores.length}</li>
          <li><strong>Seguindo:</strong> ${userInfo.seguindo.length}</li>
        </ul>
      </div>
    </div>
  `;

  const logo = document.getElementById("nuvy-logo");
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "feed.html";
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) {
    profileIcon.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  let initialDesc = userInfo.descricao || "";
  const profileDescField = document.getElementById("profileDesc");
  profileDescField.value = initialDesc;

  const saveDescBtn = document.getElementById("saveDescBtn");
  saveDescBtn.style.display = "none";

  profileDescField.addEventListener("input", () => {
    if (profileDescField.value !== initialDesc) {
      saveDescBtn.style.display = "block";
    } else {
      saveDescBtn.style.display = "none";
    }
  });

  saveDescBtn.addEventListener("click", async () => {
    const desc = profileDescField.value.trim();
    const msg = document.getElementById("descMsg");
    msg.textContent = "Salvando...";
    try {
      const res = await fetch("http://127.0.0.1:3000/auth/profile/descricao", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ descricao: desc }),
      });
      const data = await res.json();
      if (res.ok) {
        msg.style.color = "green";
        msg.textContent = "Descrição atualizada!";
        initialDesc = desc;
        saveDescBtn.style.display = "none";
      } else {
        msg.style.color = "#d32f2f";
        msg.textContent = data.error || "Erro ao atualizar descrição.";
      }
    } catch (error) {
      msg.style.color = "#d32f2f";
      msg.textContent = "Erro ao atualizar descrição.";
    }
  });

  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const deleteAccountPopup = document.getElementById("deleteAccountPopup");
  const closeDeleteAccountPopup = document.getElementById(
    "closeDeleteAccountPopup"
  );
  const cancelDeleteAccount = document.getElementById("cancelDeleteAccount");
  const confirmDeleteAccount = document.getElementById("confirmDeleteAccount");
  const deleteAccountPassword = document.getElementById(
    "deleteAccountPassword"
  );
  const deleteAccountMsg = document.getElementById("deleteAccountMsg");

  deleteAccountBtn.addEventListener("click", () => {
    deleteAccountPopup.classList.add("active");
    deleteAccountPassword.value = "";
    deleteAccountMsg.textContent = "";
    deleteAccountPassword.focus();
    document.body.style.overflow = "hidden";
  });

  const closeDeleteAccount = () => {
    deleteAccountPopup.classList.remove("active");
    document.body.style.overflow = "";
  };

  closeDeleteAccountPopup.addEventListener("click", closeDeleteAccount);
  cancelDeleteAccount.addEventListener("click", closeDeleteAccount);
  deleteAccountPopup.addEventListener("click", (e) => {
    if (e.target === deleteAccountPopup) {
      closeDeleteAccount();
    }
  });

  confirmDeleteAccount.addEventListener("click", async () => {
    const senha = deleteAccountPassword.value.trim();
    if (!senha) {
      deleteAccountMsg.style.color = "#d32f2f";
      deleteAccountMsg.textContent = "Por favor, informe sua senha.";
      return;
    }
    deleteAccountMsg.style.color = "";
    deleteAccountMsg.textContent = "Excluindo conta...";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:3000/auth/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ senha }),
      });
      const data = await res.json();
      if (res.ok) {
        deleteAccountMsg.style.color = "green";
        deleteAccountMsg.textContent = "Conta excluída com sucesso!";
        localStorage.removeItem("token");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } else {
        deleteAccountMsg.style.color = "#d32f2f";
        deleteAccountMsg.textContent = data.error || "Erro ao excluir conta.";
      }
    } catch (error) {
      deleteAccountMsg.style.color = "#d32f2f";
      deleteAccountMsg.textContent = "Erro ao excluir conta.";
    }
  });
});
