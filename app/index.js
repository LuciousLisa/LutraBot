/*
 * Copyright (c) 2015-2018 Patrick Godschalk All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

// Load config from JSON file
const config = require('./config.json');
const tmi = require('tmi.js');
const Mixer = require('beam-client-node');
const ws = require('ws');

// Twitch configuration
// Do not edit here, edit the configuration variables in config.json instead
var twitchOptions = {
  options: {
    clientId: config.twitch.options.clientId,
    debug: config.twitch.options.debug
  },
  connection: {
    cluster: config.twitch.connection.cluster,
    reconnect: config.twitch.connection.reconnect,
    maxReconnectAttempts: config.twitch.connection.maxReconnectAttempts,
    maxReconnectInterval: config.twitch.connection.maxReconnectInterval,
    reconnectDecay: config.twitch.connection.reconnectDecay,
    reconnectInterval: config.twitch.connection.reconnectInterval,
    secure: config.twitch.connection.secure,
    timeout: config.twitch.connection.timeout
  },
  identity: {
    username: config.twitch.identity.username,
    password: config.twitch.identity.oauth
  },
  channels: config.twitch.channels
}

// Dark Souls configuration
var dsDeaths = config.darksouls.deaths;

// Init connection with Twitch IRC
// This is just setting up the actual pipe as a global variable, all of the
// application logic is handled in the Mixer flow so we can keep using the
// async promises provided there.
var twitch = new tmi.client(twitchOptions);
twitch.connect();

// Init Mixer
let userInfo;
const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

// Mixer configuration
client.use(new Mixer.OAuthProvider(client, {
  tokens: {
    access: config.mixer.accesstoken,
    expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
  }
}));

client.request('GET', `users/current`).then(response => {
  console.log(response.body);
  userInfo = response.body;
  return new Mixer.ChatService(client).join(response.body.channel.id);
}).then(response => {
  const body = response.body;
  console.log(body);
  return createChatSocket(userInfo.id, userInfo.channel.id, body.endpoints,
                          body.authkey)
}).catch(error => {
  console.error('Something went wrong.');
  console.error(error);
});

/**
 *
 * @param {*} userId
 * @param {*} channelId
 * @param {*} endpoints
 * @param {*} authkey
 */
function createChatSocket(userId, channelId, endpoints, authkey) {
  // Mixer chat connection
  const socket = new Mixer.Socket(ws, endpoints).boot();

  // Pick up any chat messages sent to Mixer
  socket.on('ChatMessage', data => {
    // Ignore self
    if (data.user_name == config.mixer.username) {
      return;
    }

    // Should not attempt to relay URL's
    if (data.message.message[0].data.includes('http://') //DevSkim: ignore DS137138
     || data.message.message[0].data.includes('https://')) {
       return;
     }

     // Relay message to Twitch
    twitch.say(config.twitch.channels[0], data.user_name + ': ' +
    data.message.message[0].data + ' [M]');

    // Custom commands for Mixer

    // !death
    // Shows the current death count.
    if (data.message.message[0].data == "!death") {
      twitch.say(config.twitch.channels[0], 'Ouch... Lisa has died ' + dsDeaths + ' times so far!');
      socket.call('msg', [`Ouch... Lisa has died ${dsDeaths} times so far!`]);
    }

    // !social
    // Displays social media message
    if (data.message.message[0].data == "!social") {
      twitch.say(config.twitch.channels[0], 'As far as social media goes, Lisa tries to stay away from them due to privacy concerns, but she’s still active on Twitter: https://twitter.com/SuperLisaa');
      socket.call('msg', [`As far as social media goes, Lisa tries to stay away from them due to privacy concerns, but she’s still active on Twitter: https://twitter.com/SuperLisaa`]);
    }

    // !trello
    // Displays Trello message
    if (data.message.message[0].data == "!trello") {
      twitch.say(config.twitch.channels[0], 'Considering the fact that Lisa’s a total goldfish, who forgets things within minutes on a bad day, she’s set up a tool to track her progress: https://trello.com/b/2LTNmEwf');
      socket.call('msg', [`Considering the fact that Lisa’s a total goldfish, who forgets things within minutes on a bad day, she’s set up a tool to track her progress: https://trello.com/b/2LTNmEwf`]);
    }
    
+    // !streams
+    // Displays streams message
+    if (data.message.message[0].data == "!streams") {
+      twitch.say(config.twitch.channels[0], 'In order to stream Dark Souls reliably from the Xbox, Lisa’s hacked together a bit of a franken-setup. She streams from Xbox to Mixer (https://mixer.com/luciouslisaa), then she records that stream from her browser into OBS, which in turn streams to Twitch (https://www.twitch.tv/superlisa). It’s a bit disgusting, but it works!');
+      socket.call('msg', [`In order to stream Dark Souls reliably from the Xbox, Lisa’s hacked together a bit of a franken-setup. She streams from Xbox to Mixer (https://mixer.com/luciouslisaa), then she records that stream from her browser into OBS, which in turn streams to Twitch (https://www.twitch.tv/superlisa). It’s a bit disgusting, but it works!`]);
+    }
  });

  // Pick up any chat messages sent to Twitch
  twitch.on('chat', function(channel, userstate, message, self) {
    // Ignore self
    if (self) {
      return;
    }

    // Relay message to Mixer
    socket.call('msg', [`${userstate.username}: ${message} [T]`]);

    // Custom commands for Twitch

    // !death
    // Shows the current death count.
    if (message == "!death") {
      twitch.say(config.twitch.channels[0], 'Ouch... Lisa has died ' + dsDeaths + ' times so far!');
      socket.call('msg', [`Ouch... Lisa has died ${dsDeaths} times so far!`]);
    }

    // !social
    // Displays social media message
    if (message == "!social") {
      twitch.say(config.twitch.channels[0], 'As far as social media goes, Lisa tries to stay away from them due to privacy concerns, but she’s still active on Twitter: https://twitter.com/SuperLisaa');
      socket.call('msg', [`As far as social media goes, Lisa tries to stay away from them due to privacy concerns, but she’s still active on Twitter: https://twitter.com/SuperLisaa`]);
    }

    // !trello
    // Displays Trello message
    if (message == "!trello") {
      twitch.say(config.twitch.channels[0], 'Considering the fact that Lisa’s a total goldfish, who forgets things within minutes on a bad day, she’s set up a tool to track her progress: https://trello.com/b/2LTNmEwf');
      socket.call('msg', [`Considering the fact that Lisa’s a total goldfish, who forgets things within minutes on a bad day, she’s set up a tool to track her progress: https://trello.com/b/2LTNmEwf`]);
    }

    // +death
    // Increases death counter by one. This is only supported on Twitch, and
    // only from a mod. Increments the dsDeaths variable by one and relays
    // the current death count to both Mixer and Twitch.
    if (message == "+death" && userstate.mod == true) {
      dsDeaths++;
      twitch.say(config.twitch.channels[0], 'Ouch... Lisa has died ' + dsDeaths + ' times now!');
      socket.call('msg', [`Ouch... Lisa has died ${dsDeaths} times now!`]);
    }

    // -death
    // Decreases death counter by one. This is only supported on Twitch, and
    // only from a mod. Decrements the dsDeaths variable by one and relays
    // the corrected death count to both Mixer and Twitch.
    if (message == "-death" && userstate.mod == true) {
      dsDeaths--;
      twitch.say(config.twitch.channels[0], 'Made a mistake? Putting Lisa\'s death counter back to ' + dsDeaths);
      socket.call('msg', [`Made a mistake? Putting Lisa's death counter back to ${dsDeaths}`]);
    }
  });

  // Handle errors
  socket.on('error', error => {
    console.error('Socket error');
    console.error(error);
  });

  return socket.auth(channelId, userId, authkey).then(() => {
    console.log('Mixer login successful');
  });
}
