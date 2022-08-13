# imagesharing-discord-bot

A Discord bot for sharing stored images (jpg, jpeg, png, jfif) easily (like server-emojis) in a small community. 

## Usage
Prerequisites: npm

Set the discord bot token value and the bot's owner's  ID in `index.js` and add the bot to the designated server (with appropriate permissions). 

Run the discord bot to create the `snowys-hall-of-prayers` channel, where images can be added with the appropriate command. Only admins recognized by bot can add 5 images to the `queue` folder at any time, where the images must be manually moved to the `pics` folder if they are accepted. 

The images can be accessed using the corresponding tag name and command in any channel the bot has access to. 

### Commands
```
\\ Add an image (command must be written with an image attachment)
¬add  '[tag-name]'
e.g.: ¬add 'kekw'

\\ Access an image to send
![tag-name]
e.g.: !kekw

\\ Accept all queued images (can only be done by bot's owner)
¬update 

\\ Allow user to add images (can only be done by bot's owner)
¬adduser [@user]
```
