var gloData;

function onload() {

  var socket = io();
  socket.emit('checkLoginIsPossible');


  //sign
  var signDiv = document.getElementById('signDiv');
  var signDivUsername = document.getElementById('signDiv-username');
  var signDivSignIn = document.getElementById('signDiv-signIn');
  var signDivSignUp = document.getElementById('signDiv-signUp');
  var signDivPassword = document.getElementById('signDiv-password');

  socket.on('checkLoginIsPossibleAnswer', function(data) {
    if (data == false) {
      gloData = data;
      alert('Das Spiel wurde bereits gestartet');
      signDivSignIn.disabled = true;
      signDivSignUp.disabled = true;
    }
  });

  //@Kevin: Durch anklicken des Buttons signDivSignIn wird die Funktion signIn auf dem Server aufgerufen und die Feldwerte übergeben
  signDivSignIn.onclick = function() {
    socket.emit('signIn', {
      username: signDivUsername.value,
      password: signDivPassword.value
    });
  }
  //@Kevin: Durch anklicken des Buttons signDivSignUp wird die Funktion signUp auf dem Server aufgerufen und die Feldwerte übergeben
  signDivSignUp.onclick = function() {
    socket.emit('signUp', {
      username: signDivUsername.value,
      password: signDivPassword.value
    });
  }

  //@Kevin: Wird vom Server (signIn) aufgerufen und leitet im Erfolgsfall auf die Lobbyseite weiter
  socket.on('signInResponse', function(data) {
    if (data.success) {
      window.location = "game.html";
    } else if (data.succes == 'alreadyInGame') {
      alert('Sie sind bereits eingeloggt')
    } else {
      alert("Überprüfen Sie Ihr Passwort");
    }
  });
  // socket.on('signInResponse2', function (){
  //   alert ('Sie sind bereits eingeloggt')
  // });

  //@Kevin: Wird vom Server (signUp) aufgerufen und gibt das Ergebnis aus
  socket.on('signUpResponse', function(data) {
    if (data.success) {
      alert("Registrierung erfolgreich.");
    } else
      alert("Registrierung fehlgeschlagen.");
  });

  const dialog = document.getElementById("dialog");

  document.getElementById("show-modal-dialog").addEventListener("click", () => {
    dialog.showModal();
  });

  document.getElementById("close-dialog").addEventListener("click", () => {
    dialog.close();
  });

  if (document.getElementById("datenschutzZustimmung").checked != true) {
    signDivSignIn.disabled = true;
    signDivSignUp.disabled = true;
  }
}

function showHideButton(datenschutzZustimmung) {

  var signDivSignIn = document.getElementById("signDiv-signIn");
  var signDivSignUp = document.getElementById("signDiv-signUp");

  if (gloData != false) {
    signDivSignIn.disabled = datenschutzZustimmung.checked ? false : true;
    signDivSignUp.disabled = datenschutzZustimmung.checked ? false : true;
  }
}