<template>
  <div id="app">
    <header class="header">
      <h1 class="title">🎧 DJ PLAYER</h1>
      <p class="subtitle">Mix your beats like a pro</p>
    </header>
    
    <main class="main-content">
      <DJPlayer />
      <SampleTracks @track-generated="onTrackGenerated" />
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
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  text-align: center;
  padding: 1.5rem 0;
  color: white;
  border-bottom: 2px solid #00ff88;
  box-shadow: 0 4px 20px rgba(0, 255, 136, 0.2);
}

.title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  letter-spacing: 3px;
  background: linear-gradient(45deg, #00ff88, #00d4aa);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.8;
  font-weight: 300;
  color: #cccccc;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  background: #0f0f0f;
  min-height: calc(100vh - 200px);
}

.footer {
  background: #1a1a1a;
  text-align: center;
  padding: 1rem 0;
  color: #666;
  font-size: 0.8rem;
  border-top: 1px solid #333;
}
</style> 