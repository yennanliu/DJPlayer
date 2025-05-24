// Audio Generator Utility for creating test tracks
export class AudioGenerator {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.sampleRate = this.audioContext.sampleRate
  }

  // Generate a simple sine wave tone
  generateTone(frequency = 440, duration = 30, type = 'sine') {
    const length = this.sampleRate * duration
    const buffer = this.audioContext.createBuffer(2, length, this.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const time = i / this.sampleRate
        let sample = 0
        
        switch (type) {
          case 'sine':
            sample = Math.sin(2 * Math.PI * frequency * time)
            break
          case 'square':
            sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1
            break
          case 'sawtooth':
            sample = 2 * (time * frequency - Math.floor(time * frequency + 0.5))
            break
          case 'triangle':
            sample = 2 * Math.abs(2 * (time * frequency - Math.floor(time * frequency + 0.5))) - 1
            break
        }
        
        // Add some envelope to avoid clicks
        const envelope = Math.min(1, Math.min(time * 10, (duration - time) * 10))
        channelData[i] = sample * envelope * 0.3 // Reduce volume
      }
    }
    
    return buffer
  }

  // Generate a simple drum beat pattern
  generateDrumBeat(bpm = 120, duration = 30) {
    const length = this.sampleRate * duration
    const buffer = this.audioContext.createBuffer(2, length, this.sampleRate)
    const beatInterval = (60 / bpm) * this.sampleRate // samples per beat
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)
      
      for (let i = 0; i < length; i++) {
        const beatPosition = (i % beatInterval) / beatInterval
        const beatNumber = Math.floor(i / beatInterval) % 4
        
        let sample = 0
        
        // Kick drum on beats 1 and 3
        if ((beatNumber === 0 || beatNumber === 2) && beatPosition < 0.1) {
          sample += Math.sin(2 * Math.PI * 60 * beatPosition * 10) * 
                   Math.exp(-beatPosition * 20) * 0.8
        }
        
        // Snare on beats 2 and 4
        if ((beatNumber === 1 || beatNumber === 3) && beatPosition < 0.1) {
          sample += (Math.random() * 2 - 1) * Math.exp(-beatPosition * 15) * 0.6
        }
        
        // Hi-hat on every eighth note
        if (beatPosition < 0.05 && Math.floor((i % (beatInterval / 2)) / (beatInterval / 8)) === 0) {
          sample += (Math.random() * 2 - 1) * Math.exp(-beatPosition * 30) * 0.3
        }
        
        channelData[i] = sample * 0.5
      }
    }
    
    return buffer
  }

  // Convert AudioBuffer to downloadable blob
  bufferToWav(buffer) {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)
    
    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  // Generate and download a sample track
  generateSampleTrack(name, type, frequency, duration) {
    let buffer
    
    if (type === 'drum') {
      buffer = this.generateDrumBeat(frequency, duration)
    } else {
      buffer = this.generateTone(frequency, duration, type)
    }
    
    const blob = this.bufferToWav(buffer)
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.wav`
    a.click()
    
    URL.revokeObjectURL(url)
  }
}

// Predefined sample tracks
export const SAMPLE_TRACKS = [
  {
    name: 'Bass Drop',
    type: 'sine',
    frequency: 80,
    duration: 30,
    description: 'Deep bass sine wave for testing low frequencies'
  },
  {
    name: 'Synth Lead',
    type: 'sawtooth',
    frequency: 440,
    duration: 30,
    description: 'Sawtooth wave lead sound'
  },
  {
    name: 'High Synth',
    type: 'square',
    frequency: 880,
    duration: 30,
    description: 'High-pitched square wave'
  },
  {
    name: 'Drum Beat 120',
    type: 'drum',
    frequency: 120,
    duration: 30,
    description: '120 BPM drum pattern with kick, snare, and hi-hat'
  },
  {
    name: 'Drum Beat 128',
    type: 'drum',
    frequency: 128,
    duration: 30,
    description: '128 BPM drum pattern for house music'
  },
  {
    name: 'Test Tone A',
    type: 'triangle',
    frequency: 220,
    duration: 30,
    description: 'Triangle wave at 220Hz'
  }
] 