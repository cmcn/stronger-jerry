var pg = require('pg');
var request = require('request');

var gamesChannel = process.env.GAMES_CHANNEL;

module.exports = {
  checkTwitchOnlineStatus: function(slack) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("PG Connect error: " + err);

        done();
      }

      client.query('SELECT * FROM twitch_channels', function(err, result) {
        if (err) {
          console.log("PG Query Error: " + err);
        } else {
          result['rows'].forEach(function(row) {
            const streamName = row['name'];
            const url = "https://api.twitch.tv/kraken/streams/" + streamName;

            request({
              headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
              uri: url
            }, function(error, response, body) {
              const message = "https://www.twitch.tv/" + streamName + " is now online!";
              const streamDetails = JSON.parse(body)["stream"];

              if (!streamDetails && row['online']) {
                console.log('setting offline');

                client.query("UPDATE twitch_channels SET online = false WHERE name = '" + streamName + "'", function(err, result) {
                  done();
                });
              } else if (streamDetails && !row['online']) {
                console.log('setting online');

                client.query("UPDATE twitch_channels SET online = true WHERE name = '" + streamName + "'", function(err, result) {
                  slack.sendMsg(gamesChannel, message);
                  done();
                });
              } else {
                done();
              }
            });
          });
        }
      });
    });
  },

  addTwitchChannel: function(slack, channelName) {
    const url = 'https://api.twitch.tv/kraken/channels/' + channelName;

    request({
      headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
      uri: url
    }, function(error, response, body) {
      if (response['statusCode'] === 404) {
        slack.sendMsg(gamesChannel, channelName + " does not exist.");
      } else {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
          if (err) {
            console.log("PG Connect Error: " + err);
          }

          client.query("SELECT * FROM twitch_channels WHERE name = '" + channelName + "'", function(err, result) {
            if (result['rows'].length > 0) {
              done();

              slack.sendMsg(gamesChannel, channelName + " is already on the list.");
            } else {
              client.query("INSERT INTO twitch_channels (name) VALUES ('" + channelName + "')", function(err, result) {
                if (err) {
                  console.log("PG Query Error: " + err);
                }

                done();

                slack.sendMsg(gamesChannel, channelName + " has been added to the list.");
              });
            }
          });
        });
      }
    });
  },

  removeTwitchChannel: function(slack, channelName) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("PG Connect Error: " + err);
      }

      client.query("SELECT * FROM twitch_channels WHERE name = '" + channelName + "'", function(err, result) {
        if (err) {
          console.log("PG Query Error: " + err);
        }

        if (result['rows'].length > 0) {
          client.query("DELETE FROM twitch_channels WHERE name = '" + channelName + "'", function(err, result) {
            if (err) {
              console.log("PG Query Error: " + err);
            }

            done();

            slack.sendMsg(gamesChannel, channelName + " has been removed.");
          });
        } else {
          done();

          slack.sendMsg(gamesChannel, channelName + " is not on the list.");
        }
      });
    });
  },

  updateStats: function() {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("PG Connect Error: " + err);
      }

      const url = "https://api.twitch.tv/kraken/channels/cumpp";

      request({
        headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
        uri: url
      }, function(error, response, body) {
        const followers = JSON.parse(body)['followers'];
        const views = JSON.parse(body)['views'];
        const today = new Date();

        var year = today.getFullYear().toString();
        var month = (today.getMonth() + 1).toString();
        var day = today.getDate().toString();

        if (month.length < 2) {
          month = '0' + month;
        }

        if (day.length < 2) {
          day = '0' + day;
        }

        const dateString = year + '-' + month + '-' + day;
        const insertString = "('cumpp', '" + dateString + "', " + views + ", " + followers + ")";

        client.query("INSERT INTO twitch_stats (channel, date, views, followers) values " + insertString, function(err, result) {
          if (err) {
            console.log("PG Query Error: " + err);
          }

          console.log('stats updated');
          done();
        });
      });
    });
  },
}
