<template>
  <div class="mix-recorder">
    <div class="recorder-header">
      <h4 class="recorder-title">🎙️ MIX RECORDER</h4>
    </div>

    <div class="recorder-controls">
      <!-- Recording Status -->
      <div class="recording-status">
        <div class="status-indicator" :class="{ 
          recording: isRecording, 
          paused: isPaused,
          stopped: !isRecording && !isPaused 
        }"></div>
        <span class="status-text">{{ recordingStatus }}</span>
      </div>

      <!-- Recording Time -->
      <div class="recording-time">
        <span class="time-display">{{ formatTime(recordingDuration) }}</span>
      </div>

      <!-- Control Buttons -->
      <div class="control-buttons">
        <button 
          @click="startRecording" 
          :disabled="isRecording || !canRecord"
          class="record-btn"
          title="Start Recording"
        >
          ⏺️
        </button>

        <button 
          @click="pauseRecording" 
          :disabled="!isRecording"
          class="pause-btn"
          title="Pause Recording"
        >
          ⏸️
        </button>

        <button 
          @click="stopRecording" 
          :disabled="!isRecording && !isPaused"
          class="stop-btn"
          title="Stop Recording"
        >
          ⏹️
        </button>

        <button 
          @click="downloadMix" 
          :disabled="!hasRecording"
          class="download-btn"
          title="Download Mix"
        >
          📥 Download
        </button>
      </div>

      <!-- Recording Quality -->
      <div class="quality-selector">
        <label>Quality:</label>
        <select v-model="selectedQuality" :disabled="isRecording">
          <option value="high">High (320kbps)</option>
          <option value="medium">Medium (192kbps)</option>
          <option value="low">Low (128kbps)</option>
        </select>
      </div>
    </div>

    <!-- Recording Info -->
    <div class="recording-info" v-if="hasRecording">
      <div class="info-item">
        <span class="label">Duration:</span>
        <span class="value">{{ formatTime(lastRecordingDuration) }}</span>
      </div>
      <div class="info-item">
        <span class="label">Size:</span>
        <span class="value">{{ formatFileSize(recordingSize) }}</span>
      </div>
      <div class="info-item">
        <span class="label">Format:</span>
        <span class="value">{{ recordingFormat }}</span>
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions" v-if="!hasRecording && !isRecording">
      <p>🎧 Load tracks, start playing, and hit record to capture your mix!</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MixRecorder',
  props: {
    audioContext: {
      validator: function (value) {
        return value === null || value instanceof AudioContext || value instanceof (window.webkitAudioContext || AudioContext)
      },
      default: null
    },
    mixerOutputNode: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isRecording: false,
      isPaused: false,
      mediaRecorder: null,
      recordedChunks: [],
      recordingDuration: 0,
      lastRecordingDuration: 0,
      recordingSize: 0,
      recordingFormat: 'WebM',
      selectedQuality: 'high',
      recordingTimer: null,
      recordingStartTime: 0,
      destinationNode: null,
      mediaStreamDestination: null
    }
  },
  computed: {
    recordingStatus() {
      if (this.isRecording) return 'Recording...'
      if (this.isPaused) return 'Paused'
      return 'Ready'
    },
    canRecord() {
      return this.audioContext && this.mixerOutputNode
    },
    hasRecording() {
      return this.recordedChunks.length > 0
    },
    qualitySettings() {
      const settings = {
        high: { audioBitsPerSecond: 320000 },
        medium: { audioBitsPerSecond: 192000 },
        low: { audioBitsPerSecond: 128000 }
      }
      return settings[this.selectedQuality]
    }
  },
  watch: {
    audioContext() {
      this.setupRecordingNodes()
    },
    mixerOutputNode() {
      this.setupRecordingNodes()
    }
  },
  mounted() {
    this.setupRecordingNodes()
  },
  beforeDestroy() {
    this.cleanup()
  },
  methods: {
    setupRecordingNodes() {
      if (!this.audioContext || !this.mixerOutputNode) return

      try {
        // Create a destination node for recording
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination()
        
        // Connect the mixer output to the recording destination
        this.mixerOutputNode.connect(this.mediaStreamDestination)
      } catch (error) {
        console.error('Error setting up recording nodes:', error)
      }
    },

    async startRecording() {
      if (!this.canRecord || this.isRecording) return

      try {
        // Clear previous recording
        this.recordedChunks = []
        this.recordingSize = 0

        // Set up MediaRecorder
        const stream = this.mediaStreamDestination.stream
        const options = {
          mimeType: this.getSupportedMimeType(),
          ...this.qualitySettings
        }

        this.mediaRecorder = new MediaRecorder(stream, options)
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data)
            this.recordingSize += event.data.size
          }
        }

        this.mediaRecorder.onstop = () => {
          this.lastRecordingDuration = this.recordingDuration
          this.isRecording = false
          this.isPaused = false
          this.stopTimer()
        }

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event.error)
          this.stopRecording()
        }

        // Start recording
        this.mediaRecorder.start(1000) // Record in 1-second chunks
        this.isRecording = true
        this.isPaused = false
        this.startTimer()

        this.$emit('recording-started')
      } catch (error) {
        console.error('Error starting recording:', error)
        alert('Error starting recording. Please try again.')
      }
    },

    pauseRecording() {
      if (!this.isRecording || !this.mediaRecorder) return

      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause()
        this.isPaused = true
        this.isRecording = false
        this.stopTimer()
        this.$emit('recording-paused')
      } else if (this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume()
        this.isPaused = false
        this.isRecording = true
        this.startTimer()
        this.$emit('recording-resumed')
      }
    },

    stopRecording() {
      if (!this.mediaRecorder) return

      this.mediaRecorder.stop()
      this.stopTimer()
      this.$emit('recording-stopped')
    },

    downloadMix() {
      if (!this.hasRecording) return

      try {
        const blob = new Blob(this.recordedChunks, { 
          type: this.getSupportedMimeType() 
        })
        
        const url = URL.createObjectURL(blob)
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
        const extension = this.recordingFormat.toLowerCase()
        const filename = `DJ-Mix-${timestamp}.${extension}`
        
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        
        URL.revokeObjectURL(url)
        
        this.$emit('mix-downloaded', { filename, size: this.recordingSize })
      } catch (error) {
        console.error('Error downloading mix:', error)
        alert('Error downloading mix. Please try again.')
      }
    },

    getSupportedMimeType() {
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mpeg'
      ]
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          this.recordingFormat = type.includes('webm') ? 'WebM' : 
                               type.includes('mp4') ? 'MP4' : 'MP3'
          return type
        }
      }
      
      this.recordingFormat = 'WebM'
      return 'audio/webm'
    },

    startTimer() {
      this.recordingStartTime = Date.now() - (this.recordingDuration * 1000)
      this.recordingTimer = setInterval(() => {
        this.recordingDuration = (Date.now() - this.recordingStartTime) / 1000
      }, 100)
    },

    stopTimer() {
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
    },

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    cleanup() {
      this.stopTimer()
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
      if (this.mediaStreamDestination) {
        this.mediaStreamDestination.disconnect()
      }
    }
  }
}
</script>

<style scoped>
.mix-recorder {
  background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #333;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  margin-bottom: 1rem;
}

.recorder-header {
  text-align: center;
  margin-bottom: 1rem;
}

.recorder-title {
  color: #00ff88;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 1rem;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}

.recorder-controls {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #666;
  transition: all 0.3s ease;
}

.status-indicator.recording {
  background: #ff4757;
  box-shadow: 0 0 15px rgba(255, 71, 87, 0.8);
  animation: pulse 1s infinite;
}

.status-indicator.paused {
  background: #ffa502;
  box-shadow: 0 0 15px rgba(255, 165, 2, 0.8);
}

.status-indicator.stopped {
  background: #666;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
}

.recording-time {
  text-align: center;
}

.time-display {
  color: #00ff88;
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
  justify-self: center;
}

.record-btn,
.pause-btn,
.stop-btn,
.download-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 40px;
}

.record-btn:hover:not(:disabled) {
  background: #ff4757;
  transform: translateY(-2px);
}

.pause-btn:hover:not(:disabled) {
  background: #ffa502;
  transform: translateY(-2px);
}

.stop-btn:hover:not(:disabled) {
  background: #747d8c;
  transform: translateY(-2px);
}

.download-btn {
  background: linear-gradient(45deg, #00ff88, #00d4aa);
  color: #000;
  font-weight: 600;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
}

.record-btn:disabled,
.pause-btn:disabled,
.stop-btn:disabled,
.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.quality-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: end;
}

.quality-selector label {
  color: #fff;
  font-size: 0.9rem;
}

.quality-selector select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #333;
  color: #fff;
  padding: 0.3rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.recording-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.info-item {
  text-align: center;
}

.info-item .label {
  display: block;
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
}

.info-item .value {
  display: block;
  color: #00ff88;
  font-weight: bold;
  font-size: 0.9rem;
}

.instructions {
  text-align: center;
  padding: 1rem;
  background: rgba(0, 255, 136, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(0, 255, 136, 0.2);
}

.instructions p {
  color: #00ff88;
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .recorder-controls {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1rem;
  }
  
  .recording-info {
    grid-template-columns: 1fr;
  }
}
</style> 