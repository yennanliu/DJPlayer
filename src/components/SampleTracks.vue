<template>
  <div class="sample-tracks">
    <div class="sample-header">
      <h3 class="sample-title">🎵 Generate Sample Tracks</h3>
      <p class="sample-subtitle">Create test audio files to try out the DJ Player</p>
    </div>

    <div class="sample-grid">
      <div
        v-for="track in sampleTracks"
        :key="track.name"
        class="sample-card"
      >
        <div class="sample-info">
          <h4 class="track-name">{{ track.name }}</h4>
          <p class="track-description">{{ track.description }}</p>
          <div class="track-details">
            <span v-if="track.type !== 'drum'" class="frequency">{{ track.frequency }}Hz</span>
            <span v-else class="frequency">{{ track.frequency }} BPM</span>
            <span class="duration">{{ track.duration }}s</span>
            <span class="type">{{ track.type }}</span>
          </div>
        </div>
        
        <div class="sample-actions">
          <button
            @click="generateTrack(track)"
            class="generate-btn"
            :disabled="isGenerating"
          >
            <span v-if="isGenerating && currentTrack === track.name">⏳</span>
            <span v-else>📥</span>
            {{ isGenerating && currentTrack === track.name ? 'Generating...' : 'Download' }}
          </button>
        </div>
      </div>
    </div>

    <div class="custom-generator">
      <h4>🎛️ Custom Track Generator</h4>
      <div class="custom-controls">
        <div class="control-group">
          <label>Name:</label>
          <input v-model="customTrack.name" type="text" placeholder="My Custom Track" />
        </div>
        
        <div class="control-group">
          <label>Type:</label>
          <select v-model="customTrack.type">
            <option value="sine">Sine Wave</option>
            <option value="square">Square Wave</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
            <option value="drum">Drum Beat</option>
          </select>
        </div>
        
        <div class="control-group">
          <label v-if="customTrack.type !== 'drum'">Frequency (Hz):</label>
          <label v-else>BPM:</label>
          <input 
            v-model.number="customTrack.frequency" 
            type="number" 
            :min="customTrack.type === 'drum' ? 60 : 20"
            :max="customTrack.type === 'drum' ? 200 : 2000"
            :step="customTrack.type === 'drum' ? 1 : 10"
          />
        </div>
        
        <div class="control-group">
          <label>Duration (seconds):</label>
          <input v-model.number="customTrack.duration" type="number" min="5" max="120" step="5" />
        </div>
        
        <button 
          @click="generateCustomTrack" 
          class="generate-custom-btn"
          :disabled="isGenerating || !customTrack.name"
        >
          🎵 Generate Custom Track
        </button>
      </div>
    </div>

    <div class="sample-instructions">
      <h4>📖 How to Use:</h4>
      <ol>
        <li>Click "Download" on any sample track to generate and save it</li>
        <li>Or create a custom track with your own parameters</li>
        <li>Load the downloaded files into the DJ Player using "📁 Load Track"</li>
        <li>Start mixing and testing all the DJ features!</li>
      </ol>
    </div>

    <div class="free-samples-info">
      <h4>🎶 Want Real Music?</h4>
      <p>For actual music tracks, try these free resources:</p>
      <ul>
        <li><strong>Freesound.org</strong> - Free sound effects and loops</li>
        <li><strong>Zapsplat.com</strong> - Free music and sound effects (registration required)</li>
        <li><strong>YouTube Audio Library</strong> - Royalty-free music</li>
        <li><strong>Free Music Archive</strong> - Creative Commons music</li>
        <li><strong>Jamendo</strong> - Independent artist tracks</li>
      </ul>
      <p class="note">⚠️ Always check licensing before using music in public performances</p>
    </div>
  </div>
</template>

<script>
import { AudioGenerator, SAMPLE_TRACKS } from '../utils/audioGenerator.js'

export default {
  name: 'SampleTracks',
  data() {
    return {
      sampleTracks: SAMPLE_TRACKS,
      audioGenerator: null,
      isGenerating: false,
      currentTrack: '',
      customTrack: {
        name: '',
        type: 'sine',
        frequency: 440,
        duration: 30
      }
    }
  },
  mounted() {
    this.audioGenerator = new AudioGenerator()
  },
  methods: {
    async generateTrack(track) {
      if (this.isGenerating) return
      
      this.isGenerating = true
      this.currentTrack = track.name
      
      try {
        // Small delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.audioGenerator.generateSampleTrack(
          track.name,
          track.type,
          track.frequency,
          track.duration
        )
        
        this.$emit('track-generated', {
          name: track.name,
          type: track.type
        })
      } catch (error) {
        console.error('Error generating track:', error)
        alert('Error generating track. Please try again.')
      } finally {
        this.isGenerating = false
        this.currentTrack = ''
      }
    },
    
    async generateCustomTrack() {
      if (this.isGenerating || !this.customTrack.name) return
      
      this.isGenerating = true
      this.currentTrack = this.customTrack.name
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.audioGenerator.generateSampleTrack(
          this.customTrack.name,
          this.customTrack.type,
          this.customTrack.frequency,
          this.customTrack.duration
        )
        
        this.$emit('track-generated', {
          name: this.customTrack.name,
          type: this.customTrack.type
        })
        
        // Reset custom track form
        this.customTrack = {
          name: '',
          type: 'sine',
          frequency: 440,
          duration: 30
        }
      } catch (error) {
        console.error('Error generating custom track:', error)
        alert('Error generating custom track. Please try again.')
      } finally {
        this.isGenerating = false
        this.currentTrack = ''
      }
    }
  }
}
</script>

<style scoped>
.sample-tracks {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sample-header {
  text-align: center;
  margin-bottom: 2rem;
}

.sample-title {
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.sample-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin: 0;
}

.sample-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.sample-card {
  background: linear-gradient(145deg, #1a202c, #2d3748);
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;
}

.sample-card:hover {
  transform: translateY(-2px);
}

.sample-info {
  margin-bottom: 1rem;
}

.track-name {
  color: #4ecdc4;
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.track-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.track-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.frequency,
.duration,
.type {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #fff;
}

.sample-actions {
  text-align: center;
}

.generate-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.custom-generator {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-generator h4 {
  color: #ff6b6b;
  font-family: 'Orbitron', monospace;
  margin-bottom: 1rem;
}

.custom-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
}

.control-group input,
.control-group select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.control-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.generate-custom-btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  align-self: end;
}

.generate-custom-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.generate-custom-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.sample-instructions {
  background: rgba(76, 175, 80, 0.1);
  border-left: 4px solid #4caf50;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.sample-instructions h4 {
  color: #4caf50;
  margin-bottom: 0.5rem;
}

.sample-instructions ol {
  color: rgba(255, 255, 255, 0.9);
  padding-left: 1.5rem;
}

.sample-instructions li {
  margin-bottom: 0.5rem;
}

.free-samples-info {
  background: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
  padding: 1rem;
  border-radius: 8px;
}

.free-samples-info h4 {
  color: #ffc107;
  margin-bottom: 0.5rem;
}

.free-samples-info p,
.free-samples-info ul {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.free-samples-info ul {
  padding-left: 1.5rem;
}

.free-samples-info li {
  margin-bottom: 0.3rem;
}

.note {
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .sample-grid {
    grid-template-columns: 1fr;
  }
  
  .custom-controls {
    grid-template-columns: 1fr;
  }
}
</style> 