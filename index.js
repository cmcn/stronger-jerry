require('dotenv').load();

const cronJob = require('cron').CronJob;
const settings = require('./settings.json');

const DiscordInterface = require('./interfaces/discord');
const SlackInterface = require('./interfaces/slack');
const Misc = require('./tools/misc');
const Twitch = require('./tools/twitch');

const { discordClient } = DiscordInterface;
const { slackApi } = SlackInterface;

// Discord Listeners
discordClient.on('hello', function() {
  startDiscordJobs();
});

discordClient.login(process.env.DISCORD_TOKEN);

// Slack Listeners
slackApi.on('hello', function() {
  startSlackJobs();
});

slackApi.on('message', function(data) {
  routeSlackCommand(data);
});

// Start Cron Jobs
function startDiscordJobs() {
  const twitchStatusJob = new cronJob('0 * * * * *', function() {
    const messages = Twitch.checkTwitchOnlineStatus('discord');

    messages.forEach(function(message) {
      discordClient.channels.get(settings.discordChannels.twitch).sendMessage(message);
    });
  });

  twitchStatusJob.start();
}

function startSlackJobs() {
  const weatherJob = new cronJob('00 00 7 * * *', function() {
    Misc.getWeather().then(function(message) {
      slackApi.sendMsg(settings.slackChannels.humanHype, message);
    });
  });
  const twitchOnlineStatusJob = new cronJob('0 * * * * *', function() {
    const messages = Twitch.checkTwitchOnlineStatus('slack');

    messages.forEach(function(message) {
      slackApi.sendMsg(settings.slackChannels.games, message);
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

    if (data.channel === settings.slackChannels.games) {
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
          slackApi.sendMsg(settings.slackChannels.games, message);
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
