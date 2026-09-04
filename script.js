const input = document.getElementById("user-input");
const button = document.getElementById("send-button");
const chatBox = document.getElementById("chat-box");
const newChatButton = document.getElementById("new-chat-button");
const recentChats = document.getElementById("recent-chats");

let chats = JSON.parse(localStorage.getItem("astraAI_chats")) || [];
let currentChatId = null;


// =========================
// SEND MESSAGE
// =========================

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});


async function sendMessage() {

    const message = input.value.trim();

    if (message === "") {
        return;
    }

    if (!currentChatId) {
        createNewChat(message);
    }

    addMessage(message, "user-message");

    input.value = "";

    saveCurrentChat();


    // Thinking animation
    const thinkingMessage = document.createElement("div");

    thinkingMessage.classList.add(
        "message",
        "ai-message",
        "thinking-message"
    );

    thinkingMessage.innerHTML = `
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    `;

    chatBox.appendChild(thinkingMessage);

    chatBox.scrollTop = chatBox.scrollHeight;


    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();


        // Remove thinking animation
        thinkingMessage.innerHTML = "";

        // Render AI Markdown
        thinkingMessage.innerHTML =
            formatAIResponse(data.reply);


        saveCurrentChat();

    } catch (error) {

        console.error(error);

        thinkingMessage.innerHTML = "";
        thinkingMessage.textContent =
            "Something went wrong 😕";
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}


// =========================
// MARKDOWN FORMATTER
// =========================

function formatAIResponse(text) {

    let formatted = text;

    // Escape HTML
    formatted = formatted
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");


    // Code blocks
    formatted = formatted.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
    );


    // Bold
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // Italic
    formatted = formatted.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );


    // Headings
    formatted = formatted.replace(
        /^### (.*)$/gm,
        "<h3>$1</h3>"
    );

    formatted = formatted.replace(
        /^## (.*)$/gm,
        "<h2>$1</h2>"
    );

    formatted = formatted.replace(
        /^# (.*)$/gm,
        "<h1>$1</h1>"
    );


    // Bullet points
    formatted = formatted.replace(
        /^\s*[-•] (.*)$/gm,
        "<li>$1</li>"
    );

    formatted = formatted.replace(
        /(<li>.*<\/li>)/gs,
        "<ul>$1</ul>"
    );


    // Numbered lists
    formatted = formatted.replace(
        /^\s*\d+\.\s+(.*)$/gm,
        "<li>$1</li>"
    );


    // Line breaks
    formatted = formatted.replace(
        /\n\n/g,
        "<br><br>"
    );

    formatted = formatted.replace(
        /\n/g,
        "<br>"
    );


    return formatted;
}


// =========================
// NEW CHAT
// =========================

newChatButton.addEventListener("click", async function () {

    try {

        await fetch("/new-chat", {
            method: "POST"
        });

    } catch (error) {
        console.error(error);
    }

    currentChatId = null;

    chatBox.innerHTML = `
        <div class="message ai-message">
            Hello! 👋 How can I help you today?
        </div>
    `;

    input.value = "";
    input.focus();

    renderRecents();
});


// =========================
// CREATE CHAT
// =========================

function createNewChat(firstMessage) {

    const chat = {

        id: Date.now(),

        title:
            firstMessage.length > 30
                ? firstMessage.substring(0, 30) + "..."
                : firstMessage,

        messages: []
    };

    chats.unshift(chat);

    currentChatId = chat.id;

    saveChats();

    renderRecents();
}


// =========================
// SAVE CURRENT CHAT
// =========================

function saveCurrentChat() {

    if (!currentChatId) {
        return;
    }

    const chat = chats.find(
        chat => chat.id === currentChatId
    );

    if (!chat) {
        return;
    }

    chat.messages = Array.from(
        chatBox.querySelectorAll(".message")
    ).map(message => ({

        text: message.innerHTML,

        type:
            message.classList.contains("user-message")
                ? "user-message"
                : "ai-message"

    }));

    saveChats();
}


// =========================
// SAVE CHATS
// =========================

function saveChats() {

    localStorage.setItem(
        "astraAI_chats",
        JSON.stringify(chats)
    );
}


// =========================
// RECENTS
// =========================

function renderRecents() {

    recentChats.innerHTML = "";

    chats.forEach(chat => {

        const chatItem =
            document.createElement("button");

        chatItem.className = "recent-chat";

        chatItem.textContent = chat.title;

        chatItem.addEventListener(
            "click",
            () => loadChat(chat.id)
        );

        recentChats.appendChild(chatItem);

    });
}


// =========================
// LOAD CHAT
// =========================

async function loadChat(chatId) {

    const chat = chats.find(
        chat => chat.id === chatId
    );

    if (!chat) {
        return;
    }

    currentChatId = chatId;

    chatBox.innerHTML = "";

    chat.messages.forEach(message => {

        const messageElement =
            document.createElement("div");

        messageElement.classList.add(
            "message",
            message.type
        );

        if (message.type === "ai-message") {
            messageElement.innerHTML = message.text;
        } else {
            messageElement.textContent = message.text;
        }

        chatBox.appendChild(messageElement);

    });

    input.focus();


    // Sync server memory
    try {

        await fetch("/new-chat", {
            method: "POST"
        });

        for (const message of chat.messages) {

            if (message.type === "user-message") {

                await fetch("/chat", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        message: message.text
                    })

                });

            }

        }

    } catch (error) {

        console.error(error);

    }
}


// =========================
// ADD MESSAGE
// =========================

function addMessage(text, className) {

    const messageElement =
        document.createElement("div");

    messageElement.classList.add(
        "message",
        className
    );

    messageElement.textContent = text;

    chatBox.appendChild(messageElement);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// =========================
// START
// =========================

renderRecents();
