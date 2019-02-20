<template>
  <div>
    <div>
      <p>
        <b>Player on this socket:</b>
        {{me}}
      </p>
      <p v-show="currentPlayer !== ''">Current Player: {{currentPlayer}}</p>
      <p v-show="players.length === 1">Waiting for more players to join the game</p>
      <p v-show="players.length > 1">People in the game:</p>
      <div v-show="players.length > 1" class="players">
        <p v-bind:key="index" v-for="(player, index) in players">{{player.name}}</p>
      </div>
      <!-- <button id="joinButton" class="startControls" type="button">Join Game</button> -->
      <button
        v-on:click="startGame"
        v-show="players.length >= 2 && !gameHasStarted"
        id="startButton"
        type="button"
      >Start Game</button>
    </div>

    <div id="buttonsandfields" v-show="gameHasStarted && !lost && !won">
      <div>
        <textarea
          disabled
          id="scoreBoard"
          class="playControls"
          rows="6"
          cols="6"
          style="width: 400px; height: 100%;"
          max-width="6"
          max-height="6"
        ></textarea>
      </div>

      <div>
        <div id="lie">
          <p class="lie">Wanna lie?</p>
          <input
            v-bind:disabled="!yourTurn"
            type="number"
            class="playControls lieFields"
            min="1"
            max="6"
            id="1stLie "
            v-model="lie1"
          >
          <input
            v-bind:disabled="!yourTurn"
            type="number"
            min="1"
            max="6"
            id="2ndLie"
            class="playControls lieFields"
            v-model="lie2"
          >
        </div>
        <button
          v-bind:disabled="!yourTurn"
          id="lieButton"
          v-on:click="lie"
          class="playControls"
          type="button"
        >Lie</button>

        <div class="flex-container" v-show="gameHasStarted && !lost && !won">
          <div class="dice">
            <div class="die">{{die1}}</div>
            <div class="die">{{die2}}</div>
          </div>
        </div>
        <div class="flex-container buttons" v-if="gameHasStarted && !lost && !won">
          <!-- <div>
        <button  id="riskItButton" class="playControls" type="button">
          Risk it!
        </button>
          </div>-->
          <button
            v-bind:disabled="!yourTurn || rolled"
            id="rollButton"
            v-on:click="getRoll"
            class="playControls"
            type="button"
          >Roll</button>

          <button
            v-bind:disabled="!yourTurn || rolled"
            id="liftButton"
            v-on:click="sendLift"
            class="playControls"
            type="button"
          >Lift!</button>

          <button
            v-bind:disabled="!yourTurn || !rolled"
            v-on:click="call"
            id="callButton"
            class="playControls"
            type="button"
          >Call!</button>
        </div>
      </div>
      <div>
        <textarea disabled id="log" rows="3" cols="30" style="width: 400px; height: 100%;"></textarea>
      </div>
    </div>

    <div class="container"></div>
    <h1 v-if="lost">LOSER</h1>
    <h1 v-if="won">You won the game</h1>
  </div>
</template>

<script>
/* eslint-disable */
import socket from "../lib/connector.js";
import { EventBus } from "../event-bus.js";

export default {
  name: "Meyer",
  data: () => ({
    players: [],
    me: "",
    text: "",
    currentPlayer: "",
    scoreBoardIsVisible: false,
    score: [],
    dice: "00",
    lie1: 0,
    lie2: 0,
    lost: false,
    yourTurn: false,
    previousDice: "00",
    gameHasStarted: false,
    liedDice: "00",
    playerLied: false,
    die1: 0,
    die2: 0,
    rolled: false,
    won: false
  }),
  methods: {
    call: function() {
      socket.emit("call", [this.die1, this.die2]);
    },
    buh: logString => {
      var vm = this;
      document.getElementById("log").value += logString.logString + "\n";
    },
    startGame: function() {
      socket.emit("start");
    },
    getRoll: function() {
      socket.emit("roll");
      this.rolled = true;
    },
    sendLift: function() {
      socket.emit("lift");
      this.yourTurn = false;
    },

    lie: function() {
      var vm = this;
      if (vm.lie1 <= 6 && vm.lie1 >= 1 && vm.lie2 <= 6 && vm.lie2 >= 1) {
        vm.yourTurn = false;
        socket.emit("lie", [vm.lie1, vm.lie2]);
        vm.lie1 = 0;
        vm.lie2 = 0;
      } else {
        vm.buh("The values for the dices must be from 1 to 6");
      }
    },
    sendRisk: function() {
      socket.emit("risk");
    }
  },

  mounted() {
    var vm = this;
    socket.emit("meyerCreated");
    socket.on("sent", data => (vm.text = data));
    socket.on("playerCalled", function(data) {
      // console.log({ data });
      const lastRoll = data.lastRoll;
      const playerName = data.playerName;
      const logString = {
        logString: playerName + " says " + lastRoll[0] + " and " + lastRoll[1]
      };
      vm.yourTurn = false;
      vm.buh(logString);
      // Emit that a player made a given call
      // The data object looks like the following
      // const newData = {
      //   data,
      //   playerName: callingPlayer.name
      // };
    });

    socket.on("returnRoll", function(data) {
      vm.die1 = parseInt(data.charAt(0));
      vm.die2 = parseInt(data.charAt(1));
      const logString = {
        logString: "You rolled " + data.charAt(0) + " and " + data.charAt(1)
      };

      vm.buh(logString);
      // Display roll to player
    });

    socket.on("playerJoined", function(data) {
      // console.log(data.name + " joined the game");
      // console.log(data);
      // Add data.name to log
    });

    socket.on("gameStarting", () => {
      // console.log("The game is starting");
      vm.gameHasStarted = true;
    });

    socket.on("yourTurn", function(data) {
      vm.rolled = false;
      vm.die1 = 0;
      vm.die2 = 0;
      const logString = { logString: "Your turn" };
      vm.buh(logString);
      vm.yourTurn = true;
    });
    socket.on("youLost", function() {
      vm.lost = true;

      socket.disconnect();
    });
    socket.on("playerLeft", data => {
      console.log(data);
      vm.players = data;
      if (vm.players.length === 1) {
        vm.won = true;
      } else {
        const logString = {
          logString: "A player lost, and left the game"
        };
        vm.buh(logString);
      }
    });
    socket.on("newRound", function(data) {
      const scoreBoard = document.getElementById("scoreBoard");
      scoreBoard.value = "The score is \n";
      for (const player of data.score.players) {
        scoreBoard.value += `${player.name}: ${player.score},\n`;
      }
      if (data.hasOwnProperty("loser")) {
        const logString = { logString: data.loser.name + " lost this round" };
        vm.buh(logString);
      }
      // A new round is starting, and someone just lost.
      // Data should contain the entire gamestate
      // Update scoreboard
    });

    socket.on("badLiar", function() {
      // The player tried to lie with a too low number
    });

    socket.on("playerJoined", players => {
      // console.log(players);
      vm.players = players;
    });

    socket.on("iJoined", player => {
      vm.me = player.name;
    });
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.players {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  max-width: 50%;
  margin: 0 auto;
}

button {
  border: none;
  margin: 0;
  padding: 0;
  width: auto;
  overflow: visible;

  background: transparent;

  /* inherit font & color from ancestor */
  color: inherit;
  font: inherit;

  /* Normalize `line-height`. Cannot be changed from `normal` in Firefox 4+. */
  line-height: normal;

  /* Corrects font smoothing for webkit */
  -webkit-font-smoothing: inherit;
  -moz-osx-font-smoothing: inherit;

  /* Corrects inability to style clickable `input` types in iOS */
  -webkit-appearance: none;
}

#startButton,
.buttons > button,
#lieButton {
  background: #dce1c8;
  margin-top: 1em;
  padding: 1em;
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  border-radius: 5%;
  transition: ease-in all 250ms;
  margin: 1em;
  font-weight: 600;
}
#startButton:hover,
.buttons > button:hover,
#lieButton:hover {
  background: #b9b9b9;
}
button:disabled{
background: #b9b9b9 ;
  cursor: not-allowed;
  color: white;
}
button:disabled:hover{
  background: #b9b9b9;

}
p {
  margin-top: 0;
  margin-bottom: 0.5em;
}
.players > p {
  margin-left: 1em;
}
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.text-area__label {
}

.container {
  display: flex;
  flex-flow: row;
  max-width: 1000px;
  margin: 0 auto;
  justify-content: space-between;
  margin-top: 2em;
}

textarea:disabled {
  background: white;
  appearance: textfield;
  resize: none;
}
.die {
  background: #dce1c8;
  margin: 0 auto;
  width: 50px;
  height: 50px;
  line-height: 50px;
}

.dice {
  display: flex;
  width: 120px;
  justify-content: space-between;
  margin: 20px auto;
}

.lieFields {
  height: 20px;
  border: none;
  border-bottom: 2px solid #b9b9b9;
}
.lie {
  font-weight: 600;
  flex-basis: 100%;
}

#lie {
  width: 150px;
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  flex-flow: row wrap;
  margin-bottom: 2em;

}

#buttonsandfields {
  margin: 0 auto;
  margin-top: 2em;
  display: flex;
  justify-content: space-between;
  max-width: 1500px;
  flex-flow: row nowrap;
}
</style>
