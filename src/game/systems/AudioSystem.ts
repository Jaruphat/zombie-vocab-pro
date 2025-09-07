export class AudioSystem {
  private static instance: AudioSystem;
  private context: AudioContext | null = null;
  private soundsEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private currentMusic: HTMLAudioElement | null = null;
  private musicVolume: number = 0.3;
  private soundVolume: number = 0.5;
  
  static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Simple sound effects using Web Audio API oscillators
  public playShootSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1 * this.soundVolume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  public playHitSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.15 * this.soundVolume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.2);
  }

  public playCorrectAnswerSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    // Rising chord for success
    const frequencies = [523, 659, 784]; // C, E, G
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context!.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context!.currentTime + index * 0.1);
      
      gainNode.gain.setValueAtTime(0.05 * this.soundVolume, this.context!.currentTime + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + index * 0.1 + 0.3);
      
      oscillator.start(this.context!.currentTime + index * 0.1);
      oscillator.stop(this.context!.currentTime + index * 0.1 + 0.3);
    });
  }

  public playWrongAnswerSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(200, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1 * this.soundVolume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.5);
  }

  public playZombieDeathSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    // Create a noise-like sound for zombie death
    const bufferSize = this.context.sampleRate * 0.3;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    gainNode.gain.setValueAtTime(0.05 * this.soundVolume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    
    source.start(this.context.currentTime);
  }

  public playLevelUpSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    // Ascending arpeggio for level up
    const frequencies = [261, 329, 392, 523, 659]; // C, E, G, C, E
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context!.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context!.currentTime + index * 0.1);
      
      gainNode.gain.setValueAtTime(0.08 * this.soundVolume, this.context!.currentTime + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + index * 0.1 + 0.4);
      
      oscillator.start(this.context!.currentTime + index * 0.1);
      oscillator.stop(this.context!.currentTime + index * 0.1 + 0.4);
    });
  }

  public playButtonClickSound(): void {
    if (!this.soundsEnabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.03 * this.soundVolume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  // Control methods
  public setSoundsEnabled(enabled: boolean): void {
    this.soundsEnabled = enabled;
  }

  public getSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }

  public setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  public getSoundVolume(): number {
    return this.soundVolume;
  }

  // Resume audio context (required for some browsers)
  public resumeAudioContext(): void {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // Background Music Methods
  public playBackgroundMusic(src: string, loop: boolean = true): void {
    if (!this.musicEnabled) return;
    
    // Stop current music if playing
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    
    try {
      this.currentMusic = new Audio(src);
      this.currentMusic.volume = this.musicVolume;
      this.currentMusic.loop = loop;
      
      // Play with user interaction handling
      const playPromise = this.currentMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Background music autoplay failed:', error);
          // Music will be played when user interacts with page
        });
      }
    } catch (error) {
      console.warn('Failed to load background music:', error);
    }
  }

  public stopBackgroundMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  public pauseBackgroundMusic(): void {
    if (this.currentMusic && !this.currentMusic.paused) {
      this.currentMusic.pause();
    }
  }

  public resumeBackgroundMusic(): void {
    if (this.currentMusic && this.currentMusic.paused) {
      const playPromise = this.currentMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Failed to resume background music:', error);
        });
      }
    }
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled && this.currentMusic) {
      this.stopBackgroundMusic();
    }
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  // Play menu music
  public playMenuMusic(): void {
    this.playBackgroundMusic('/assets/music/Game-Intro.mp3', true);
  }

  // Play gameplay music
  public playGameplayMusic(): void {
    this.playBackgroundMusic('/assets/music/Zombie_Game_Looping.mp3', true);
  }
}