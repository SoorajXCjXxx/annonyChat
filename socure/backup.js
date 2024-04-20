function backup(fs,messageQuee,inMessage,replyQuee){

    let data = {messageQuee,inMessage,replyQuee};
    console.log(data);
    fs.writeFileSync("./data/backup.json",JSON.stringify(data));
}


module.exports.backup = backup;