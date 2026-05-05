class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
  }

  initContext() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  async play(audioUrl, onEnded, onError) {
    this.stop(); // Strictly stop any existing audio

    try {
      this.initContext();
      
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.crossOrigin = "anonymous";
      
      // Connect to analyser for visualization
      this.source = this.audioContext.createMediaElementSource(this.currentAudio);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.currentAudio.onended = () => {
        this.disconnectSource();
        if (onEnded) onEnded();
      };

      this.currentAudio.onerror = (err) => {
        this.disconnectSource();
        if (onError) onError(err);
      };

      await this.currentAudio.play();
    } catch (err) {
      this.disconnectSource();
      if (onError) onError(err);
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.disconnectSource();
  }

  disconnectSource() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
  }
}

// Export a singleton instance
export const audioManager = new AudioManager();
