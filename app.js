const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const botToken = '7070609287:AAFpGweC4CDQdZHaX_O2URA1gQTQaJRT8EE';
const bot = new TelegramBot(botToken, { polling: true });
const express = require('express');
// Create an Express application
const app = express();

// Middleware to parse JSON bodies
let genderQuee = {}
let waitingQuee = [];
let messageQuee = {};
let inMessage = [];
let replyQuee = {};



function checkUserAuth(chatId) {
    // this function check the user auth if the user  registerd it will return true
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
        return "error";
    }
}



function register(msg) {
    return new Promise(async (res, rej) => {
        try {
            let chatId = msg.from.id;

            await bot.sendMessage(chatId, "🌐-Rigister require! \n\nစသုံးသူ အနေနဲ့သင်၏ အသက်နှင့်\n\nကျားမ ရွေးပေးရမည်");

            let name = msg.from.first_name;
            if (msg.from.last_name != undefined) {
                name = name + " " + msg.from.last_name;
            }

            let userName = null;
            if (msg.from.username != undefined) {
                userName = msg.from.username;
            }


            let age;
            let gender;
            let replyIndex; // is it for the age after user has entered his age that replylistern must of delete
            let setTime;    // to remove the setTimeout that is used to close the replyListern if there is not respose form the user


            let ageMessage = await bot.sendMessage(chatId, "📆 𝙋𝙡𝙚𝙖𝙨𝙚 𝙚𝙣𝙩𝙚𝙧 𝙮𝙤𝙪𝙧 𝙖𝙜𝙚!\n\n 📆 သင်၏အသက်ကိုထည့်ပါ။", {
                reply_markup: {
                    force_reply: true
                }
            });

            let ageResponse = await new Promise((res, rej) => {
                // if uses do not do anything after 20 seconds that replyLister for the age will be deleted automatically
                // and function will return false that indicate the end of the function

                setTime = setTimeout(() => {
                    bot.removeReplyListener(replyIndex);
                    res(false); // will return to ageResponse
                }, 1000 * 20);

                replyIndex = bot.onReplyToMessage(chatId, ageMessage.message_id, (reply) => {
                    // if the user does not enter a number then it will be deleted automatically
                    if (reply.text == undefined || isNaN(reply.text)) {
                        bot.removeReplyListener(replyIndex);
                        clearTimeout(setTime);
                        res(false);
                    }
                    // if the use add a valid age return the age;
                    else {
                        bot.removeReplyListener(replyIndex);
                        clearTimeout(setTime);
                        res(reply.text);
                    }
                })
            })

            if (ageResponse == false) {
                res(false); // that respose is for rigister function 
                return;
            }

            age = ageResponse;

            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🚹 Male', callback_data: 'male' }],
                        [{ text: '🚺 Female', callback_data: 'female' }],
                        [{ text: '⭕ Other', callback_data: 'other' }],
                    ],
                },

            };

            await bot.sendMessage(chatId, "𝙋𝙡𝙚𝙖𝙨𝙚 𝙨𝙚𝙡𝙚𝙘𝙩 𝙮𝙤𝙪𝙧 𝙜𝙚𝙣𝙙𝙚𝙧:\n\nကျေးဇူးပြု၍ တစ်ခုရွေးပါ။", keyboard);
            // that line give 3 options for the user to choose their gender
            // if user select one that will store in genderQuee object like chatId:gender eg: 334342343242:"male"
            
            let genderRespose = await new Promise((res, rej) => {
                let index = 0;
                let interval = setInterval(() => {
                    // in every 1 second we are checking does user press any button or not
                    // if users press any button their gender will store in genderQuee and key is their chatId
                    // and will make genderQuee[chatId] not equal to undefined
                    // if user does not press any button in 15 second then we will clear interval and will return false
                    // 
                    if (genderQuee[chatId] != undefined) {
                        clearInterval(interval); // stop the current interval;
                        let genderType = genderQuee[chatId]
                        delete genderQuee[chatId];
                        res(genderType); // will return to genderRespose
                    }
                    if (index > 15) {
                        // indicate user does not press any button so clear the interval and return false
                        clearInterval(interval);
                        res(false);
                    }

                    index++;
                }, 1000);
            })

            if (genderRespose == false) {
                res(false); // resopose to resgister function
                return;
            }

           gender  = genderRespose;


            // res({name,userName,age,gender});

            // adding that user details to user.json
            let data = fs.readFileSync("./data/users.json", "utf-8");
            data = JSON.parse(data);

            data.data[chatId] = { name, userName, age, gender };
            fs.writeFileSync("./data/users.json", JSON.stringify(data));
            await bot.sendMessage(chatId, "✅ Your account is registered successfully");
            res(true);


        }
        catch (err) {
            res(false);
        }
    })
}


function matchUser(chatId) {
    try {
        if (waitingQuee[0] == undefined) {
            waitingQuee.push(chatId);
            bot.sendMessage(chatId, "🔎 𝙨𝙚𝙖𝙧𝙘𝙝𝙞𝙣𝙜 𝙛𝙤𝙧 𝙥𝙖𝙧𝙩𝙣𝙚𝙧......");
            return false;
        }
        else if (waitingQuee[0] == chatId) {
            bot.sendMessage(chatId, "🤧 Already searching for partner .....");
            return false;
        }
        else if (waitingQuee[0] != undefined && waitingQuee[0] != chatId) {
            let user2 = waitingQuee[0];
            waitingQuee.shift();
            return { chatId1: chatId, chatId2: user2 };

        }
        else{
            bot.sendMessage(chatId,"Cannot find a partner for you!");
            return false;
        }
    }
    catch (err) {
        console.log(err);
    }
}

function connectBothUser(chatId1, chatId2) {
    try {
        let template = `partner တွေ့ရှိပါသည်🎉\n\n /next နောက်တစ်ယောက်ရှာရန်😜\n\n /stop ရပ်တန့်ရန်🥲`
        bot.sendMessage(chatId1, template).catch((err) => {
            console.log(err.message);
        })
        bot.sendMessage(chatId2, template).catch((err) => {
            console.log(err.message);
        })

        inMessage.push(chatId1);
        inMessage.push(chatId2);

        messageQuee[chatId1] = chatId2;
        messageQuee[chatId2] = chatId1;


    }
    catch (err) {
        console.log(err);
    }
}



function mainHandler(msg) {
    try{
    // checking does the user is auth or not
    // to check the user auth we use checkAuth(chatId) function
    // that function return true if auth else false and if there is an error it return "error"
        let chatId = msg.chat.id;
        let isAuth = checkUserAuth(chatId);
        if (isAuth == false) {
            register(msg).then((val) => {
                if (val == false) {
                    bot.sendMessage(chatId, "⚠️ Fail to register your account");
                    return;
                }
    
                else if (val == true) {
                    let usersDeatils = matchUser(chatId);
                    if (usersDeatils != false) {
                        connectBothUser(usersDeatils.chatId1, usersDeatils.chatId2);
                    }
                }
            })
        }
        else {
            let usersDeatils = matchUser(chatId);
            if (usersDeatils != false) {
                connectBothUser(usersDeatils.chatId1, usersDeatils.chatId2);
            }
        }
    }
    catch(err){
        console.log(err);
        return false;
    }

   
}

function isInMessage(chatId) {
    for (let a = 0; a < inMessage.length; a++) {
        if (chatId == inMessage[a]) {
            return true;
        }
    }
    return false;
}
// isInMessage function is used to check does user is already in chatting box or not
// if user is not in chatting box then it will  return false



// adding disconnection functioin and remove replyListern

function removeListeners(chatId) {
    let removeList = replyQuee[chatId];
    if (removeList == undefined) {
        return;
    }

    for (let a = 0; a < removeList.length; a++) {
        bot.removeReplyListener(removeList[a]);
    }
    delete replyQuee[chatId];
}

async function disconnection(chatId, sendMarkup) {
    try {
        if (!isInMessage(chatId)) { // isInMessage is a functiion that chcek whether you are in chat or not
            await bot.sendMessage(chatId, "🤨 ကျော်ဖို့ ဘယ်သူမှ မရှိဘူး \n\n🚀 ရှာရန် /start 𝙤𝙧 /find ကိုနှိပ်ပါ🌚");
            return false;
        }
        let keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: '🚀 Find new partner' }],
                    [{ text: '💼 Grow business with us' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };
        if (sendMarkup == false) {
            keyboard = undefined;
        }

        let user2 = messageQuee[chatId];
        delete messageQuee[user2];
        delete messageQuee[chatId];

        // Remove chatIds from inMessage array
        inMessage = inMessage.filter(id => id !== chatId && id !== user2);

        // removeListerns is the fucnction to remove reply listners
        removeListeners(chatId);
        removeListeners(user2);

        await bot.sendMessage(chatId, "သင်ရပ်တန့်လိုက်ပြီး💢\n\n နောက်တစ်ယောက်ရှာရန် /start or /find ကိုနှိပ်ပါ🙃", keyboard);
        await bot.sendMessage(user2, "ခနခန😅 အကျော် ခံရပြီး \n\nနောက်တစ်ယောက်ရှာရန် /start or /find ကိုနှိပ်ပါ🙃", keyboard);

        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

bot.on("message", async(msg) => {
    try {
        if (msg.text == "🚀 Find new partner" || msg.text == "/start" || msg.text == "/find") {
            if (!isInMessage(msg.chat.id)) {
                mainHandler(msg);
            }
            else {
                bot.sendMessage(msg.chat.id, "🤪 𝙔𝙤𝙪 𝙖𝙧𝙚 𝙖𝙡𝙧𝙚𝙖𝙙𝙮 𝙞𝙣 𝙘𝙝𝙖𝙩𝙩𝙞𝙣𝙜 𝙗𝙤𝙭 !");
                return;
            }
        

         }
        else if(msg.text=="/next"){
            let disconnectionStaus = disconnection(msg.chat.id,false);
            if(disconnectionStaus==true){
                mainHandler(msg);
            }
        }
        else if(msg.text=="/stop"){
            await disconnection(msg.chat.id,true);
        }

        else if (messageQuee[msg.chat.id] != undefined && msg.reply_to_message == undefined) {
            let partnerId = messageQuee[msg.chat.id];
            if (msg.text) {
                if(!msg.text.startsWith("/")){
                    sendMessage(partnerId, msg, undefined, msg.message_id);
                }
            }
            else{
                sendMessage(partnerId, msg, undefined, msg.message_id);
            }
        }
    }
    catch (err) {
        console.log(err);
    }
})

bot.on("callback_query", (msg) => {
    let chatId = msg.message.chat.id;;
    let gender = msg.data;
    bot.deleteMessage(chatId, msg.message.message_id)
    genderQuee[chatId] = gender;
})



// server code here

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// message handeler function are here


function addReplyListenerId(replyId, toSendChatId) {
    try {
        if (replyQuee[toSendChatId] == undefined) {
            replyQuee[toSendChatId] = [replyId];
        }
        else {
            let data = replyQuee[toSendChatId];
            data.push(replyId);
            replyQuee[toSendChatId] = data;
        }

        console.log(replyQuee);
    }
    catch (err) {
        console.log(err);
    }
}

async function sendMessage(toSendChatId, msg, messagaId, originalMessageId) {
    try {
        let messageData;
        if (msg.text) {
            messageData = await bot.sendMessage(toSendChatId, msg.text, { reply_to_message_id: messagaId });
        }
        else if (msg.photo) {
            let caption;
            if (msg.caption) {
                caption = msg.caption;
            }
            messageData = await bot.sendPhoto(toSendChatId, msg.photo[2].file_id, { caption: caption, reply_to_message_id: messagaId });
        }
        else if (msg.video) {
            let caption;
            if (msg.caption) {
                caption = msg.caption;
            }
            messageData = await bot.sendVideo(toSendChatId, msg.video.file_id, { caption: caption, reply_to_message_id: messagaId });
        }
        else if (msg.sticker) {
            messageData = await bot.sendSticker(toSendChatId, msg.sticker.file_id, { reply_to_message_id: messagaId });
        }
        else if (msg.voice) {
            messageData = await bot.sendVoice(toSendChatId, msg.voice.file_id, { reply_to_message_id: messagaId });
        }
        else if (msg.video_note) {
            messageData = await bot.sendVideoNote(toSendChatId, msg.video_note.file_id, { reply_to_message_id: messagaId });

        }
        else if (msg.audio) {
            let caption;
            if (msg.caption) {
                caption = msg.caption;
            }
            messageData = await bot.sendAudio(toSendChatId, msg.audio.file_id, { caption: caption, reply_to_message_id: messagaId });

        }
        else if (msg.document) {
            let caption;
            if (msg.caption) {
                caption = msg.caption;
            }
            messageData = await bot.sendDocument(toSendChatId, msg.document.file_id, { caption: caption, reply_to_message_id: messagaId });
        }
        else if (msg.contact) {
            messageData = await bot.sendContact(toSendChatId, msg.contact.phone_number, msg.contact.first_name, { reply_to_message_id: messagaId });
        }

        let replyId = bot.onReplyToMessage(toSendChatId, messageData.message_id, async (reply) => {
            let targetUser = messageQuee[toSendChatId];
            await sendMessage(targetUser, reply, originalMessageId, reply.message_id).catch((err) => {
                console.log(err);
            })
        })

        addReplyListenerId(replyId, toSendChatId);


        // code is to add self replying feature

        let originalChatId = messageQuee[toSendChatId];
        replyId = bot.onReplyToMessage(originalChatId, originalMessageId, async (reply) => {
            try {
                let targetUser = messageQuee[originalChatId]
                await sendMessage(targetUser, reply, messageData.message_id, reply.message_id)
            }
            catch (err) {
                console.log(err);
            }
        })
        addReplyListenerId(replyId, originalChatId);



    }
    catch (err) {
        console.log(err);
    }
}
