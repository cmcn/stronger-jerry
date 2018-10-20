require('dotenv').load();

const cronJob = require('cron').CronJob;
const settings = require('./settings.json');

const { discordClient } = require('./interfaces/discord');
const { slackApi } = require('./interfaces/slack');
const Misc = require('./tools/misc');
const Twitch = require('./tools/twitch');

// Discord Listeners
// discordClient.on('ready', function() {
//   startDiscordJobs();
// });

// discordClient.login(process.env.DISCORD_TOKEN);

// Slack Listeners
slackApi.on('hello', function() {
  startSlackJobs();
});

slackApi.on('message', function(data) {
  routeSlackCommand(data);
});

// Start Cron Jobs
// function startDiscordJobs() {
//   const twitchStatusJob = new cronJob('0 * * * * *', function() {
//     Twitch.checkTwitchOnlineStatus('discord');
//   });

//   twitchStatusJob.start();
// }

function startSlackJobs() {
  const weatherJob = new cronJob('00 00 7 * * *', function() {
    Misc.getWeather().then(function(message) {
      slackApi.sendMsg(settings.slackChannels.humanHype, message);
    });
  });
  weatherJob.start();
  // const twitchOnlineStatusJob = new cronJob('0 * * * * *', function() {
  //   Twitch.checkTwitchOnlineStatus('slack');
  // });
  // twitchOnlineStatusJob.start();
}

function routeSlackCommand(data) {
  var command;

  if (!data.text) { return; }

  if (data.text[0] === '!') {
    const splitText = data.text.split(' ');
    var promise;

    command = splitText[0];

    if (data.channel === settings.slackChannels.games) {
      const value = splitText[1];

      switch(command) {
        case '!addChannel':
          Twitch.addTwitchChannel('slack', value);
          break;
        case '!removeChannel':
          Twitch.removeTwitchChannel('slack', value);
          break;
        case '!listChannels':
          Twitch.listChannels('slack');
          break;
      };
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
