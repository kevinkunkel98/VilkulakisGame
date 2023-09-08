var socket = io();

var chatForm = document.getElementById('RightCol');
var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');

var nightAudio = new Audio('media/audios/night.mp3');
var dayAudio = new Audio('media/audios/day.mp3');
var dayNoDeadAudio = new Audio('media/audios/dayNoDead.mp3');
var voteAudio = new Audio('media/audios/vote.mp3');
var voteEndAudio = new Audio('media/audios/voteResult.mp3');
var killAudio = new Audio('media/audios/kill.mp3');
var hunterAudio = new Audio('media/audios/hunter.mp3');
var witchAudio = new Audio('media/audios/witch.mp3');

socket.username = "leer";
var newVictim;
var night = false;

function loadPlayer() {
  socket.emit('loadPlayers');
}

// Beim laden der Seite wird der eigene Username in die Navbar geschrieben.
socket.on('connectToLobby', function(players) {
  socket.username = players[players.length - 1].username;
  document.getElementById('navbar').innerHTML = socket.username;
  for (var i = 0; i < players.length - 1; i++) {
    createPlayerCard(players[i]);
  }
  console.log(socket.username + " joined lobby");
  socket.emit('updateSocket', socket.username);
});

socket.on('updatePlayer', function(players) {
  createPlayerCard(players[players.length - 1]);
  // Ab einer Spieleranzahl von 3 wird der Startbutton aktiv
  if (players.length >= 3) {
    document.getElementById("startGame").disabled = false;
  }
});

// Für jeden Spieler werden Spielerkarten sichtbar und der Spielername
// wird in die Karte geschrieben.
function createPlayerCard(player) {
  try {
    document.getElementById(player.id).innerHTML = player.username;
    document.getElementById(player.id).id = player.username;
    document.getElementById(player.username).className = 'setID';
    document.getElementById(player.username).parentElement.parentElement.style.display = 'initial';
  } catch {
    var z = true;
    for (i = 0; i < player.id; i++) {
      try {
        if (z) {
          document.getElementById(i).innerHTML = player.username;
          document.getElementById(i).id = player.username;
          document.getElementById(player.username).className = 'setID';
          document.getElementById(player.username).parentElement.parentElement.style.display = 'initial';
          z = false;
        }
      } catch {}
    }
  }
}

// Ist ein Spieler nicht mehr mit dem Server verbunden, wird der Name des Spielers
// gelöscht und die Karte wieder ausgeblendet.
socket.on('deletePlayerFromCard', function(player, newID) {
  document.getElementById(player).innerHTML = '';
  document.getElementById(player).id = newID;
  document.getElementById(newID).parentElement.parentElement.style.display = 'none';

})

function enterGame() {
  socket.emit('enterGame');
}

// Der jeder Spieler bekommt abhängig von seiner Rolle ein Rollenbild angezeigt.
// Der Startbutton wird ausgeblendet.
// Zusätzlich werden bei einem Spieler mit der Rolle Werwolf die Spielerkarten aller Werwölfe um die Klasse 'Vilkolakis' erweitert.
// Ist der Spieler Hexe werden zusätzlich die divs für die Hexenaktionen erzeugt.
socket.on('renderGame', function(players) {
  document.getElementById('startGame').style.display = 'none';
  for (i = 0; i < players.length; i++) {
    if (players[i].username === socket.username) {
      switch (players[i].role) {
        case 'Villager':
          document.getElementById('rolepic').style.background = "url('css/images/villager.png')"
          console.log('Dorfbewohner');
          break;
        case 'Vilkolakis':
          document.getElementById('rolepic').style.background = "url('css/images/wolfi.png')"
          for (j = 0; j < players.length; j++) {
            if (players[j].role === 'Vilkolakis') {
              document.getElementById(players[j].username).classList.add('Vilkolakis');
            }
          }
          console.log('Werwolf');
          break;
        case 'Witch':
          console.log('Hexe')
          document.getElementById('rolepic').style.background = "url('css/images/witch.png')"
          var button = document.createElement("div");
          button.id = 'poison';
          button.className = 'setID'
          document.getElementById('inline').appendChild(button);
          var button = document.createElement("div");
          button.id = 'heal';
          button.className = 'setID'
          document.getElementById('inline').appendChild(button);
          var button = document.createElement("div");
          button.id = 'ok';
          button.className = 'setID'
          document.getElementById('inline').appendChild(button);
          break;
        case 'Hunter':
          document.getElementById('rolepic').style.background = "url('css/images/hunter.png')"
          console.log('Jäger');
          break;
      }
      document.getElementById('rolepic').style.backgroundSize = '100% 100%'
    }
  }
});

// Der Hintergrund, der Balken und die Kartenrückseiten der
// lebenden Spieler werden abhängig von Tag und Nacht verändert
socket.on('setDayOrNight', function(target, players) {
  document.getElementById('body').className = target;
  if (target === 'night') {
    night = true;
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundImage = 'url(css/images/Nacht.jpg)';
    document.getElementsByClassName('woodSignImage')[0].src = 'css/images/woodNight.png';
    for (i = 0; i < players.length; i++) {
      if (players[i].alive) {
        document.getElementById(players[i].username).parentNode.style.background = "url('css/images/CardNight.png')";
        document.getElementById(players[i].username).parentNode.style.backgroundSize = '100% 100%';
      }
    }
  } else {
    night = false;
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundImage = 'url(css/images/Tag.jpg)';
    document.getElementsByClassName('woodsign')[0].src = 'css/wood.png';
    for (i = 0; i < players.length; i++) {
      if (players[i].alive) {
        document.getElementById(players[i].username).parentNode.style.background = "url('css/images/Card.png')";
        document.getElementById(players[i].username).parentNode.style.backgroundSize = '100% 100%';
      }
    }
  }
});

// Funktion für jeder Spieleraktivität. Abhängig von der Situation wird
// überprüft welche Spieler die Aktion durchführen können und welche Divs
// angeklickt werden können. Was mit dem Ergebnis passiert ist ebenfalls
// abhängig von der Situation.
socket.on('chooseVictim', chooseVictim = function(players, source, lastVictim, heal, poison, target) {
  var rightToVote = [];
  var passiveSuffrage = [];
  var victim;
  switch (source) {
    case 'night':
      for (i = 0; i < players.length; i++) {
        if (players[i].role === "Vilkolakis" && players[i].alive === true) {
          rightToVote.push(players[i].username);
        }
        if (players[i].alive) {
          passiveSuffrage.push(players[i].username);
        }
      }
      break;
    case 'day':
      for (i = 0; i < players.length; i++) {
        if (players[i].alive) {
          passiveSuffrage.push(players[i].username);
          rightToVote.push(players[i].username);
        }
      }
      break;
    case 'witch':
      for (l = 0; l < players.length; l++) {
        if (players[l].username === socket.username) {
          if (players[l].role === 'Witch' && players[l].alive) {
            rightToVote.push(players[l].username);
            try {
              document.getElementById(lastVictim).classList.add('killedByVilkolakis');
            } catch {}
            if (poison) {
              passiveSuffrage.push('poison');
            }
            if (heal) {
              passiveSuffrage.push('heal');
            }
            passiveSuffrage.push('ok');
          }
        }
      }
      break;
    case 'hunter':
      for (j = 0; j < players.length; j++) {
        if (players[j].alive) {
          passiveSuffrage.push(players[j].username);
        }
        if (players[j].role === 'Hunter') {
          rightToVote.push(players[j].username);
        }
      }
      break;
    case 'witchPoison':
      for (i = 0; i < players.length; i++) {
        if (players[i].role === 'Witch') {
          rightToVote.push(players[i].username);
        }
        if (players[i].alive === true) {
          passiveSuffrage.push(players[i].username);
        }
      }
      break;
  }
  for (j = 0; j < rightToVote.length; j++) {
    if (socket.username === rightToVote[j]) {
      console.log(rightToVote);
      console.log(passiveSuffrage);
      for (i = 0; i < passiveSuffrage.length; i++) {
        var player = passiveSuffrage[i];
        document.getElementById(player).classList.add('active');
        document.getElementById(player).addEventListener('click', onClick);
      }
    }
  }

  function onClick(ev) {
    for (j = 0; j < ev.path.length; j++) {
      try {
        var test1 = ev.path[j].className.search("setID");
      } catch {}

      if (test1 === 0) {
        console.log(ev.path[j].id);
        victim = ev.path[j].id;


        switch (source) {
          case 'day':
            socket.emit('evaluation', rightToVote, passiveSuffrage, source, victim);
            socket.emit('gameMasterMsgToServer', socket.username + " wählte " + victim + ".", socket.username);
            onClickAnswer();
            break;
          case 'night':
            socket.emit('evaluation', rightToVote, passiveSuffrage, source, victim);
            onClickAnswer();
            break;
          case 'witch':
            killedPlayers = [];
            if (victim === 'poison') {
              chooseVictim(players, 'witchPoison', lastVictim, heal, false, target);
              onClickAnswer();
            } else if (victim === 'heal') {
              heal = false;
              document.getElementById(lastVictim).classList.remove('killedByVilkolakis');
              lastVictim = '';
              document.getElementById('heal').classList.add('disabled');
              chooseVictim(players, 'witch', lastVictim, false, poison, target);
              onClickAnswer();
            } else if (victim === 'ok') {
              socket.emit('evaluationWitch', heal, poison);
              var kill = true;
              for (i = 0; i < players.length; i++) {
                if (players[i].username === lastVictim) {
                  killedPlayers.push(players[i]);
                  kill = false;
                } else if (players[i].username === newVictim) {
                  killedPlayers.push(players[i]);
                  kill = false;
                }
              }
              try {
                document.getElementById(lastVictim).classList.remove('killedByVilkolakis');
              } catch {}


              if (kill) {
                socket.emit('triggerGameMaster', 'dayNoDead');
                socket.emit('triggerSetDayOrNight', 'day')
                setTimeout(function() {
                  socket.emit('gameMaster', 'day');
                }, 5000);
              } else {
                socket.emit('killPlayer', killedPlayers, 'day');
              }
            }
            onClickAnswer();
            break;
          case 'hunter':
            for (l = 0; l < players.length; l++) {
              if (victim === players[l].username) {
                killedPlayers = [];
                killedPlayers.push(players[l])
                socket.emit('killPlayer', killedPlayers, target, 'hunter');
              }
            }
            onClickAnswer();
            break;
          case 'witchPoison':
            newVictim = victim;
            document.getElementById('poison').classList.add('disabled');
            chooseVictim(players, 'witch', lastVictim, heal, false, target);
            onClickAnswer();
            break;
        }
      }
    }
  }

  function onClickAnswer() {
    for (k = 0; k < passiveSuffrage.length; k++) {
      var player = passiveSuffrage[k]
      document.getElementById(player).classList.remove('active');
      document.getElementById(player).removeEventListener('click', onClick);
    }
  }
});

// Dass ein Spieler gestorben ist wird grafisch dargestellt.
// Der Spieler bekommt die Klasse notAlive und seine Rollenkarte wird angezeigt.
socket.on('setNotAlive', function(player) {
  console.log(player.username + ' ist gestorben');
  document.getElementById(player.username).classList.add('notAlive');
  switch (player.role) {
    case 'Villager':
      document.getElementById(player.username).parentNode.style.background = "url('css/images/villagerXX.jpg')"
      break;
    case 'Vilkolakis':
      source = 'css/images/vilkolakisXX.jpg'
      document.getElementById(player.username).parentNode.style.background = "url('css/images/vilkolakisXX.jpg')"
      break;
    case 'Witch':
      source = 'css/images/witchXX.jpg'
      document.getElementById(player.username).parentNode.style.background = "url('css/images/witchXX.jpg')"
      break;
    case 'Hunter':
      source = 'css/images/hunterXX.jpg'
      document.getElementById(player.username).parentNode.style.background = "url('css/images/hunterXX.jpg')"
      break;
  }
  document.getElementById(player.username).parentNode.style.backgroundSize = '100% 100%';
  chatInput.style.display = "none";
});

// Ist das Spiel zu Ende wird auf den Endscreen weitergeleitet
socket.on('endGame', function(data) {
  switch (data) {
    case 'vilkolakis':
      window.location = "end.html";
      break;
    case 'villagers':
      window.location = "end2.html";
      break;
    default:
      window.location = "end3.html";
  }
});

//Chat
//@Kevin
chatForm.onsubmit = function(e) {
  e.preventDefault();
  if (chatInput.value[0] === '/')
    socket.emit('evalServer', chatInput.value.slice(1));
  else
    socket.emit('sendMsgToServer', chatInput.value, socket.username);
  chatInput.value = '';
}

socket.on('addToChat', function(data) {
  if (night === false) {
    chatText.innerHTML += '<div>' + data + '</div>';
    chatText.scrollTop = chatText.scrollHeight;
  } else {
    socket.emit('verifyVilkolakis', socket.username, data);
  }
});

socket.on('addToNightChat', function(data) {
  chatText.innerHTML += '<div style="color:red">' + data + '</div>';
  chatText.scrollTop = chatText.scrollHeight;
});
socket.on('addToGameMasterChat', function(data) {
  chatText.innerHTML += '<div style="color:yellow">' + data + '</div>';
  chatText.scrollTop = chatText.scrollHeight;
});

// Abhängig von der Situation wird ein Audio abgespielt.
socket.on('gameMasterAudio', function(data) {
  switch (data) {
    case 'night':
      nightAudio.play();
      break;
    case 'day':
      dayAudio.play();
      break;
    case 'kill':
      killAudio.play();
      break;
    case 'vote':
      voteAudio.play();
      break;
    case 'voteEnd':
      voteEndAudio.play();
      break;
    case 'hunter':
      hunterAudio.play();
      break;
    case 'witch':
      witchAudio.play();
      break;
    case 'dayNoDead':
      dayNoDeadAudio.play();
      break;
    default:
      console.log('Hi');
  }
});