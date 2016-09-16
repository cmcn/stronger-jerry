var request = require('request');
var slackAPI = require('slackbotapi');

var slack = new slackAPI({
    'token': process.env.SLACK_TOKEN,
    'logging': true,
    'autoReconnect': true
});

slack.on('message', function (data) {
  if (!data.text) { return; }

  if (data.text === '!dog') {
    getDog(data.channel);
  } else if (data.text.slice(0, 5) === '!pick') {
    pickOption(data.text, data.channel);
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
