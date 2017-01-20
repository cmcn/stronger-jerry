module.exports = {
  checkTwitchOnlineStatus: function(channel) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.log("connect error: " + err);

        done();
      }

      client.query('SELECT * FROM twitch_streams', function(err, result) {
        if (err) {
          console.log("PG Error: " + err);
        } else {
          result['rows'].forEach(function(row) {
            const streamName = row['name'];
            const message = "https://www.twitch.com/" + streamName + " is now online!";
            const url = "https://api.twitch.tv/kraken/streams/" + streamName;

            request({
              headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
              uri: url
            }, function(error, response, body) {
              const message = "https://www.twitch.com/" + streamName + " is now online!";
              const streamDetails = body["stream"];

              if (!streamDetails && row['online']) {
                client.query("UPDATE twitch_streams SET online = false WHERE name = '" + streamName + "'", function(err, result) {
                  done();
                });
              } else if (streamDetails && !row['online']) {
                client.query("UPDATE twitch_streams SET online = true WHERE name = '" + streamName + "'", function(err, result) {
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

  // addTwitchChannel: function(channelName) {
  //   const url = 'https://api.twitch.tv/kraken/channels/' + channelName;

  //   request({
  //     headers: { "Client-ID": process.env.TWITCH_CLIENT_ID },
  //     uri: url
  //   }, function(error, response, body) {
  //     if (response['status'] == 404) {
  //       // send error
  //       // return
  //     } else {
  //       pg.connect(process.env.DATABASE_URL, function(err, client, done) {
  //         client.query("INSERT into twitch_streams")
  //       });
  //     }
  //   })
  // },
}
