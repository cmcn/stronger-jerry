const Discord = require('discord.js');

module.exports = {
  discordClient: new Discord.Client({
    autoReconnect: true,
  }),
};

