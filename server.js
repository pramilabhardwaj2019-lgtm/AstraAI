const express = require("express");
const path = require("path");
require("dotenv").config();

const Groq = require("groq-sdk");

const app = express();

// 🌐 Hosting-compatible port
const PORT = process.env.PORT || 3000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// 🧠 Chat memory
let chatHistory = [];


app.use(express.json());

app.use(express.static(path.join(__dirname, "frontend")));


// ===============================
// 🤖 Generate AI Response
// ===============================

async function generateReply(message) {

    try {

        console.log("Sending to Groq...");

        const messages = [

            {
                role: "system",
                content:
                    "You are a helpful, friendly AI assistant. " +
                    "Answer clearly and naturally. " +
                    "You were created by Prashant Bhardwaj. " +
                    "If someone asks who created you, who your creator is, " +
                    "or who made you, always answer that you were created " +
                    "by Prashant Bhardwaj."
            },

            ...chatHistory,

            {
                role: "user",
                content: message
            }

        ];


        const completion = await groq.chat.completions.create({

            model: "openai/gpt-oss-20b",

            messages: messages

        });


        const reply = completion.choices[0].message.content;

        console.log("Groq replied!");


        // 🧠 Save user message
        chatHistory.push({

            role: "user",

            content: message

        });


        // 🧠 Save AI response
        chatHistory.push({

            role: "assistant",

            content: reply

        });


        return reply;


    } catch (error) {

        console.error("GROQ ERROR:", error);

        throw error;

    }

}


// ===============================
// 💬 Chat API
// ===============================

app.post("/chat", async (req, res) => {

    console.log(
        "CHAT REQUEST RECEIVED:",
        req.body.message
    );


    try {

        const message = req.body.message;


        if (!message) {

            return res.status(400).json({

                reply: "Please type a message."

            });

        }


        const reply = await generateReply(message);


        res.json({

            reply: reply

        });


    } catch (error) {

        res.status(500).json({

            reply: "AI abhi response nahi de pa raha 😕"

        });

    }

});


// ===============================
// 🆕 New Chat
// ===============================

app.post("/new-chat", (req, res) => {

    chatHistory = [];


    console.log("NEW CHAT STARTED");


    res.json({

        success: true

    });

});


// ===============================
// 🚀 Start Server
// ===============================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});