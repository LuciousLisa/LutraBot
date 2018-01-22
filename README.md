LutraBot
========

Very simple chatbot to facilitate chat relay between Mixer and Twitch. Supports
some custom commands.

Required packages
-----------------

Must have a working NodeJS and NPM environment.

This can be as simple as installing npm with your package manager:

`# apt-get install npm`

Installation
------------

`$ npm install` then `$ npm start`

Configuration
-------------

The following items can be configured in `config.json`:

### Twitch

| Item                 | Data type | Use                                                                                                     |
| -------------------- |:---------:| -------------------------------------------------------------------------------------------------------:|
| clientID             | String    | Used to identify your [application](https://www.twitch.tv/settings/connections) to the API. Can be null |
| debug                | Boolean   | Show debug messages in console                                                                          |
| cluster              | String    | Server cluster to connect to                                                                            |
| reconnect            | Boolean   | Reconnect to Twitch when disconnected from the server                                                   |
| maxReconnectAttempts | Integer   | Max number of reconnection attempts                                                                     |
| maxReconnectInterval | Integer   | Max number of ms to delay a reconnection                                                                |
| reconnectDecay       | Integer   | The rate of increase of the reconnect delay                                                             |
| reconnectInterval    | Integer   | Number of ms before attempting to reconnect                                                             |
| secure               | Boolean   | Use secure connection (SSL / HTTPS                                                                      |
| timeout              | Integer   | Number of ms to disconnect if no responses from the server                                              |
| username             | String    | Bot's username on Twitch                                                                                |
| oauth                | String    | [OAuth password](http://twitchapps.com/tmi/) on Twitch                                                  |
| channels             | Array     | Channel on Twitch IRC. Should only contain one channel                                                  |

### Mixer

| Item        | Data type | Use                     |
| ----------- |:---------:| -----------------------:|
| accesstoken | String    | Access token on Mixer   |
| username    | Boolean   | Bot's username on Mixer |

### Dark Souls

| Item   | Data type | Use                       |
| ------ |:---------:| -------------------------:|
| deaths | String    | Amount of recorded deaths |

Supported commands
------------------

| Command | Use                              |
| ------  | --------------------------------:|
| +death  | Increases the death count by one |
| -death  | Decreases the death count by one |
