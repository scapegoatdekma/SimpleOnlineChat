const socket = io("https://simpleonlinechat.onrender.com");
const messages = document.querySelector(".messages");
const form = document.querySelector(".form");
const input = document.querySelector(".input");
const nameBlock = document.querySelector(".name");

const username = prompt("Ваше имя:");
nameBlock.innerHTML = `${username}`;

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (input.value) {
    socket.emit("chat message", { message: input.value, name: username });
    input.value = "";
  }
});

socket.on("chat message", (data) => {
  const item = document.createElement("li");
  item.innerHTML = `<span>${data.name}</span>: ${data.message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
