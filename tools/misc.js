var request = require('request')

module.exports = {
  getDog: function() {
    const url = "http://reddit.com/r/dogpictures.json?limit=100&type=link"

    return new Promise(function(resolve, reject) {
      request(url, function(error, response, body) {
        const rand = Math.floor((Math.random() * 100) + 1);

        resolve(JSON.parse(body)['data']['children'][rand]['data']['preview']['images'][0]['source']['url']);
      });
    });
  },

  pickOption: function(text) {
    return new Promise(function(resolve, reject) {
      const options = text.slice(5).split(",");
      const rand = Math.floor((Math.random() * options.length));

      resolve(options[rand]);
    });
  },

  playRoulette: function() {
    return new Promise(function(resolve, reject) {
      const rand = Math.floor(Math.random() * 6);

      resolve(rand === 0 ? ':boom: :gun: You\'re dead' : 'You live.... for now.');
    });
  },

  rollDice: function(text) {
    return new Promise(function(resolve, reject) {
      const splitText = text.split(' ');
      var diceText, roll, rolls = [];
      var numDice = 1;
      var diceType = 20;
      var sum = 0;
      var response;

      if (splitText.length >= 2) {
        if (splitText[1].match(/^(\d*)[d](\d+)$/)) {
          diceText = splitText[1].split('d');

          if (diceText[0]) {
            numDice = parseInt(diceText[0]);
          }

          diceType = parseInt(diceText[1]);
        } else {
          response = "I don't think I can roll that.";
        }
      }

      if (numDice > 1000) {
        response = "Chill with all the dice.";
      }

      for (var i = 0; i < numDice; i++) {
        roll = Math.floor((Math.random() * diceType) + 1)
        rolls.push(roll);
        sum += roll;
      }

      response = "*" + sum.toString() + "*" + "\n[" + rolls.toString() + "]";

      resolve(response);
    });
  },

  getWeather: function() {
    return new Promise(function(resolve, reject) {
      const url = "http://api.wunderground.com/api/" + process.env.WUNDERGROUND_TOKEN + "/forecast/q/MA/Boston.json";
      var message = '```date         | high | low | conditions \n----------------------------------------------\n';

      request(url, function(error, response, body) {
        const weatherDays = JSON.parse(body)['forecast']['simpleforecast']['forecastday'];

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

          message = message.concat(dateText + '|' + highText + '|' + lowText + '|' + conditionsText + '\n');
        });

        message = message.concat('```');

        resolve(message);
      });
    });
  },
}
