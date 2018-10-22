const Twitter = require('twitter');

const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET_KEY,
  bearer_token: process.env.TWITTER_BEARER_TOKEN
});

function getPuzzle() {
  return new Promise(function(resolve, reject) {
    twitterClient.get('statuses/user_timeline', {
      screen_name: 'pzlr',
      exclude_replies: true,
      trim_user: true,
      include_rts: false
    }, function(error, tweets, response) {
      if (error) {
        return reject(error);
      }

      const puzzles = tweets.filter((tweet) => {
        return tweet['text'].substring(0, 2) === 'Q:';
      });

      return resolve(puzzles[0]['entities']['urls'][0]['url']);
    });
  });
}

module.exports = {
  getPuzzle: getPuzzle
};
