var SlackAPI = require('slackbotapi');

module.exports = {
  slackApi: new SlackAPI({
    'token': process.env.SLACK_TOKEN,
    'logging': true,
    'autoReconnect': true
  }),
};
