var pg = require('pg');
var request = require('request');

var gamesChannel = process.env.GAMES_CHANNEL;

module.exports = {
  checkTwitchOnlineStatus: function() {
    var messages = [];

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
                  messages.push(message);
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

    return messages;
  },

  addTwitchChannel: function(channelName) {
    return new Promise(function(resolve, reject) {
      const url = 'https://api.twitch.tv/kraken/channels/' + channelName;

      request({
        headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
        uri: url
      }, function(error, response, body) {
        if (response['statusCode'] === 404) {
          resolve(channelName + " does not exist.");
        } else {
          pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
              console.log("PG Connect Error: " + err);
            }

            client.query("SELECT * FROM twitch_channels WHERE LOWER(name) = LOWER('" + channelName + "')", function(err, result) {
              if (result['rows'].length > 0) {
                done();

                resolve(channelName + " is already on the list.");
              } else {
                client.query("INSERT INTO twitch_channels (name) VALUES (LOWER('" + channelName + "'))", function(err, result) {
                  if (err) {
                    console.log("PG Query Error: " + err);
                  }

                  done();

                  resolve(channelName + " has been added to the list.");
                });
              }
            });
          });
        }
      });
    });
  },

  removeTwitchChannel: function(channelName) {
    return new Promise(function(resolve, reject) {
      pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
          console.log("PG Connect Error: " + err);
        }

        client.query("SELECT * FROM twitch_channels WHERE LOWER(name) = LOWER('" + channelName + "')", function(err, result) {
          if (err) {
            console.log("PG Query Error: " + err);
          }

          if (result['rows'].length > 0) {
            client.query("DELETE FROM twitch_channels WHERE LOWER(name) = LOWER('" + channelName + "')", function(err, result) {
              if (err) {
                console.log("PG Query Error: " + err);
              }

              done();

              resolve(channelName + " has been removed.");
            });
          } else {
            done();

            resolve(channelName + " is not on the list.");
          }
        });
      });
    });
  },
}
