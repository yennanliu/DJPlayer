<template>
  <div class="dj-player">
    <!-- Mix Recorder -->
    <MixRecorder 
      :audio-context="audioContext"
      :mixer-output-node="mixerOutputNode"
      @recording-started="onRecordingStarted"
      @recording-stopped="onRecordingStopped"
      @mix-downloaded="onMixDownloaded"
    />

    <!-- DJ Mixer Section -->
    <div class="mixer-section">
      <div class="mixer-panel">
        <h3 class="mixer-title">MIXER</h3>
        
        <!-- Crossfader -->
        <div class="crossfader-container">
          <label>CROSSFADER</label>
          <input
            type="range"
            min="0"
            max="100"
            v-model="crossfader"
            @input="updateCrossfader"
            class="crossfader"
          />
          <div class="crossfader-labels">
            <span>A</span>
            <span>B</span>
          </div>
        </div>

        <!-- Master Volume -->
        <div class="master-volume">
          <label>MASTER</label>
          <input
            type="range"
            min="0"
            max="100"
            v-model="masterVolume"
            @input="updateMasterVolume"
            class="volume-slider vertical"
            orient="vertical"
          />
          <span class="volume-label">{{ masterVolume }}%</span>
        </div>

        <!-- BPM Display -->
        <div class="bpm-display">
          <div class="bpm-counter">
            <span class="bpm-label">BPM</span>
            <span class="bpm-value">{{ currentBPM }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Deck Section -->
    <div class="decks-section">
      <!-- Deck A -->
      <DeckControl
        :deck-id="'A'"
        :audio-context="audioContext"
        :deck-volume="deckAVolume"
        :is-playing="deckAPlaying"
        :current-time="deckACurrentTime"
        :duration="deckADuration"
        :track-name="deckATrackName"
        @play-pause="togglePlayDeck('A')"
        @volume-change="updateDeckVolume('A', $event)"
        @file-loaded="handleFileLoaded('A', $event)"
        @time-update="updateDeckTime('A', $event)"
        @seek="seekDeck('A', $event)"
        @bpm-change="updateBPM"
        class="deck-a"
      />

      <!-- Deck B -->
      <DeckControl
        :deck-id="'B'"
        :audio-context="audioContext"
        :deck-volume="deckBVolume"
        :is-playing="deckBPlaying"
        :current-time="deckBCurrentTime"
        :duration="deckBDuration"
        :track-name="deckBTrackName"
        @play-pause="togglePlayDeck('B')"
        @volume-change="updateDeckVolume('B', $event)"
        @file-loaded="handleFileLoaded('B', $event)"
        @time-update="updateDeckTime('B', $event)"
        @seek="seekDeck('B', $event)"
        @bpm-change="updateBPM"
        class="deck-b"
      />
    </div>

    <!-- Waveform Visualizer -->
    <div class="visualizer-section">
      <canvas ref="visualizerCanvas" class="visualizer-canvas"></canvas>
    </div>
  </div>
</template>

<script>
import DeckControl from './DeckControl.vue'
import MixRecorder from './MixRecorder.vue'

export default {
  name: 'DJPlayer',
  components: {
    DeckControl,
    MixRecorder
  },
  data() {
    return {
      audioContext: null,
      masterVolume: 75,
      crossfader: 50,
      currentBPM: 120,
      
      // Deck A
      deckAVolume: 75,
      deckAPlaying: false,
      deckACurrentTime: 0,
      deckADuration: 0,
      deckATrackName: '',
      deckAAudio: null,
      
      // Deck B
      deckBVolume: 75,
      deckBPlaying: false,
      deckBCurrentTime: 0,
      deckBDuration: 0,
      deckBTrackName: '',
      deckBAudio: null,

      // Visualizer
      analyserA: null,
      analyserB: null,
      animationId: null,

      // Mixer output for recording
      mixerOutputNode: null,
      masterGainNode: null,
      crossfaderGainA: null,
      crossfaderGainB: null
    }
  },
  mounted() {
    this.initializeAudioContext()
    this.initializeVisualizer()
  },
  beforeDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
  },
  methods: {
    initializeAudioContext() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.setupMixerNodes()
      } catch (error) {
        console.error('Web Audio API not supported:', error)
      }
    },

    setupMixerNodes() {
      if (!this.audioContext) return

      try {
        // Create mixer nodes
        this.masterGainNode = this.audioContext.createGain()
        this.crossfaderGainA = this.audioContext.createGain()
        this.crossfaderGainB = this.audioContext.createGain()
        this.mixerOutputNode = this.audioContext.createGain()

        // Connect crossfader gains to mixer output
        this.crossfaderGainA.connect(this.mixerOutputNode)
        this.crossfaderGainB.connect(this.mixerOutputNode)

        // Connect mixer output to master gain
        this.mixerOutputNode.connect(this.masterGainNode)

        // Connect master gain to speakers
        this.masterGainNode.connect(this.audioContext.destination)

        // Set initial values
        this.updateMasterVolume()
        this.updateCrossfader()
      } catch (error) {
        console.error('Error setting up mixer nodes:', error)
      }
    },

    initializeVisualizer() {
      const canvas = this.$refs.visualizerCanvas
      if (!canvas) return

      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      this.drawVisualizer()
    },

    drawVisualizer() {
      const canvas = this.$refs.visualizerCanvas
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, width, height)

      // Draw waveform for both decks
      this.drawWaveform(ctx, this.analyserA, 0, width / 2, height, '#ff4757')
      this.drawWaveform(ctx, this.analyserB, width / 2, width / 2, height, '#00ff88')

      this.animationId = requestAnimationFrame(this.drawVisualizer)
    },

    drawWaveform(ctx, analyser, x, width, height, color) {
      if (!analyser) return

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = color
      const barWidth = width / bufferLength
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8
        ctx.fillRect(x + i * barWidth, height - barHeight, barWidth - 1, barHeight)
      }
    },

    togglePlayDeck(deckId) {
      if (deckId === 'A') {
        this.deckAPlaying = !this.deckAPlaying
      } else {
        this.deckBPlaying = !this.deckBPlaying
      }
    },

    updateDeckVolume(deckId, volume) {
      if (deckId === 'A') {
        this.deckAVolume = volume
      } else {
        this.deckBVolume = volume
      }
    },

    updateCrossfader() {
      if (!this.crossfaderGainA || !this.crossfaderGainB) return

      // Convert crossfader position (0-100) to gain values
      const position = this.crossfader / 100
      
      // Equal power crossfading
      const gainA = Math.cos(position * Math.PI / 2)
      const gainB = Math.sin(position * Math.PI / 2)
      
      this.crossfaderGainA.gain.value = gainA
      this.crossfaderGainB.gain.value = gainB
    },

    updateMasterVolume() {
      if (!this.masterGainNode) return
      this.masterGainNode.gain.value = this.masterVolume / 100
    },

    handleFileLoaded(deckId, data) {
      if (deckId === 'A') {
        this.deckATrackName = data.name
        this.deckADuration = data.duration
        this.analyserA = data.analyser
        
        // Connect deck A to crossfader
        if (data.outputNode && this.crossfaderGainA) {
          data.outputNode.connect(this.crossfaderGainA)
        } else if (data.outputNode) {
          // Fallback: connect directly to destination if mixer not ready
          data.outputNode.connect(this.audioContext.destination)
        }
      } else {
        this.deckBTrackName = data.name
        this.deckBDuration = data.duration
        this.analyserB = data.analyser
        
        // Connect deck B to crossfader
        if (data.outputNode && this.crossfaderGainB) {
          data.outputNode.connect(this.crossfaderGainB)
        } else if (data.outputNode) {
          // Fallback: connect directly to destination if mixer not ready
          data.outputNode.connect(this.audioContext.destination)
        }
      }
    },

    updateDeckTime(deckId, time) {
      if (deckId === 'A') {
        this.deckACurrentTime = time
      } else {
        this.deckBCurrentTime = time
      }
    },

    seekDeck(deckId, time) {
      // Seeking will be handled in DeckControl
    },

    updateBPM(bpm) {
      this.currentBPM = bpm
    },

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    // Recording event handlers
    onRecordingStarted() {
      console.log('Recording started')
    },

    onRecordingStopped() {
      console.log('Recording stopped')
    },

    onMixDownloaded(data) {
      console.log('Mix downloaded:', data)
    }
  }
}
</script>

<style scoped>
.dj-player {
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(0, 255, 136, 0.2);
  border: 1px solid #333;
  margin: 2rem 0;
}

.mixer-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.mixer-panel {
  background: linear-gradient(145deg, #0d1117, #1a1a1a);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 
    inset 0 2px 10px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(0, 255, 136, 0.3);
  border: 1px solid #333;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.mixer-title {
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
}

.crossfader-container {
  text-align: center;
}

.crossfader-container label {
  display: block;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.crossfader {
  width: 200px;
  height: 6px;
  background: linear-gradient(90deg, #ff4757, #00ff88);
  border-radius: 3px;
  outline: none;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 255, 136, 0.3);
}

.crossfader::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.crossfader-labels {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-weight: bold;
  font-size: 0.9rem;
}

.master-volume {
  text-align: center;
}

.master-volume label {
  display: block;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.volume-slider {
  width: 6px;
  height: 100px;
  background: #333;
  border-radius: 3px;
  outline: none;
  transform: rotate(-90deg);
}

.volume-label {
  display: block;
  color: #fff;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.bpm-display {
  text-align: center;
}

.bpm-counter {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 1rem;
  min-width: 80px;
}

.bpm-label {
  display: block;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.bpm-value {
  display: block;
  color: #00ff88;
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.decks-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.deck-a {
  border-left: 3px solid #ff4757;
  box-shadow: -3px 0 15px rgba(255, 71, 87, 0.3);
}

.deck-b {
  border-left: 3px solid #00ff88;
  box-shadow: -3px 0 15px rgba(0, 255, 136, 0.3);
}

.visualizer-section {
  height: 200px;
  background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8);
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  background: transparent;
}

@media (max-width: 768px) {
  .decks-section {
    grid-template-columns: 1fr;
  }
  
  .mixer-panel {
    flex-direction: column;
    gap: 1rem;
  }
  
  .crossfader {
    width: 150px;
  }
}
</style> 