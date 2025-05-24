<template>
  <div id="app">
    <header class="header">
      <h1 class="title">🎧 DJ PLAYER</h1>
      <p class="subtitle">Mix your beats like a pro</p>
    </header>
    
    <main class="main-content">
      <SampleTracks @track-generated="onTrackGenerated" />
      <DJPlayer />
    </main>
    
    <footer class="footer">
      <p>&copy; 2024 DJ Player - Built with Vue 2</p>
    </footer>
  </div>
</template>

<script>
import DJPlayer from './components/DJPlayer.vue'
import SampleTracks from './components/SampleTracks.vue'

export default {
  name: 'App',
  components: {
    DJPlayer,
    SampleTracks
  },
  methods: {
    onTrackGenerated(trackInfo) {
      console.log('Track generated:', trackInfo)
      // You can add a notification or feedback here
    }
  }
}
</script>

<style>
.header {
  text-align: center;
  padding: 2rem 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.title {
  font-family: 'Orbitron', monospace;
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  font-weight: 300;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer {
  text-align: center;
  padding: 2rem 0;
  color: white;
  opacity: 0.7;
  font-size: 0.9rem;
}
</style> 