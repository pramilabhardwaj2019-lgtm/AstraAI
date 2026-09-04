const input = document.getElementById("user-input");
const button = document.getElementById("send-button");
const chatBox = document.getElementById("chat-box");
const newChatButton = document.getElementById("new-chat-button");

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});


// 🆕 New Chat
newChatButton.addEventListener("click", async function () {

    const confirmed = confirm("Start a new chat?");

    if (!confirmed) {
        return;
    }

    try {

        await fetch("/new-chat", {
            method: "POST"
        });

        chatBox.innerHTML = `
            <div class="message ai-message">
                Hello! 👋 How can I help you today?
            </div>
        `;

        input.value = "";
        input.focus();

    } catch (error) {

        console.error(error);

    }

});


// ===============================
// 💬 Send Message
// ===============================

async function sendMessage() {

    const message = input.value.trim();

    if (message === "") {
        return;
    }


    // User message
    addMessage(message, "user-message");

    input.value = "";


    // 🤖 Thinking animation
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


        // Replace animation with AI response
        thinkingMessage.innerHTML = "";
        thinkingMessage.textContent = data.reply;


    } catch (error) {

        console.error(error);

        thinkingMessage.innerHTML = "";
        thinkingMessage.textContent =
            "Something went wrong 😕";

    }


    chatBox.scrollTop = chatBox.scrollHeight;

}


// ===============================
// ➕ Add Message
// ===============================

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