require('dotenv').load();

var cronJob = require('cron').CronJob;
var pg = require('pg');
var request = require('request');
var slackAPI = require('slackbotapi');

var twitchTools = require('./twitch_tools');

var humanHypeChannel = process.env.HUMAN_HYPE_CHANNEL;

var slack = new slackAPI({
  'token': process.env.SLACK_TOKEN,
  'logging': true,
  'autoReconnect': true
});

var weatherJob = new cronJob('00 00 7 * * *', function() {
  getWeather(humanHypeChannel);
});

var twitchJob = new cronJob('0 * * * * *', function() {
  twitchTools.checkTwitchOnlineStatus(slack);
});

slack.on('hello', function() {
  weatherJob.start();
  twitchJob.start();
});

slack.on('message', function (data) {
  var command;

  if (!data.text) { return; }

  if (data.text[0] === '!') {
    command = data.text.split(' ')[0];

    switch (command) {
      case '!dog':
        getDog(data.channel);
        break;
      case '!pick':
        pickOption(data.text, data.channel);
        break;
      case '!roulette':
        playRoulette(data.channel);
        break;
      case '!roll':
        rollDice(data.text, data.channel);
        break;
    };
  } else if (data.text.toLowerCase().indexOf('jerry') >= 0 && data.text.toLowerCase().indexOf('help') >= 0) {
    slack.sendMsg(data.channel, "Sorry, I can't help you. Nothing can.");
  }
});

function getDog(channel) {
  const url = "http://reddit.com/r/dogpictures.json?limit=100&type=link"

  request(url, function(error, response, body) {
    const rand = Math.floor((Math.random() * 100) + 1);

    slack.sendMsg(channel, JSON.parse(body)['data']['children'][rand]['data']['preview']['images'][0]['source']['url']);
  });
}

function pickOption(text, channel) {
  const options = text.slice(5).split(",");
  const rand = Math.floor((Math.random() * options.length));

  slack.sendMsg(channel, options[rand]);
}

function playRoulette(channel) {
  const rand = Math.floor(Math.random() * 6);

  if (rand === 0) {
    slack.sendMsg(channel, ':boom: :gun: You\'re dead');
  } else {
    slack.sendMsg(channel, 'You live.... for now.');
  }
}

function rollDice(text, channel) {
  const splitText = text.split(' ');
  var diceText, roll, rolls = [];
  var numDice = 1;
  var diceType = 20;
  var sum = 0;

  if (splitText.length >= 2) {
    if (splitText[1].match(/^(\d*)[d](\d+)$/)) {
      diceText = splitText[1].split('d');

      if (diceText[0]) {
        numDice = parseInt(diceText[0]);
      }

      diceType = parseInt(diceText[1]);
    } else {
      slack.sendMsg(channel, "I don't think I can roll that.");
      return;
    }
  }

  if (numDice > 1000) {
    slack.sendMsg(channel, "Chill with all the dice.");
    return;
  }

  for (var i = 0; i < numDice; i++) {
    roll = Math.floor((Math.random() * diceType) + 1)
    rolls.push(roll);
    sum += roll;
  }

  var message = "*" + sum.toString() + "*" + "\n[" + rolls.toString() + "]";

  slack.sendMsg(channel, message);
}

function getWeather(channel) {
  const url = "http://api.wunderground.com/api/" + process.env.WUNDERGROUND_TOKEN + "/forecast/q/MA/Boston.json";

  request(url, function(error, response, body) {
    const weatherDays = JSON.parse(body)['forecast']['simpleforecast']['forecastday'];
    var response = '```date         | high | low | conditions \n----------------------------------------------\n';

    weatherDays.forEach(function(day) {
      var dateText = day['date']['monthname_short'] + ' ' + day['date']['day'] + ", " + day['date']['year'];
      var highText = ' ' + day['high']['fahrenheit'] + '°';
      var lowText = ' ' + day['low']['fahrenheit'] + '°';
      var conditionsText = ' ' + day['conditions'];

      for (i = dateText.length; i < 13; i++) {
        dateText = dateText.concat(' ');
      }

      for (i = highText.length; i < 6; i++) {
        highText = highText.concat(' ');
      }

      for (i = lowText.length; i < 5; i++) {
        lowText = lowText.concat(' ');
      }

      response = response.concat(dateText + '|' + highText + '|' + lowText + '|' + conditionsText + '\n');
    });

    response = response.concat('```');

    slack.sendMsg(channel, response);
  });
}
