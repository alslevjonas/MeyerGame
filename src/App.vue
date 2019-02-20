<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>Meyer</h1>
    <Welcome v-if="this.state.appState === 'welcome'"/>
    <Meyer v-if="this.state.appState === 'joined'"/>
  </div>
</template>

<script>
/* eslint-disable */
import Meyer from "@/components/Meyer";
import Welcome from "@/components/Welcome";
import { EventBus } from "./event-bus.js"

export default {
  name: "App",
  components: {
    Meyer,
    Welcome
  },
  data: () => ({
    state: {
      appState: "welcome"
    }
  }),
   created() {
   EventBus.$on('joinedGame', ()=>{
     this.state.appState = 'joined'
   })
  },

};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
img{
  height: 300px;
  width: auto;


}
</style>
