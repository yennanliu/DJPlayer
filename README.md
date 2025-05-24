# 🎧 DJ Player - Vue 2

A modern, feature-rich DJ Player built with Vue 2 that allows you to mix tracks like a professional DJ. This frontend-only application provides dual decks, mixing controls, audio visualization, and all the essential DJ features you need.

## ✨ Features

### 🎵 Dual Deck System
- **Deck A & Deck B**: Load and control two audio tracks simultaneously
- **Individual Controls**: Each deck has its own set of controls and indicators
- **Visual Feedback**: LED-style indicators show deck activity status

### 🎛️ Professional Mixer
- **Crossfader**: Seamlessly blend between Deck A and Deck B
- **Master Volume**: Control the overall output level
- **BPM Display**: Real-time BPM monitoring and display

### 🎚️ Advanced Deck Controls
- **File Loading**: Drag and drop or browse for audio files (MP3, WAV, OGG)
- **Transport Controls**: Play, Pause, Stop, and Cue functions
- **Progress Bar**: Visual timeline with click-to-seek functionality
- **Volume Control**: Individual volume sliders for each deck
- **Tempo Control**: Adjust playback speed from 50% to 150%
- **3-Band EQ**: High, Mid, and Low frequency controls
- **Hot Cues**: Set and trigger up to 4 cue points per deck

### 📊 Audio Visualization
- **Real-time Waveform**: Live frequency spectrum visualization
- **Dual Display**: Separate visualization for each deck
- **Color-coded**: Deck A (red) and Deck B (teal) for easy identification

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Theme**: Professional DJ-style dark interface
- **Gradient Accents**: Beautiful color gradients and glowing effects
- **Futuristic Typography**: Orbitron font for that electronic music vibe

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd DJPlayer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080` to see the DJ Player in action!

## 🎮 How to Use

### Getting Sample Tracks
1. **Generate Test Tracks**: Use the built-in Sample Track Generator to create test audio files
   - Choose from preset tracks (Bass Drop, Synth Lead, Drum Beats, etc.)
   - Or create custom tracks with your own parameters
   - Download the generated WAV files to your computer
2. **Use Real Music**: Check the `public/samples/README.md` for free music resources

### Loading Tracks
1. Click the "📁 Load Track" button on either Deck A or Deck B
2. Select an audio file from your computer (MP3, WAV, OGG formats supported)
3. The track name and duration will appear once loaded

### Playing Music
1. **Play/Pause**: Click the ▶️/⏸️ button to start or pause playback
2. **Stop**: Click the ⏹️ button to stop and return to the beginning
3. **Cue**: Click the "CUE" button to return to the start of the track

### Mixing Tracks
1. **Crossfader**: Use the horizontal slider in the mixer to blend between decks
   - Far left: Only Deck A audible
   - Center: Both decks at equal volume
   - Far right: Only Deck B audible
2. **Master Volume**: Control the overall output level
3. **Individual Deck Volumes**: Adjust each deck's volume independently

### Advanced Features

#### Tempo Control
- Use the +/- buttons for fine tempo adjustments
- Use the tempo slider for larger changes
- Range: 50% to 150% of original speed
- BPM display updates in real-time

#### EQ Controls
- **High**: Boost or cut high frequencies
- **Mid**: Boost or cut mid frequencies  
- **Low**: Boost or cut low frequencies
- Range: -20dB to +20dB

#### Hot Cues
- **Set Cue**: Click a numbered button (1-4) to set a cue point at current position
- **Jump to Cue**: Double-click a numbered button to jump to that cue point
- **Visual Feedback**: Active cue points glow red

#### Progress Navigation
- Click anywhere on the progress bar to seek to that position
- Visual handle shows current playback position

## 🛠️ Technical Details

### Built With
- **Vue 2**: Progressive JavaScript framework
- **Web Audio API**: For advanced audio processing and visualization
- **HTML5 Audio**: For audio playback functionality
- **CSS3**: Modern styling with gradients and animations
- **Webpack**: Module bundler and development server

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

*Note: Some features may require modern browser support for Web Audio API*

### File Format Support
- **MP3**: Most widely supported format
- **WAV**: Uncompressed audio for best quality
- **OGG**: Open-source audio format

## 📱 Responsive Design

The DJ Player is fully responsive and adapts to different screen sizes:
- **Desktop**: Full dual-deck layout with all controls visible
- **Tablet**: Optimized layout with adjusted spacing
- **Mobile**: Stacked deck layout for easier touch interaction

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Serve development build
npm run serve
```

## 🎨 Customization

The application uses CSS custom properties and can be easily customized:
- Colors and gradients in the CSS variables
- Layout adjustments in the component styles
- Typography changes in the font imports

## 🤝 Contributing

Feel free to contribute to this project by:
1. Reporting bugs
2. Suggesting new features
3. Submitting pull requests
4. Improving documentation

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Web Audio API for powerful audio processing capabilities
- Google Fonts for the Orbitron and Roboto typefaces

---

**Happy Mixing! 🎉🎵**

*Turn up the volume and let the beats drop!*