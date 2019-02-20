<template >
  <div class="hello">
    <input type="text" placeholder="Type a name" v-model="name">
    <button v-on:click="send">send</button>
  </div>
</template>

<script>
/* eslint-disable*/
import socket from "../lib/connector.js";
import { EventBus } from "../event-bus.js"
export default {
    name: 'Welcome',
  data() {
    return {
      msg: "Welcome to Meyer",
      player: "",
      name: ""
    };
  },
  methods: {
    send() {
      socket.emit('addPlayer', {name: this.name})
      EventBus.$emit('joinedGame')
    }
  },

  created() {
    socket.on("message", function(message) {
      this.message = message;
      console.log("server sent", message);
    });

    socket.on("playerJoined", player => {
      this.player = player.name;
    });
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
</style>
