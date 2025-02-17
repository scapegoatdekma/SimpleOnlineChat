const socket = io("https://simpleonlinechat.onrender.com");
// const socket = io();
const messages = document.querySelector(".messages");
const form = document.querySelector(".form");
const input = document.querySelector(".input");
const nameBlock = document.querySelector(".name");
const preparedMediaIndicator = document.getElementById(
  "preparedMediaIndicator"
);
const preparedMediaIcon = document.getElementById("preparedMediaIcon");

const username = prompt("Ваше имя:");
// const username = "daun";
nameBlock.innerHTML = `${username}`;

// Функция для экранирования HTML (важно для безопасности!)
function sanitizeHTML(text) {
  let map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// Глобальные переменные для хранения медиа
let preparedMediaHTML = "";

// Обработчик отправки сообщений (изменен для поддержки медиа)
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Предотвращаем перезагрузку страницы

  let messageText = input.value;

  // Добавляем подготовленное медиа к сообщению
  const fullMessage = messageText + "<br>" + preparedMediaHTML;

  // Отправляем сообщение на сервер
  socket.emit("chat message", { message: fullMessage, name: username });
  input.value = ""; // Очищаем поле ввода
  removePreparedMedia(); // Очищаем подготовленное медиа
});

// Слушаем новые сообщения от сервера
socket.on("chat message", function (data) {
  const item = document.createElement("li");
  item.innerHTML = `<span>${data.name}</span>: ${data.message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// ***********************************************************
// Модальное окно и подготовка медиа (новый код)
// ***********************************************************

// Функции для открытия и закрытия модального окна
function openModal() {
  document.getElementById("mediaModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("mediaModal").style.display = "none";
}

// Функция для переключения между полями URL и загрузки файла
function toggleFileInput() {
  const mediaType = document.getElementById("mediaType").value;
  const urlInputContainer = document.getElementById("mediaUrl");
  const fileInputContainer = document.getElementById("fileInputContainer");
  const widthLabel = document.querySelector('label[for="mediaWidth"]');
  const widthInput = document.getElementById("mediaWidth");

  if (mediaType === "image" || mediaType === "video") {
    urlInputContainer.style.display = "block";
    fileInputContainer.style.display = "none";
    widthLabel.style.display = "block";
    widthInput.style.display = "block";
  } else if (
    mediaType === "image-upload" ||
    mediaType === "video-upload" ||
    mediaType === "audio-upload"
  ) {
    urlInputContainer.style.display = "none";
    fileInputContainer.style.display = "block";
    widthLabel.style.display = "block";
    widthInput.style.display = "block";
  } else {
    urlInputContainer.style.display = "block";
    fileInputContainer.style.display = "none";
    widthLabel.style.display = "none";
    widthInput.style.display = "none";
  }
}

// Функция подготовки медиа
function prepareMedia() {
  const mediaType = document.getElementById("mediaType").value;
  const widthInput = document.getElementById("mediaWidth");
  const widthContent = widthInput.value;

  let mediaHTML = "";

  if (mediaType === "image") {
    const mediaUrl = document.getElementById("mediaUrl").value;
    mediaHTML = `<img src="${mediaUrl}" width="${widthContent}" alt="Изображение">`;
  } else if (mediaType === "video") {
    const mediaUrl = document.getElementById("mediaUrl").value;

    mediaHTML = `<div class="video-container"><iframe src="${mediaUrl}" frameborder="0" allowfullscreen></iframe></div>`;
  } else if (mediaType === "audio") {
    const mediaUrl = document.getElementById("mediaUrl").value;
    mediaHTML = `<audio controls src="${mediaUrl}"></audio>`;
  } else if (mediaType === "image-upload") {
    const mediaFile = document.getElementById("mediaFile").files[0];
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imageUrl = e.target.result;
        mediaHTML = `<img src="${imageUrl}" width="${widthContent}" alt="Изображение">`;
        preparedMediaHTML = mediaHTML;
        updatePreparedMediaIndicator(mediaType);
        closeModal();
      };
      reader.onerror = function (error) {
        console.error("FileReader error:", error);
      };
      reader.readAsDataURL(mediaFile);
      return;
    } else {
      alert("Пожалуйста, выберите файл");
      return;
    }
  } else if (mediaType === "audio-upload") {
    const mediaFile = document.getElementById("mediaFile").files[0];
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const audioUrl = e.target.result;
        mediaHTML = `<audio controls src="${audioUrl}"></audio>`;
        preparedMediaHTML = mediaHTML;
        updatePreparedMediaIndicator(mediaType);
        closeModal();
      };
      reader.onerror = function (error) {
        console.error("FileReader error:", error);
      };
      reader.readAsDataURL(mediaFile);
      return;
    } else {
      alert("Пожалуйста, выберите аудиофайл");
      return;
    }
  } else if (mediaType === "video-upload") {
    const mediaFile = document.getElementById("mediaFile").files[0];
    console.log("video-upload start");
    console.log(mediaFile);
    if (mediaFile) {
      console.log("video-upload mediaFile is TRUE");
      const reader = new FileReader();
      reader.onload = function (e) {
        const videoUrl = e.target.result;
        console.log("video-upload e", e);
        console.log("video-upload videoUrl", videoUrl);
        mediaHTML = `<div class="video-container">
                         <video controls>
                           <source src="${videoUrl}" type="${mediaFile.type}">
                         </video>
                       </div>`;
        preparedMediaHTML = mediaHTML;
        updatePreparedMediaIndicator(mediaType);
        closeModal();
      };
      reader.onerror = function (error) {
        console.error("FileReader error:", error);
      };
      console.log("video-upload before reader.readAsDataURL");
      reader.readAsDataURL(mediaFile);
      console.log("video-upload after reader.readAsDataURL");
      return;
    } else {
      alert("Пожалуйста, выберите видеофайл");
      return;
    }
  }

  preparedMediaHTML = mediaHTML;
  updatePreparedMediaIndicator(mediaType);
  closeModal();
}

// Функция для обновления индикатора подготовленного медиа
function updatePreparedMediaIndicator(mediaType) {
  preparedMediaIndicator.style.display = "flex";
  if (mediaType === "image") {
    preparedMediaIcon.textContent = "🖼️"; // Image icon
  } else if (mediaType === "image-upload") {
    preparedMediaIcon.textContent = "🖼️"; // Image icon
  } else if (mediaType === "video") {
    preparedMediaIcon.textContent = "🎬"; // Video icon
  } else if (mediaType === "video-upload") {
    preparedMediaIcon.textContent = "🎬"; // Video icon
  } else if (mediaType === "audio") {
    preparedMediaIcon.textContent = "🎵"; // Audio icon
  } else if (mediaType === "audio-upload") {
    preparedMediaIcon.textContent = "🎵"; // Audio icon
  }
}

// Функция для удаления подготовленного медиа
function removePreparedMedia() {
  preparedMediaHTML = "";
  preparedMediaIndicator.style.display = "none";
}

// Закрываем модальное окно при клике вне его
window.onclick = function (event) {
  const modal = document.getElementById("mediaModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Call toggleFileInput to initialize the visibility of the input fields
toggleFileInput();
