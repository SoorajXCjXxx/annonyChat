function backup(fs,messageQuee,inMessage){

    let data = {messageQuee,inMessage}
    console.log(data);
    fs.writeFileSync("./data/backup.json",JSON.stringify(data));
}


module.exports.backup = backup;