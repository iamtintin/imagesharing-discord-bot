const Discord = require('discord.js');
const fs = require('fs');
const rq = require(`request`);
const EventEmitter = require('events');
const { request } = require('http');
const { Console } = require('console');

const eventEmitter = new EventEmitter();
const client = new Discord.Client();
const prefix = '¬';
const relativePath = './pics/';
const queuePath = './queue/';

const token = "";
const authorID = 0;

var images = ["jpg", "jpeg", "png", "jfif"];
var queue = [];

var tags = {};

function readScripts(cb){eventEmitter.em
    fs.readFile("./data.json", 'utf8', (err, jsonString)=>{eventEmitter.em
        if(err){
            return cb && cb(err);
        };

        console.log("JSON Read");

        try{
            var parsed = JSON.parse(jsonString);
            return cb && cb(null, parsed);
        } catch(err) {
            return cb & cb(err)
        }

    });
};

function open(){
    client.once('ready', () => {
        console.log('Bot is online!');
        eventEmitter.emit("online");
    });

    client.on('message', message =>{

        var channelExist = false;

        for(var channel of message.guild.channels.cache){
            if(channel[1].name == "snowys-hall-of-prayers" && channel[1].type == "text"){
                channelExist = true;
                break;
            };
        };

        if(!channelExist){
            message.guild.channels.create(
                "snowys-hall-of-prayers",
                {
                    type: 'text',
                    permissionOverwrites: [
                        {
                            id: message.guild.roles.everyone,
                            deny: ['VIEW_CHANNEL'],
                        },
                    ],
                }).then( () => {
                    console.log("Created Channel.");
                });
        } else {
            console.log("Channel already exists.");
        };
        
        console.log(message.author.tag);

        if(message.author.bot) return;

        if(!checkIfUserExists(message.author.id)){
            return;
        }
  
        if(message.channel.name == "snowys-hall-of-prayers") {

            manageAdmins(message.guild.members);    

            if(!message.content.toLowerCase().startsWith("¬add")) {
                message.delete();
                message.reply("This is not a channel for talking... Leave -.-")
                    .then( msg => {
                        msg.delete({ timeout: 5000 })
                    })
                    .catch( err => {
                        console.log(err)
                    });
                return;
            };

        };
        
        const arg = message.content.slice(prefix.length).split(/ +/);
        const command = arg.shift().toLowerCase();

        if(command.startsWith('!')) {
            var imageTag = command.slice(1).split(/ +/).shift().toLowerCase().trim();

            if(!(checkIfExists(imageTag))) {
                message.channel.send("Invalid Tag Boi! Go get some help...");
            } else {
                var pathToMsg = relativePath + imageTag + ".png";
                message.channel.send({files: [pathToMsg]});
            };

        } else if(command.startsWith("help")) {

            message.channel.send("Did you really think I could be asked to do this?");

        } else if(command.startsWith("adduser") && message.author.id == authorID){

            var user = message.guild.members.cache.filter(member => arg.includes(member.user.tag.toLowerCase().slice(member.user.tag.length-4, member.user.tag.length))).map(member => member.user);

            if (user.length == 0){
                message.channel.send("User needs to be online in order to be added.");
            }

            for(var i = 0; i < user.length; i++){
                if(!checkIfUserExists(user[i].id)){
                    addUser(user[i].tag.slice(user[i].tag.length-4, user[i].tag.length), user[i].id);
                    console.log(user[i].tag + " user added.");
                } else {
                    message.channel.send("User already exists.");
                }
            }

            setTimeout(function writing() {
                writeScripts();
            }, 2000);

        } else if(command.startsWith("update")){
            
            if(message.author.id == authorID){

                message.channel.send("Okai, brb.")

                dequeueUpdate();
                resetCounters();
                setTimeout(function writing() {
                    writeScripts();
                }, 2000);
 
                queue = [];

            } else {
                message.channel.send("Who the hell do you think you are to tell me what to do?")
            }

        } else if(command.startsWith("add")) {

            if(message.channel.name != "snowys-hall-of-prayers") {

                message.channel.send("Not here or maibe you just cant...");

            } else {

                if(checkValidity(arg)) {
                    var remaining = tags.admins.find(admin => admin.user == message.member.user.tag).requests;

                    if(remaining > 0) {

                        if (message.attachments.size == 1){

                            if (attachIsImage(message.attachments.first())){

                                download(arg[0], message.attachments.first().url);
                                tags.admins.find(admin => admin.user == message.member.user.tag).requests -= 1;
                                queue.push(arg[0].slice(1, -1));
                                setTimeout(function writing() {
                                    writeScripts();
                                }, 2000);

                            } else {
                                message.channel.send("Attach an image...")    
                            }

                        } else {
                            message.channel.send("Attach something...")
                        }

                    } else {
                        message.channel.send("You have surpassed your limit for making further requests. You already have requested to add 5 picture. Please wait till they have been accepted or declined.");
                    }

                } else {
                    message.channel.send("You don't even know the correct form .-.");
                    message.channel.send("It's \"¬add \'tagName\'\"");
                }

            };

        }

    });
    
    client.login(token);
};

function attachIsImage(msgAttach){
    var url = msgAttach.url.toLowerCase();
    for(var i = 0; i < images.length; i++){
        if (url.endsWith(images[i])){
            return true;
        }
    }
    return false;
};

function checkValidity(tag){
    if(tag.length == 0) return false;

    var pattern = /('|")[a-z1-9]{3,15}("|')/g;
    var regex = tag[0].match(pattern);

    if(regex == null){
        return false;
    } else {
        regex = regex[0];
    }

    if(tag.length == 1 && regex.length == tag[0].length) {
        tag = tag[0].slice(1, -1);
        if(!checkIfExists(tag) && !queue.includes(tag)) {
            return true
        };
    };

    return false;
};

function manageAdmins(guildMembers){
    console.log("\nManaging Admins");
    var admins = guildMembers.cache.filter(member => member.hasPermission('ADMINISTRATOR')).map(member => member.user.tag)
    var newAdmins = admins.filter(admin => !checkIfAdminExists(admin));

    console.log(admins);

    if(newAdmins.length > 0) {
        addAdmins(newAdmins);
    };
};

function addAdmins(list){
    list.forEach(admin => {
        tags.admins.push({"user": admin, "requests":5})
        console.log("Admin " + admin + " added")
    });
    setTimeout(function writing() {
        writeScripts();
    }, 2000);
}

function writeScripts(){
    console.log("\nWriting to JSON");
    var jsonContent = JSON.stringify(tags, null, 2);

    fs.writeFile("./data.json", jsonContent, 'utf8', (err)=>{
        if(err){
            console.log(err);
            return;
        };
        console.log("File Updated.");
    });
}; 

function checkIfExists(string){
    for(var i = 0; i < tags.commands.length; ++i){
        var tag = tags.commands[i];
        if(tag.tagName == string){
            return true;
        };
    };
    return false;
};

function checkIfAdminExists(string){
    for(var i = 0; i < tags.admins.length; ++i){
        var admin = tags.admins[i];
        if(admin.user == string){
            return true;
        };
    };
    return false;
}

function checkIfUserExists(id){
    for(var i = 0; i < tags.users.length; ++i){
        var user = tags.users[i];
        if(user.id == id){
            return true;
        };
    };
    return false;
}

function download(name, url){
    rq.get(url)
        .on('error', console.error)
        .pipe(fs.createWriteStream(`./queue/${name.slice(1,-1)}.png`));
}

function dequeueUpdate(){
    console.log("Dequeuing, Moving and Adding Tags");
    fs.readdir(queuePath, (err, files) =>{
        files.forEach(file => {
            moveFile(file);
            tags.commands.push({"tagName":file.slice(0, -4)});
        });
    });
}

function readQueue(){
    console.log("Reading Queue");
    fs.readdir(queuePath, (err, files) =>{
        files.forEach(file => {
            queue.push(file.slice(0,-4));
        });
    });
}

function resetCounters(){
    console.log("Reseting Counters");
    for(var i = 0; i < tags.admins.length; ++i){
        tags.admins[i].requests = 5;
    }
}

function moveFile(tag){
    fs.rename(queuePath + tag, relativePath + tag, (err) => {
        if(err) throw err;
        console.log(tag + " file moved.");
    });    
}

function addUser(tag, id){
    tags.users.push({"tag": tag, "id": id});
}

eventEmitter.on('filesread', ()=>{
    open();
});

eventEmitter.on('online', ()=>{
    //Implement Something
});

readScripts((err, dictionary) => {
    if(err) {
        console.log(err);
        return;
    }

    tags = dictionary
    readQueue();

    eventEmitter.emit('filesread');
});

