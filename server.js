// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
const Player = require('./Player');
const Game = require('./Game');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(5000, function () {
  console.log('Starting server on port 5000');
});

let players = [];
let game;

io.on('connection', function (socket) {
  socket.on('addPlayer', function (data) {
    const player = new Player(data.name, socket.id);

    socket.on('meyerCreated', function () {
      players.push(player);
      socket.emit('iJoined', player)
      io.emit('playerJoined', players);
    })


  });


  // Called whenever a player willingly leaves
  socket.on('leave', function () {
    const leavingPlayer = game.players.find(player => {
      return player.socketId === socket.id;
    });

    game.removePlayer(leavingPlayer);
  });

  // Called whenever a player loses connection to the server
  socket.on('disconnect', function () {
    if (!game) {
      // If the game has not yet started, the disconnecting player should only be removed from the players array
      const index = players.findIndex(player => {return player.socketId === socket.id});
      players.splice(index, 1);
    } else {
      // If the game has started, the disconnecting player should be removed from the game instance
      const disconnectingPlayerIndex = game.players.findIndex(player => {
        return player.socketId === socket.id;
      });

      game.players.splice(disconnectingPlayerIndex, 1);

      io.emit('playerLeft', game.players)
    }
  });

  // Called whenever a player decides to start the game, with the currently connected players
  socket.on('start', function () {
    game = new Game(players);

    const nextPlayer = game.getCurrentPlayer();

    io.emit('newRound', {
      score: game.getGameState()
    });
    io.emit('gameStarting');
    // io.to(nextPlayer.socketId).emit('yourTurn');
    socket.emit('yourTurn');
  });

  // Called whenever a player requests a new roll from the server
  socket.on('roll', function () {
    io.to(socket.id).emit('returnRoll', game.rollDice());

  });


  // Called whenever a player decides to lift on the former player
  socket.on('lift', function () {
    const gameState = game.endRound();

    const nextPlayer = game.getCurrentPlayer();
    game.dice = '00';
    game.previousDice = '00';
    game.liedDice = '00';
    game.playerLied = false;

    gameState.players.filter(player => {
      if(player.lost === true){
        io.to(player.socketId).emit('youLost');
      }
    })
    io.emit('newRound', {
      score: game.getGameState(),
      loser: nextPlayer
    });
    io.to(nextPlayer.socketId).emit('yourTurn');

  });

  // Called whenever a player makes a new call
  // Game already knows from the previous roll, what was actually rolled
  //the game knows the pre role
  socket.on('call', function (data) {

    const callingPlayerIndex = game.players.findIndex(player => {
      return player.socketId === socket.id;
    });
    const sorted = game.sortDices(data[0], data[1]);

    game.isHigher(sorted)
    if (game.isHigherThan) {
      game.nextPlayer();
      const nextPlayer = game.getCurrentPlayer();

      const newData = {
        lastRoll: data,
        playerName: game.players[callingPlayerIndex].name
      };

      io.emit('playerCalled', newData);
      console.log('Player called', newData);

      io.to(nextPlayer.socketId).emit('yourTurn');
    } else {
      game.lostRound();
      const currentPlayer = game.getCurrentPlayer();
      game.dice = '00';
      game.previousDice = '00';
      game.liedDice = '00';
      game.playerLied = false;
      io.emit('newRound', {
        score: game.getGameState(),
        loser: currentPlayer
      });
      io.to(currentPlayer.socketId).emit('yourTurn');

    }
  });

  // Called whenever a player calls a lie
  socket.on('lie', function (data) {
    const callingPlayer = game.players.find(player => {
      return player.socketId === socket.id;
    });

    const idiot = game.setLied(data);
    console.log(idiot, data);

    if (!idiot) {
      io.to(callingPlayer.socketId).emit('badLiar');
    } else {
      console.log({
        data,
        fucking: 'Player'
      });
      const newData = {
        lastRoll: data,
        playerName: callingPlayer.name
      };

      io.emit('playerCalled', newData);
      //game.nextPlayer();
      const nextPlayer = game.getCurrentPlayer();

      io.to(nextPlayer.socketId).emit('yourTurn');
    }
  });

  // Called whenever a player wishes to roll blindly and hope for a high enough roll
  socket.on('risk', function () {

    game.rollDice();
    game.nextPlayer();
    const nextPlayer = game.getCurrentPlayer();

    io.to(nextPlayer.socketId).emit('yourTurn', data);
  });
});
