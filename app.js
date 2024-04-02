const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { isatty } = require('tty');

const botToken = '7070609287:AAFpGweC4CDQdZHaX_O2URA1gQTQaJRT8EE';
// const ownerId = '7070609287:AAFpGweC4CDQdZHaX_O2URA1gQTQaJRT8EE'; // Your Telegram user ID

const bot = new TelegramBot(botToken, { polling: true });


function checkUserAuth(chatId) {
    // this function check the user auth if the user is registerd it will return true
    // if not then flase will return
    try {
        let data = fs.readFileSync("./data/users.json", "utf-8");
        data = JSON.parse(data);

        if (data.data[chatId] != undefined) {
            return true;
        }
        return false;
    }
    catch (err) {
        console.log(err);
    }
}

function inputAge(chatId) {

}

async function inputPersonalData(chatId, dataObj) {
    // Ask for the user's age
    const ageMessage = await bot.sendMessage(chatId, "📆 Please enter your age:", {
        reply_markup: {
            force_reply: true
        }
    });

    // Listen for the user's response to the age message
    const ageResponse = await new Promise((resolve) => {
        bot.onReplyToMessage(chatId, ageMessage.message_id, resolve);
    });

    // Store the user's age
    dataObj.age = ageResponse.text;

    // Send the gender selection options
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🚹 Male', callback_data: 'male' }],
                [{ text: '🚺 Female', callback_data: 'female' }],
                [{ text: '⭕ Other', callback_data: 'other' }],
            ],
        },
    };

    const genderMessage = await bot.sendMessage(chatId, "Please select your gender:", keyboard);

    // Listen for the user's selection of gender
    const msg = await new Promise((resolve) => {
        bot.on('callback_query', (msg) => {
            resolve(msg);
        });
    });

    // Store the user's gender
    dataObj.gender = msg.data;

    // Delete the inline keyboard after selection
    bot.deleteMessage(chatId, genderMessage.message_id);

    // Do something with age and gender
    return dataObj;
}


async function registerUserInFile(msg) {
    try {
        let name = msg.from.first_name;
        if (msg.from.last_name != undefined) {
            name = name + " " + msg.from.last_name;
        }

        let userName = null;
        if (msg.from.username != undefined) {
            userName = msg.from.username;
        }

        let chatId = msg.from.id;
        let data = fs.readFileSync("./data/users.json", "utf-8");
        data = JSON.parse(data);

        // asking user for their gender and  age

        let dataObj = new Object();
        dataObj.name = name;
        dataObj.userName = userName;
        let personalData = await inputPersonalData(chatId, {});

        dataObj = { ...dataObj, ...personalData };
        console.log(dataObj)
        data.data[chatId] = dataObj;
        fs.writeFileSync("./data/users.json", JSON.stringify(data));

    }
    catch (err) {

    }
}

let waitingQuee = [];
let messageQuee = {};

function matchUser(chatId) {

    if (waitingQuee[0] != undefined) {
        // checking the user should not contain in waiting quee
        //else it will get connect to himself
        for (let a = 0; a < waitingQuee.length; a++) {
            if (waitingQuee[a].chatId == chatId) {
                bot.sendMessage(chatId, "You are already in searching....");
                return;
            }
        }

        let targetId = waitingQuee[0].chatId;
        waitingQuee.shift();
        return { chatId1: chatId, chatId2: targetId };
    }
    else {

        waitingQuee.push({ chatId: chatId });
        bot.sendMessage(chatId, "🚀 𝓈𝑒𝒶𝓇𝒸𝒽𝒾𝓃𝑔 𝒻𝑜𝓇 𝓅𝒶𝓇𝓉𝓃𝑒𝓇...........")
        console.log(waitingQuee);
    }
}

function sendDetailsToBothUser(chatId1, chatId2) {
    let template = `Partner found 😺\n\n/next — find a new partner\n/stop — stop this dialog\n\n@funny_hat_bot`
    bot.sendMessage(chatId1, template);
    bot.sendMessage(chatId2, template);
}

function main(chatId1, chatId2) {
    // we are infromig the user that you has been connected to other user
    sendDetailsToBothUser(chatId1, chatId2);
    messageQuee[chatId1] = chatId2;
    messageQuee[chatId2] = chatId1;

    console.log(messageQuee);
}

function disconnection(chatId) {
    try {
        bot.sendMessage(chatId, "You stopped the dialog 🙄\nType /next to find a new partner\n\n@hatbot");
        let user2 = messageQuee[chatId];
        bot.sendMessage(user2, "Your partner has stopped the dialog 😞\nType /next to find a new partner\n\n@chatbot")
        delete messageQuee[user2];
        delete messageQuee[chatId];

        console.log(messageQuee);
    }
    catch(err){
        console.log(err);
    }
}

bot.onText(/\/start/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        // checking user is rigisted or not
        // if isAuth is false the usser have to to rigister 
        let isAuth = checkUserAuth(chatId);

        if (!isAuth) {
            // indicating checkUserAuth(chatId) returns flase
            registerUserInFile(msg);
        }
        else if (isAuth) {
            let statusMatchUser = matchUser(chatId);
            if (statusMatchUser != undefined) {
                main(statusMatchUser.chatId1, statusMatchUser.chatId2);
            }
        }

    }
    catch (err) {
        console.log(err);
    }
});

bot.on("message", (msg) => {
    let chatId = msg.from.id;

    if (messageQuee[chatId] != undefined) {
        console.log("here");
        let text = msg.text;
        let partnerId = messageQuee[chatId];
        bot.sendMessage(partnerId, text);
    }
    // console.log(msg.text);
})
bot.on(/\/next/, (msg) => {
    try{
        console.log("code is here");
        disconnection(msg.chat.id);
    }
    catch(err){
        console.log(err);
    }
})
