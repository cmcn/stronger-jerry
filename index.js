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
