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

// Массив для хранения всех сообщений
let allMessages = [];

// Обработчик отправки сообщений (изменен для поддержки медиа)
form.addEventListener("submit", function (event) {
  event.preventDefault();
  let messageText = input.value.trim(); // Обрезаем пробелы
  if (messageText !== "") {
    // Проверяем, что сообщение не пустое
    let fullMessage = messageText; // Изначально присваиваем только текст сообщения
    if (preparedMediaHTML) {
      // Добавляем медиа, только если оно есть
      fullMessage += "<br>" + preparedMediaHTML;
    }

    const newMessage = {
      name: username,
      message: fullMessage,
    };

    allMessages.push(newMessage);
    addMessagesToPage(allMessages);

    socket.emit("chat message", {
      message: fullMessage,
      name: username,
    });
    input.value = "";
    removePreparedMedia();
  }
});

// Слушаем новые сообщения от сервера
socket.on("chat message", function (data) {
  if (data.name !== username) {
    // Проверяем, что сообщение не от нас
    const isDuplicate = allMessages.some(
      (existingMessage) => existingMessage.id === data.id
    );
    if (!isDuplicate) {
      allMessages.push(data); // Добавляем сообщение в массив
      addMessagesToPage(allMessages); // Перерисовываем список
    }
  }
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

  if (
    mediaType === "image-upload" ||
    mediaType === "audio-upload" ||
    mediaType === "video-upload"
  ) {
    urlInputContainer.style.display = "none";
    fileInputContainer.style.display = "block";
  } else {
    urlInputContainer.style.display = "block";
    fileInputContainer.style.display = "none";
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

    // Проверяем, является ли ссылка ссылкой на YouTube
    if (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be")) {
      // Получаем ID видео из ссылки YouTube
      const videoId = getYoutubeVideoId(mediaUrl);
      if (videoId) {
        // Создаем код для встраивания видео с YouTube
        mediaHTML = `<div class="video-container">
                         <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                       </div>`;
      } else {
        alert("Не удалось получить ID видео YouTube из ссылки");
        return;
      }
    } else {
      // Если ссылка не на YouTube, используем ее как есть (предполагается, что это ссылка на другой видеофайл)
      mediaHTML = `<div class="video-container">
                         <iframe width="${widthContent}" src="${mediaUrl}" frameborder="0" allowfullscreen></iframe>
                       </div>`;
    }
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
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const videoUrl = e.target.result;
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
      reader.readAsDataURL(mediaFile);
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

// Функция для получения ID видео из ссылки YouTube
function getYoutubeVideoId(url) {
  // Регулярное выражение для извлечения ID видео из ссылки YouTube
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Функция для обновления индикатора подготовленного медиа
function updatePreparedMediaIndicator(mediaType) {
  preparedMediaIndicator.style.display = "inline-block";
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

let messagesPerPage = 5;
let loadMoreButton;
let allMessagesLoaded = false;
let lastMessageId = null; // ID самого верхнего сообщения

function loadHistory() {
  if (allMessagesLoaded) {
    return;
  }
  socket.emit("get history", lastMessageId);
}

function createLoadMoreButton() {
  const header = document.querySelector(".header");
  loadMoreButton = document.createElement("button");
  loadMoreButton.textContent = "Загрузить еще";
  loadMoreButton.addEventListener("click", loadHistory);
  header.appendChild(loadMoreButton); // Добавляем кнопку в header
}

// Функция для добавления массива сообщений на страницу
function addMessagesToPage(messagesData) {
  console.log("addMessagesToPage called with:", messagesData);
  messages.innerHTML = ""; // Очищаем список сообщений
  const fragment = document.createDocumentFragment();

  messagesData.forEach((message) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>${message.name}</span>: ${message.message}`;
    fragment.appendChild(item);
  });

  messages.appendChild(fragment);
}

socket.on("history", function (data) {
  console.log("history event received with data:", data);

  if (data.length < messagesPerPage) {
    allMessagesLoaded = true;
  }

  //Убираем дубликаты из новых сообщений
  const newMessages = data.filter(
    (newMessage) =>
      !allMessages.some(
        (existingMessage) => existingMessage.id === newMessage.id
      )
  );

  // Объединяем массивы сообщений
  allMessages = allMessages.concat(newMessages);

  // Сортируем сообщения по id (в порядке возрастания)
  allMessages.sort((a, b) => a.id - b.id);

  addMessagesToPage(allMessages); // Перерисовываем список

  // Устанавливаем lastMessageId
  if (data.length > 0) {
    // Находим ID самого старого сообщения (первого элемента в массиве)
    lastMessageId = data[0].id; // ID самого старого сообщения
  }

  // Обновляем кнопку "Загрузить еще"
  if (
    data.length === messagesPerPage &&
    !loadMoreButton &&
    !allMessagesLoaded
  ) {
    createLoadMoreButton();
  } else if (allMessagesLoaded && loadMoreButton) {
    loadMoreButton.remove();
    loadMoreButton = null;
  }
});

// Загружаем первую порцию сообщений при загрузке страницы
loadHistory();
addMessagesToPage(allMessages); // Инициализируем список сообщений
