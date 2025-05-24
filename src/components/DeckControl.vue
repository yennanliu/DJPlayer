<template>
  <div class="deck-control">
    <div class="deck-header">
      <h3 class="deck-title">DECK {{ deckId }}</h3>
      <div class="deck-indicator" :class="{ active: isPlaying }"></div>
    </div>

    <!-- File Input -->
    <div class="file-section">
      <input
        type="file"
        :id="`file-input-${deckId}`"
        accept="audio/*"
        @change="handleFileSelect"
        style="display: none"
      />
      <label
        :for="`file-input-${deckId}`"
        class="file-button"
      >
        📁 Load Track
      </label>
      <div class="track-info" v-if="trackName">
        <p class="track-name">{{ trackName }}</p>
      </div>
    </div>

    <!-- Transport Controls -->
    <div class="transport-section">
      <button
        @click="togglePlay"
        class="play-button"
        :class="{ playing: isPlaying }"
        :disabled="!audioElement"
      >
        {{ isPlaying ? '⏸️' : '▶️' }}
      </button>
      
      <button
        @click="stop"
        class="stop-button"
        :disabled="!audioElement"
      >
        ⏹️
      </button>

      <button
        @click="cue"
        class="cue-button"
        :disabled="!audioElement"
      >
        CUE
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="time-display">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
      <div class="progress-bar" @click="seek">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
        <div
          class="progress-handle"
          :style="{ left: progressPercentage + '%' }"
        ></div>
      </div>
    </div>

    <!-- EQ Controls -->
    <div class="eq-section">
      <div class="eq-control">
        <label>HIGH</label>
        <input
          type="range"
          min="-20"
          max="20"
          v-model="eqHigh"
          @input="updateEQ"
          class="eq-slider"
        />
        <span>{{ eqHigh }}db</span>
      </div>
      
      <div class="eq-control">
        <label>MID</label>
        <input
          type="range"
          min="-20"
          max="20"
          v-model="eqMid"
          @input="updateEQ"
          class="eq-slider"
        />
        <span>{{ eqMid }}db</span>
      </div>
      
      <div class="eq-control">
        <label>LOW</label>
        <input
          type="range"
          min="-20"
          max="20"
          v-model="eqLow"
          @input="updateEQ"
          class="eq-slider"
        />
        <span>{{ eqLow }}db</span>
      </div>
    </div>

    <!-- Volume Control -->
    <div class="volume-section">
      <label>VOLUME</label>
      <input
        type="range"
        min="0"
        max="100"
        :value="deckVolume"
        @input="updateVolume"
        class="volume-slider"
      />
      <span class="volume-display">{{ deckVolume }}%</span>
    </div>

    <!-- Tempo Control -->
    <div class="tempo-section">
      <label>TEMPO</label>
      <div class="tempo-controls">
        <button @click="decreaseTempo" class="tempo-btn">-</button>
        <span class="tempo-display">{{ tempo }}%</span>
        <button @click="increaseTempo" class="tempo-btn">+</button>
      </div>
      <input
        type="range"
        min="50"
        max="150"
        v-model="tempo"
        @input="updateTempo"
        class="tempo-slider"
      />
    </div>

    <!-- Hot Cues -->
    <div class="hotcue-section">
      <button
        v-for="n in 4"
        :key="n"
        @click="setHotCue(n)"
        @dblclick="jumpToHotCue(n)"
        class="hotcue-button"
        :class="{ active: hotCues[n] }"
      >
        {{ n }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeckControl',
  props: {
    deckId: {
      type: String,
      required: true
    },
    audioContext: {
      validator: function (value) {
        return value === null || value instanceof AudioContext || value instanceof (window.webkitAudioContext || AudioContext)
      },
      default: null
    },
    deckVolume: {
      type: Number,
      default: 75
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    currentTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    trackName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      audioElement: null,
      sourceNode: null,
      gainNode: null,
      analyserNode: null,
      eqHigh: 0,
      eqMid: 0,
      eqLow: 0,
      tempo: 100,
      hotCues: {},
      isLoading: false,
      updateInterval: null
    }
  },
  computed: {
    progressPercentage() {
      if (!this.duration) return 0
      return (this.currentTime / this.duration) * 100
    }
  },
  mounted() {
    this.initializeAudioNodes()
  },
  beforeDestroy() {
    this.cleanup()
  },
  methods: {
    initializeAudioNodes() {
      if (!this.audioContext) return

      try {
        // Clean up existing nodes
        if (this.gainNode) {
          this.gainNode.disconnect()
        }
        if (this.analyserNode) {
          this.analyserNode.disconnect()
        }
        
        // Create new nodes
        this.gainNode = this.audioContext.createGain()
        this.analyserNode = this.audioContext.createAnalyser()
        
        // Configure analyser
        this.analyserNode.fftSize = 256
        this.analyserNode.smoothingTimeConstant = 0.8
        
        // Connect audio graph: analyser -> gain (output will be connected to mixer)
        this.analyserNode.connect(this.gainNode)
        // Note: gainNode output will be connected to mixer in parent component
        
        this.updateVolumeNode()
      } catch (error) {
        console.error('Error initializing audio nodes:', error)
      }
    },

    handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      this.isLoading = true
      
      // Clean up previous audio element
      if (this.audioElement) {
        this.audioElement.pause()
        this.audioElement.src = ''
        this.audioElement = null
      }
      
      // Clean up previous source node
      if (this.sourceNode) {
        this.sourceNode.disconnect()
        this.sourceNode = null
      }

      const url = URL.createObjectURL(file)
      
      this.audioElement = new Audio(url)
      this.audioElement.crossOrigin = 'anonymous'
      
      this.audioElement.addEventListener('loadedmetadata', () => {
        // Ensure audio context is running
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
        
        this.connectAudioSource()
        this.$emit('file-loaded', {
          name: file.name,
          duration: this.audioElement.duration,
          analyser: this.analyserNode,
          outputNode: this.gainNode
        })
        this.isLoading = false
      })

      this.audioElement.addEventListener('timeupdate', () => {
        this.$emit('time-update', this.audioElement.currentTime)
      })

      this.audioElement.addEventListener('ended', () => {
        this.$emit('play-pause')
      })

      this.audioElement.addEventListener('error', (e) => {
        console.error('Audio element error:', e)
        this.isLoading = false
      })

      this.audioElement.load()
    },

    connectAudioSource() {
      if (!this.audioContext || !this.audioElement || !this.analyserNode) return

      try {
        // Disconnect previous source if it exists
        if (this.sourceNode) {
          this.sourceNode.disconnect()
          this.sourceNode = null
        }
        
        // Create new media element source
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)
        this.sourceNode.connect(this.analyserNode)
      } catch (error) {
        // If we get an error about the element already being used, that's okay
        // It might already be connected in some browsers
        if (error.name === 'InvalidStateError') {
          console.warn('Audio element already has a source node, skipping connection')
        } else {
          console.error('Error connecting audio source:', error)
        }
      }
    },

    togglePlay() {
      if (!this.audioElement) return

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      if (this.isPlaying) {
        this.audioElement.pause()
      } else {
        this.audioElement.play().catch(error => {
          console.error('Error playing audio:', error)
        })
      }
      
      this.$emit('play-pause')
    },

    stop() {
      if (!this.audioElement) return
      
      this.audioElement.pause()
      this.audioElement.currentTime = 0
      
      if (this.isPlaying) {
        this.$emit('play-pause')
      }
    },

    cue() {
      if (!this.audioElement) return
      
      this.audioElement.currentTime = 0
    },

    seek(event) {
      if (!this.audioElement || !this.duration) return
      
      const rect = event.currentTarget.getBoundingClientRect()
      const percentage = (event.clientX - rect.left) / rect.width
      const newTime = percentage * this.duration
      
      this.audioElement.currentTime = newTime
      this.$emit('seek', newTime)
    },

    updateVolume(event) {
      const volume = parseInt(event.target.value)
      this.$emit('volume-change', volume)
      this.updateVolumeNode()
    },

    updateVolumeNode() {
      if (this.gainNode) {
        this.gainNode.gain.value = this.deckVolume / 100
      }
    },

    updateEQ() {
      // EQ implementation would require additional audio nodes
      // For now, this is a placeholder
    },

    updateTempo() {
      if (this.audioElement) {
        this.audioElement.playbackRate = this.tempo / 100
        this.$emit('bpm-change', Math.round(120 * (this.tempo / 100)))
      }
    },

    increaseTempo() {
      if (this.tempo < 150) {
        this.tempo += 1
        this.updateTempo()
      }
    },

    decreaseTempo() {
      if (this.tempo > 50) {
        this.tempo -= 1
        this.updateTempo()
      }
    },

    setHotCue(number) {
      if (this.audioElement) {
        this.hotCues[number] = this.audioElement.currentTime
        this.$forceUpdate()
      }
    },

    jumpToHotCue(number) {
      if (this.audioElement && this.hotCues[number] !== undefined) {
        this.audioElement.currentTime = this.hotCues[number]
      }
    },

    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    cleanup() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
      }
      if (this.audioElement) {
        this.audioElement.pause()
        this.audioElement = null
      }
      if (this.sourceNode) {
        this.sourceNode.disconnect()
      }
    }
  },
  watch: {
    deckVolume() {
      this.updateVolumeNode()
    }
  }
}
</script>

<style scoped>
.deck-control {
  background: linear-gradient(145deg, #0d1117, #1a1a1a);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
}

.deck-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.deck-title {
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
}

.deck-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #333;
  transition: all 0.3s ease;
}

.deck-indicator.active {
  background: #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.8);
}

.file-section {
  margin-bottom: 1rem;
}

.file-button {
  display: inline-block;
  background: linear-gradient(45deg, #00ff88, #00d4aa);
  color: #000;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.track-info {
  margin-top: 0.5rem;
}

.track-name {
  color: #fff;
  font-size: 0.8rem;
  opacity: 0.8;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.transport-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.play-button,
.stop-button,
.cue-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.play-button:hover,
.stop-button:hover,
.cue-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.play-button.playing {
  background: #00ff88;
  color: #000;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
}

.play-button:disabled,
.stop-button:disabled,
.cue-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-section {
  margin-bottom: 1rem;
}

.time-display {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4757, #00ff88);
  border-radius: 3px;
  transition: width 0.1s ease;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
}

.progress-handle {
  position: absolute;
  top: -3px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.eq-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.eq-control {
  text-align: center;
}

.eq-control label {
  display: block;
  color: #fff;
  font-size: 0.7rem;
  margin-bottom: 0.3rem;
}

.eq-slider {
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
  margin-bottom: 0.3rem;
}

.eq-control span {
  color: #fff;
  font-size: 0.7rem;
  opacity: 0.8;
}

.volume-section {
  margin-bottom: 1rem;
}

.volume-section label {
  display: block;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.volume-slider {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  outline: none;
  margin-bottom: 0.5rem;
}

.volume-display {
  color: #fff;
  font-size: 0.8rem;
}

.tempo-section {
  margin-bottom: 1rem;
}

.tempo-section label {
  display: block;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.tempo-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.tempo-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
}

.tempo-display {
  color: #00ff88;
  font-family: 'Orbitron', monospace;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.tempo-slider {
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
}

.hotcue-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.hotcue-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.hotcue-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hotcue-button.active {
  background: #ff6b6b;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}
</style> 