var request = require('request');
var slackAPI = require('slackbotapi');

var slack = new slackAPI({
    'token': process.env.SLACK_TOKEN,
    'logging': true,
    'autoReconnect': true
});

slack.on('message', function (data) {
  if (!data.text) { return; }

  const command = data.text.split(' ')[0];

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
    slack.sendMsg(channel, ':boom: :gun: Bang! you\'re dead');
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
    if (splitText[1].match(/\S?([d])\d\d?/g)) {
      diceText = splitText[1].split('d');
      numDice = parseInt(diceText[0]);
      diceType = parseInt(diceText[1]);
    } else {
      slack.sendMsg(channel, "I don't think I can roll that.");
      return;
    }
  }

  for (var i = 0; i < parseInt(numDice); i++) {
    roll = Math.floor((Math.random() * parseInt(diceType)) + 1)
    rolls.push(roll);
    sum += roll;
  }

  var message = "*" + sum.toString() + "*" + "\n[" + rolls.toString() + "]";

  slack.sendMsg(channel, message);
}
