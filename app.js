var mongojs = require("mongojs")
// Use environment variable for MongoDB connection, fallback to localhost for local development
var mongoUri = process.env.MONGODB_URI || 'localhost:27017/myGame';
var db = mongojs(mongoUri, ['account']);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

app.use(express.static('public'));

app.use(express.static('client'));


serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};

var players = [];
var enterGamePossible = true;
var victims = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var lastVictim;
var counter = 0;
var playerID = 0;
var newCardID = 8;
var poison = true;
var heal = true;
var winner;

var Entity = function() {
  var self = {
    username: "username",
    role: "role",
    alive: true,
    id: "",
  }
  return self;
}

var Player = function(id, data) {
  var self = Entity();
  self.id = playerID;
  playerID++;
  self.username = data.username;
  self.role = "Villager";
  self.socketID = '';

  Player.list[id] = self;
  players.push(self);
  return self;
}
Player.list = {};
Player.onConnect = function(socket, username) {
  var player = Player(socket.id, username);
}
Player.onDisconnect = function(socket) {
  delete Player.list[socket.id];
  for (i = 0; i < players.length; i++) {
    if (players[i].socketID === socket.id) {
      console.log(players[i].username + ' disconnected');
      io.emit('deletePlayerFromCard', players[i].username, newCardID);
      newCardID++
      players.splice(i, 1);

    }
  }
}

var DEBUG = true;

var isValidPassword = function(data, cb) {
  db.account.find({
    username: data.username,
    password: data.password
  }, function(err, res) {
    if (res.length > 0)
      cb(true);
    else
      cb(false);
  });
}
var isUsernameTaken = function(data, cb) {
  db.account.find({
    username: data.username
  }, function(err, res) {
    if (res.length > 0)
      cb(true);
    else
      cb(false);
  });
}
var addUser = function(data, cb) {
  db.account.insert({
    username: data.username,
    password: data.password
  }, function(err) {
    cb();
  });
}
var inGame = 0;

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
  socket.id = Math.random();
  socket.username = "";
  SOCKET_LIST[socket.id] = socket;

  socket.on('signIn', function(data) {
    isValidPassword(data, function(res) {
      var firstUsername = true;
      for (i = 0; i < players.length; i++) {
        if (players[i].username === data.username) {
          firstUsername = false;
        }
      }
      if (firstUsername === false) {
        socket.emit('signInResponse', {
          succes: 'alreadyInGame'
        });
      } else if (res) {
        Player.onConnect(socket, data);
        socket.username = data.username;
        console.log(data.username + " connected");
        console.log(players);
        socket.emit('signInResponse', {
          success: true
        });
        if (players.length >= 8) {
          enterGamePossible = false;
          setTimeout(function() {
            io.emit('checkLoginIsPossibleAnswer', false);
          }, 1000);
        }
      } else {
        socket.emit('signInResponse', {
          success: false
        });
      }
    });
  });

  socket.on('testString', function() {
    console.log("Test String");
  });
  socket.on('signUp', function(data) {
    isUsernameTaken(data, function(res) {
      if (res) {
        socket.emit('signUpResponse', {
          success: false
        });
      } else {
        addUser(data, function() {
          socket.emit('signUpResponse', {
            success: true
          });
        });
      }
    });
  });
  socket.on('checkLoginIsPossible', function() {
    socket.emit('checkLoginIsPossibleAnswer', enterGamePossible);
  });
  socket.on('loadPlayers', function() {
    socket.emit('connectToLobby', players);
    io.emit('updatePlayer', players);
  });
  socket.on('updateSocket', function(data) {
    socket.username = data;
    for (i = 0; i < players.length; i++) {
      if (players[i].username === data) {
        if (players[i].socketID === '') {
          players[i].socketID = socket.id;
        }
      }
    }
  });

  // Keine neuen Spieler können sich in das Spiel einloggen.
  // Für alle Rollen wird die Funktion shuffleCards aufgerufen
  // Die Anzahl an Werwölfen wird so ermittelt, dass pro 4 Spielern ein Werwolf erzeugt wird
  socket.on('enterGame', function() {
    var numberVilkolakis = Math.round(players.length / 4);
    enterGamePossible = false;
    io.emit('checkLoginIsPossibleAnswer', false);
    shuffleCards(numberVilkolakis, 'Vilkolakis');
    shuffleCards(1, 'Witch');
    shuffleCards(1, 'Hunter')
    console.log(players);
    io.emit('renderGame', players);
    io.emit('gameMasterAudio', 'night');
    io.emit('setDayOrNight', 'night', players);
    setTimeout(function() {
      gameMaster('night');
    }, 5000);
  });

  // Für jede Karte einer Rolle die zugeordnet werden soll
  // wird zufällig ein Spieler ausgewählt. Hat der Spieler
  // die Rolle Villager bekommt er die neue Rolle, ansonsten
  // wird ein neuer Spieler ausgewählt.
  function shuffleCards(number, role) {
    for (var i = 0; i < number; i++) {
      var choosePlayer = Math.floor((Math.random() * players.length));
      if (players[choosePlayer].role === 'Villager') {
        players[choosePlayer].role = role;
      } else {
        i = i - 1;
      }
    }
  }

  // Über den Spielleiter werden Tag und Nacht sowie die
  // Dorfabstimmung oder die Werwolfabstimmung aufgerufen.
  // Ist das Spiel zu Ende wird der Sieger ermittelt.
  socket.on('gameMaster', gameMaster = function(data) {
    var data
    console.log(data);
    switch (data) {
      case 'night':
        io.emit('setDayOrNight', 'night', players);
        io.emit('chooseVictim', players, 'night', '', heal, poison);
        io.emit('gameMasterAudio', 'kill');
        break;
      case 'day':
        io.emit('setDayOrNight', 'day', players);
        io.emit('chooseVictim', players, 'day', '', heal, poison);
        io.emit('gameMasterAudio', 'vote');
        break;
      case 'endGame':
        enterGamePossible = true;
        lastVictim;
        playerID = 0;
        newCardID = 8;
        poison = true;
        heal = true;
        var countVilkolakis = 0;
        var countVillager = 0;
        for (i = 0; i < players.length; i++) {
          if (players[i].role === 'Vilkolakis' && players[i].alive) {
            countVilkolakis++;
          }
          if (players[i].alive === true) {
            countVillager++;
          }
        }
        if (countVilkolakis === 0 && countVillager === 0) {
          console.log('Niemand');
          winner = 'none';
          io.emit('endGame', 'none');
        } else if (countVilkolakis === countVillager) {
          console.log('Werwolf');
          winner = 'vilkolakis';
          io.emit('endGame', 'vilkolakis');
          io.emit('gameMasterAudio', 'vilkolakisWin');
        } else {
          winner = 'villagers';
          io.emit('endGame', 'villagers');
          io.emit('gameMasterAudio', 'villagerWin');
        }
        break;
    }
  });

  // Ist Nacht wird der chatText nur an die Werwölfe gesendet
  socket.on('verifyVilkolakis', function(username, data) {
    for (var i = 0; i < players.length; i++) {
      if (players[i].username === username && players[i].role === 'Vilkolakis') {
        socket.emit('addToNightChat', data);
      }
    }
  });

  // Bei Abstimmungen wird ausgewertet welcher Spieler die meisten Stimmen bekommen hat.
  // Ist das Ergebnis unentschieden wird das Opfer durch Zufall bestimmt.
  socket.on('evaluation', function(rightToVote, passiveSuffrage, source, victim) {
    counter++;
    for (i = 0; i < passiveSuffrage.length; i++) {
      if (victim === passiveSuffrage[i]) {
        victims[i]++;
        console.log(victims);
        if (counter === rightToVote.length) {
          console.log('fang an zu zahelen');
          var currentMost = 0;
          for (j = 0; j < victims.length; j++) {
            if (currentMost <= victims[j]) {
              currentMost = victims[j];
              console.log(currentMost);
            }
          }
          for (k = 0; k < victims.length; k++) {
            if (victims[k] === currentMost) {
              var currentMostPlayer = [];
              currentMostPlayer.push(passiveSuffrage[k]);
              console.log(currentMostPlayer);
              var setDeath = Math.floor((Math.random() * currentMostPlayer.length));
              lastVictim = currentMostPlayer[setDeath];
              console.log(lastVictim);

              victims = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              counter = 0;
              if (source === 'night') {
                var witchIsNotAlive = true;
                console.log(source);
                for (l = 0; l < players.length; l++) {
                  if (players[l].role === 'Witch' && players[l].alive) {
                    witchIsNotAlive = false;
                    io.emit('chooseVictim', players, 'witch', lastVictim, heal, poison);
                    io.emit('gameMasterAudio', 'witch');
                  }
                }
                if (witchIsNotAlive) {
                  for (l = 0; l < players.length; l++) {
                    if (players[l].username === currentMostPlayer[setDeath]) {
                      killedPlayers = [];
                      killedPlayers.push(players[l]);
                      killPlayer(killedPlayers, 'day');
                    }
                  }
                }
              } else if (source === 'day') {
                for (l = 0; l < players.length; l++) {
                  if (players[l].username === currentMostPlayer[setDeath]) {
                    io.emit('gameMasterAudio', 'voteEnd');
                    killedPlayers = [];
                    killedPlayers.push(players[l]);
                    setTimeout(function() {
                      killPlayer(killedPlayers, 'night');
                    }, 5000);
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Aktualisierung der Trankbestände der Hexe
  socket.on('evaluationWitch', evaluationWitch = function(newheal, newpoison) {
    heal = newheal;
    poison = newpoison;
  });

  // Bei Spielern die Sterben sollen wird das Attribut alive auf false gesetzt.
  // Ist das Opfer der Jäger, wird eine Funktion aufgerufen, mit der er erneut jemanden töten kann.
  socket.on('killPlayer', killPlayer = function(player, target, source) {
    console.log(player);
    var countVilkolakis = 0;
    var countVillager = 0;
    var noHunter = true;
    for (h = 0; h < player.length; h++) {
      console.log(player[h]);
      for (i = 0; i < players.length; i++) {
        if (player[h].username === players[i].username) {
          players[i].alive = false;
          console.log(players[i]);
          io.emit('setNotAlive', player[h]);
          if (players[i].role === 'Hunter') {
            noHunter = false;
          }
        }
      }
    }
    if (noHunter) {
      console.log('noHunter')
      for (j = 0; j < players.length; j++) {
        if (players[j].role === 'Vilkolakis' && players[j].alive === true) {
          countVilkolakis++;
        }
        if (players[j].alive === true) {
          countVillager++;
        }
      }
      if (countVilkolakis === 0) {
        gameMaster('endGame');
      } else if (countVilkolakis === countVillager) {
        gameMaster('endGame');
      } else {
        io.emit('setDayOrNight', target, players);
        if (source !== 'hunter') {
          io.emit('gameMasterAudio', target);
        } else if (target === 'night') {
          io.emit('gameMasterAudio', target);
        }
      }
      setTimeout(function() {
        gameMaster(target);
      }, 5000);
    } else {
      io.emit('setDayOrNight', 'day', players);
      io.emit('chooseVictim', players, 'hunter', '', heal, poison, target);
      if (target === 'day') {
        io.emit('gameMasterAudio', 'day');
        setTimeout(function() {
          io.emit('gameMasterAudio', 'hunter');
        }, 5000);
      } else {
        io.emit('gameMasterAudio', 'hunter');
      }
    }
  });

  socket.on('triggerGameMaster', function(data) {
    io.emit('gameMasterAudio', data);
  });
  socket.on('triggerSetDayOrNight', function(data) {
    io.emit('setDayOrNight', data, players);
  });
  socket.on('disconnect', function() {
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
  });
  socket.on('sendMsgToServer', function(data, username) {
    var playerName = ("" + username);
    io.emit('addToChat', playerName + ': ' + data);
  });

  socket.on('gameMasterMsgToServer', function(data) {
    io.emit('addToGameMasterChat', data);
  });

  socket.on('getWinner', function() {
    socket.emit('renderEnd', winner);
  });


  socket.on('evalServer', function(data) {
    if (!DEBUG)
      return;
    var res = eval(data);
    socket.emit('evalAnswer', res);
  });
});