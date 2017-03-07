const pg = require('pg');
const request = require('request');
const { slackApi } = require('../interfaces/slack');
const settings = require('../settings.json');

const gamesChannel = settings.slackChannels.games;
const clientID = process.env.TWITCH_CLIENT_ID;

function sendMessage(chatClient, message) {
  if (chatClient === 'slack') {
    slackApi.sendMsg(gamesChannel, message);
  }
}

module.exports = {
  checkTwitchOnlineStatus: function(chatClient) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("PG Connect error: " + err);
        return;
      }

      client.query("SELECT name, online FROM twitch_channels WHERE '" + chatClient + "' = any(chat_clients);", function(err, result) {
        if (err) {
          console.log("PG Query Error: " + err);
          return;
        }

        const urlString = result['rows'].map(row => row['name']).join(',');
        const url = "https://api.twitch.tv/kraken/streams?channel=" + urlString;

        request({ headers: { "Client-ID": clientID }, uri: url }, function(error, response, body) {
          const jsonBody = JSON.parse(body);
          const messages = [];

          result['rows'].forEach(function(row) {
            const streamName = row['name'];
            const online = jsonBody['streams'].find(function(stream) {
              return stream['channel']['name'] === streamName;
            });

            if (!online && row['online']) {
              console.log('setting offline');

              client.query("UPDATE twitch_channels SET online = false WHERE name = '" + streamName + "'");
            } else if (online && !row['online']) {
              console.log('setting online');

              client.query("UPDATE twitch_channels SET online = true WHERE name = '" + streamName + "'", function(err, result) {
                sendMessage(chatClient, "http://twitch.tv/" + row['name'] + " is now online!");
              });
            }
          });
        });
      });
    });
  },

  addTwitchChannel: function(chatClient, channelName) {
    const url = 'https://api.twitch.tv/kraken/channels/' + channelName;

    request({
      headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
      uri: url
    }, function(error, response, body) {
      if (response['statusCode'] === 404) {
        sendMessage(chatClient, channelName + " does not exist.");
        return;
      }

      pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
          console.log("PG Connect Error: " + err);
          return;
        }

        client.query("SELECT * FROM twitch_channels WHERE LOWER(name) = LOWER('" + channelName + "') AND '" + chatClient + "' = any(chat_clients)", function(err, result) {
          if (result['rows'].length > 0) {
            sendMessage(chatClient, channelName + " is already on the list.");
            return;
          }

          client.query("INSERT INTO twitch_channels (name, chat_clients) VALUES (LOWER('" + channelName + "'), array['" + chatClient + "'])", function(err, result) {
            if (err) {
              console.log("PG Query Error: " + err);
              return;
            }

            sendMessage(chatClient, channelName + " has been added to the list.");
          });
        });
      });
    });
  },

  removeTwitchChannel: function(chatClient, channelName) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("PG Connect Error: " + err);
        return;
      }

      client.query("SELECT * FROM twitch_channels WHERE LOWER(name) = LOWER('" + channelName + "') AND '" + chatClient + "' = any(chat_clients)", function(err, result) {
        if (err) {
          console.log("PG Query Error: " + err);
          return;
        }

        if (result['rows'].length > 0) {
          client.query("UPDATE twitch_channels SET chat_clients = array_remove(chat_clients, '" + chatClient + "') WHERE LOWER(name) = LOWER('" + channelName + "')", function(err, result) {
            if (err) {
              console.log("PG Query Error: " + err);
              return;
            }

            sendMessage('slack', channelName + " has been removed.");
          });
        } else {
          sendMessage('slack', channelName + " is not on the list.");
        }
      });
    });
  },

  listChannels: function(chatClient) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("PG Connect Error: " + err);
        return;
      }

      client.query("SELECT * FROM twitch_channels WHERE '" + chatClient + "' = any(chat_clients)", function(err, result) {
        if (err) {
          console.log("PG Query Error: " + err);
          return;
        }

        var message = "";
        result.rows.forEach(function(row) {
          message = message + row.name + "\n";
        });

        sendMessage('slack', message);
      })
    });
  },
}
