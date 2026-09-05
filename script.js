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


    // Create new chat if needed
    if (!currentChatId) {
        createNewChat(message);
    }


    addMessage(message, "user-message");

    input.value = "";

    saveCurrentChat();


    // Thinking animation
    const thinkingMessage =
        document.createElement("div");

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

    chatBox.scrollTop =
        chatBox.scrollHeight;


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


        // AI response
        thinkingMessage.innerHTML =
            formatAIResponse(data.reply);


        // Add Copy + Regenerate
        addResponseButtons(
            thinkingMessage,
            message
        );


        saveCurrentChat();


    } catch (error) {

        console.error(error);

        thinkingMessage.innerHTML = "";

        thinkingMessage.textContent =
            "Something went wrong 😕";

    }


    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// =========================
// SMART CHAT TITLE
// =========================

function generateChatTitle(message) {

    const text = message
        .trim()
        .replace(/[?!.,]/g, "")
        .replace(/\s+/g, " ");


    const lower = text.toLowerCase();


    const topics = [

        {
            words: ["quantum", "physics"],
            title: "Quantum Physics"
        },

        {
            words: ["physics"],
            title: "Physics"
        },

        {
            words: ["chemistry"],
            title: "Chemistry"
        },

        {
            words: ["math", "mathematics"],
            title: "Mathematics"
        },

        {
            words: [
                "coding",
                "code",
                "javascript",
                "python"
            ],
            title: "Coding"
        },

        {
            words: [
                "html",
                "css",
                "website"
            ],
            title: "Website Help"
        },

        {
            words: ["history"],
            title: "History"
        },

        {
            words: [
                "recipe",
                "cooking",
                "food"
            ],
            title: "Recipe & Cooking"
        },

        {
            words: [
                "study",
                "exam",
                "test",
                "syllabus"
            ],
            title: "Study Help"
        },

        {
            words: ["nda"],
            title: "NDA Preparation"
        },

        {
            words: ["jee"],
            title: "JEE Preparation"
        },

        {
            words: ["neet"],
            title: "NEET Preparation"
        }

    ];


    for (const topic of topics) {

        if (
            topic.words.some(word =>
                lower.includes(word)
            )
        ) {

            return topic.title;

        }

    }


    const cleaned = text
        .replace(
            /^(tell me about|explain|what is|what are|how to|how do i|can you|please|help me with)\s+/i,
            ""
        )
        .trim();


    const words = cleaned
        .split(" ")
        .slice(0, 4)
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        );


    let title = words.join(" ");


    if (!title) {
        title = "New Chat";
    }


    return title.length > 28
        ? title.substring(0, 28) + "..."
        : title;
}


// =========================
// CREATE CHAT
// =========================

function createNewChat(firstMessage) {

    const chat = {

        id: Date.now(),

        title:
            generateChatTitle(firstMessage),

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
            message.classList.contains(
                "user-message"
            )
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

        const chatWrapper =
            document.createElement("div");

        chatWrapper.className =
            "recent-chat-wrapper";


        // Chat name
        const chatItem =
            document.createElement("button");

        chatItem.className =
            "recent-chat";

        chatItem.textContent =
            chat.title;


        chatItem.addEventListener(
            "click",
            () => loadChat(chat.id)
        );


        // Three dot
        const menuButton =
            document.createElement("button");

        menuButton.className =
            "chat-menu-button";

        menuButton.textContent =
            "⋯";


        menuButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                showChatMenu(chat);

            }
        );


        chatWrapper.appendChild(chatItem);

        chatWrapper.appendChild(menuButton);

        recentChats.appendChild(chatWrapper);

    });
}


// =========================
// RENAME / DELETE MENU
// =========================

function showChatMenu(chat) {

    const action = prompt(
        "Choose an option:\n\n" +
        "1 = Rename\n" +
        "2 = Delete"
    );


    // RENAME
    if (action === "1") {

        const newTitle = prompt(
            "Enter new chat name:",
            chat.title
        );


        if (
            newTitle &&
            newTitle.trim() !== ""
        ) {

            chat.title =
                newTitle.trim();

            saveChats();

            renderRecents();

        }

    }


    // DELETE
    if (action === "2") {

        const confirmed = confirm(
            `Delete "${chat.title}"?`
        );


        if (!confirmed) {
            return;
        }


        chats = chats.filter(
            item => item.id !== chat.id
        );


        if (currentChatId === chat.id) {

            currentChatId = null;

            chatBox.innerHTML = `
                <div class="message ai-message">
                    Hello! 👋 How can I help you today?
                </div>
            `;

        }


        saveChats();

        renderRecents();

    }

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


        if (
            message.type ===
            "ai-message"
        ) {

            messageElement.innerHTML =
                message.text;

        } else {

            messageElement.textContent =
                message.text;

        }


        chatBox.appendChild(
            messageElement
        );

    });


    // Add buttons to loaded AI messages
    chatBox
        .querySelectorAll(".ai-message")
        .forEach((messageElement, index) => {

            const userMessages =
                chat.messages.filter(
                    message =>
                        message.type ===
                        "user-message"
                );


            const question =
                userMessages[index]
                    ? userMessages[index].text
                    : "";


            if (question) {

                addResponseButtons(
                    messageElement,
                    question
                );

            }

        });


    chatBox.scrollTop =
        chatBox.scrollHeight;

    input.focus();


    // Sync server memory
    try {

        await fetch("/new-chat", {
            method: "POST"
        });


        for (const message of chat.messages) {

            if (
                message.type ===
                "user-message"
            ) {

                await fetch("/chat", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message:
                            message.text
                    })

                });

            }

        }

    } catch (error) {

        console.error(error);

    }

}


// =========================
// NEW CHAT
// =========================

newChatButton.addEventListener(
    "click",
    async function () {

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

    }
);


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


    messageElement.textContent =
        text;


    chatBox.appendChild(
        messageElement
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;
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
// COPY + REGENERATE
// =========================

function addResponseButtons(
    aiMessage,
    originalQuestion
) {

    // Don't add twice
    if (
        aiMessage.querySelector(
            ".response-buttons"
        )
    ) {
        return;
    }


    const buttons =
        document.createElement("div");


    buttons.className =
        "response-buttons";


    buttons.innerHTML = `
        <button
            class="copy-btn"
            title="Copy response">
            📋
        </button>

        <button
            class="regenerate-btn"
            title="Regenerate">
            🔄
        </button>
    `;


    aiMessage.appendChild(buttons);


    // COPY
    buttons
        .querySelector(".copy-btn")
        .addEventListener(
            "click",
            async function () {

                const copyButton =
                    this;


                const clone =
                    aiMessage.cloneNode(true);


                const actionButtons =
                    clone.querySelector(
                        ".response-buttons"
                    );


                if (actionButtons) {
                    actionButtons.remove();
                }


                const text =
                    clone.innerText.trim();


                try {

                    await navigator
                        .clipboard
                        .writeText(text);


                    copyButton.textContent =
                        "✓";


                    setTimeout(() => {

                        copyButton.textContent =
                            "📋";

                    }, 1500);


                } catch (error) {

                    console.error(error);

                }

            }
        );


    // REGENERATE
    buttons
        .querySelector(
            ".regenerate-btn"
        )
        .addEventListener(
            "click",
            async function () {

                const regenerateButton =
                    this;


                regenerateButton.textContent =
                    "⏳";


                try {

                    const response =
                        await fetch(
                            "/chat",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        message:
                                            originalQuestion
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    aiMessage.innerHTML =
                        formatAIResponse(
                            data.reply
                        );


                    addResponseButtons(
                        aiMessage,
                        originalQuestion
                    );


                    saveCurrentChat();


                } catch (error) {

                    console.error(error);

                    regenerateButton.textContent =
                        "🔄";

                }

            }
        );

}


// =========================
// START
// =========================

renderRecents();
