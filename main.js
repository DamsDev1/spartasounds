// Modules to control application life and create native browser window
const { electron, app, BrowserWindow } = require('electron')
const path = require('path');
const { ipcMain } = require('electron')
const sound = require("sound-play");



var commandsarray;
var mainWindow;
var cooldown = new Date;
cooldown.setDate(cooldown.getDate()-5);

var timecooldown = 15;


function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()


  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
  mainWindow.webContents.executeJavaScript('localStorage.removeItem("initiedBot");');
  initTwitch();
})


function initTwitch() {
  const TwitchBot = require('twitch-bot')

  const Bot = new TwitchBot({
    username: 'spartasounds_',
    oauth: 'oauth:m5711plkjdo8w1jiun9emooclb8r5q',
    channels: ['spartacuss93']
  })

  Bot.on('join', channel => {
    console.log(`Joined channel: ${channel}`);
    mainWindow.webContents.send('botinit', true);
  })

  Bot.on('error', err => {
    console.log(err)
  })

  Bot.on('message', chatter => {
    if (commandsarray.indexOf(chatter.message) > -1) {
      if (chatter.custom_reward_id && chatter.custom_reward_id != "") {
        var currentdate = new Date;
        if(((currentdate - cooldown) / 1000) > timecooldown) {
          mainWindow.webContents.send('responsecommand', chatter.message);
          cooldown = new Date()
        } else {
          diff = (currentdate - cooldown) / 1000;
          remainsecond = parseFloat(timecooldown - diff).toFixed(2);
          Bot.say("Une commande de son a déjà été utilisé récemment, veuillez patientez " + remainsecond + " secondes !")
        }
      }
    } else if (chatter.message == "!sons") {
      if (commandsarray.length > 0) {
        var chatter_array_commands;
        commandsarray.forEach(element => {
          console.log(element)
          if (chatter_array_commands === undefined) {
            chatter_array_commands = element
          } else {
            chatter_array_commands = chatter_array_commands.concat(", ", element);
          }
        });
        Bot.say("Les commandes pour le bot de sons: " + chatter_array_commands);
      } else {
        Bot.say("Aucune commande de sons est disponible ! :(");
      }
    }
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('commands', function (event, arg) {
  commandsarray = arg;
  event.returnValue = 'sync pong'
})

ipcMain.on('soundplay', function (event, arg) {
  sound.play(arg);
  event.returnValue = 'sync pong'
})

ipcMain.on('startbot', function (event, arg) {
  initTwitch();
  event.returnValue = 'sync pong'
})

ipcMain.on('cooldown', function (event, arg) {
  timecooldown = arg;
  event.returnValue = 'sync pong'
})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
