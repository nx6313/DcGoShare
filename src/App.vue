<template>
  <div id="app">
    <JourneyShare msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import JourneyShare from './components/JourneyShare.vue'

export default {
  name: 'app',
  components: {
    JourneyShare
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  padding: 0;
  margin: 0;
}

body, html {
  padding: 0;
  margin: 0;
}

.amap-logo {
  display: none !important;
}

.amap-copyright {
  display: none !important;
}
</style>
