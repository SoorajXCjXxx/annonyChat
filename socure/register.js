function register(msg,collection,bot) {
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
            // adding that user details to user.json
            

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

module.exports.register = register;