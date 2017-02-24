require('dotenv').load();

var cronJob = require('cron').CronJob;
var SlackInterface = require('./interfaces/slack');
var Misc = require('./tools/misc');
var Twitch = require('./tools/twitch');

var { slackApi } = SlackInterface;

var gamesChannel = process.env.GAMES_CHANNEL;
var humanHypeChannel = process.env.HUMAN_HYPE_CHANNEL;

// Slack Listeners
slackApi.on('hello', function() {
  startJobs();
});

slackApi.on('message', function(data) {
  routeSlackCommand(data);
});

// Start Cron Jobs
function startJobs() {
  var weatherJob = new cronJob('00 00 7 * * *', function() {
    slackApi.sendMsg(humanHypeChannel, Misc.getWeather());
  });
  var twitchOnlineStatusJob = new cronJob('0 * * * * *', function() {
    var messages = Twitch.checkTwitchOnlineStatus();

    messages.forEach(function(message) {
      slackApi.sendMsg(gamesChannel, message);
    });
  });

  weatherJob.start();
  twitchOnlineStatusJob.start();
}

function routeSlackCommand(data) {
  var command;

  if (!data.text) { return; }

  if (data.text[0] === '!') {
    const splitText = data.text.split(' ');
    var promise;

    command = splitText[0];

    if (data.channel === gamesChannel) {
      const value = splitText[1];

      switch(command) {
        case '!addChannel':
          promise = Twitch.addTwitchChannel(value);
          break;
        case '!removeChannel':
          promise = Twitch.removeTwitchChannel(value);
          break;
        case '!listChannels':
          promise = Twitch.listChannels();
          break;
      };

      if (promise) {
        promise.then(function(message) {
          slackApi.sendMsg(gamesChannel, message);
        });

        return;
      }
    }

    switch (command) {
      case '!dog':
        promise = Misc.getDog();
        break;
      case '!pick':
        promise = Misc.pickOption(data.text);
        break;
      case '!roulette':
        promise = Misc.playRoulette();
        break;
      case '!roll':
        promise = Misc.rollDice(data.text);
        break;
    };

    if (promise) {
      promise.then(function(message) {
        slackApi.sendMsg(data.channel, message);
      });
    }
  } else if (data.text.toLowerCase().indexOf('jerry') >= 0 && data.text.toLowerCase().indexOf('help') >= 0) {
    slackApi.sendMsg(data.channel, "Sorry, I can't help you. Nothing can.");
  }
}
