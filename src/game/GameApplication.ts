import * as PIXI from 'pixi.js';
import { GameApplication } from '../types';

class GameApp implements GameApplication {
  public app: PIXI.Application;
  public currentScene: PIXI.Container;
  public loader: PIXI.Loader;
  public ticker: PIXI.Ticker;

  constructor(canvas: HTMLCanvasElement) {
    // Create PIXI Application
    this.app = new PIXI.Application({
      view: canvas,
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    // Set up basic properties
    this.currentScene = new PIXI.Container();
    this.loader = PIXI.Loader.shared;
    this.ticker = this.app.ticker;

    // Add the current scene to stage
    this.app.stage.addChild(this.currentScene);

    // Make canvas responsive
    this.makeResponsive();

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));

    console.log('PixiJS Game Application initialized');
  }

  private makeResponsive(): void {
    const resize = () => {
      const parent = this.app.view.parentNode as HTMLElement;
      if (parent) {
        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;
        
        // Calculate the scale factor to fit the game within parent
        const scale = Math.min(
          parentWidth / this.app.screen.width,
          parentHeight / this.app.screen.height
        );
        
        // Apply scale to canvas
        this.app.view.style.width = `${this.app.screen.width * scale}px`;
        this.app.view.style.height = `${this.app.screen.height * scale}px`;
      }
    };

    resize();
  }

  private handleResize(): void {
    this.makeResponsive();
  }

  public changeScene(newScene: PIXI.Container): void {
    // Remove current scene
    if (this.currentScene.parent) {
      this.app.stage.removeChild(this.currentScene);
    }
    
    // Set new scene
    this.currentScene = newScene;
    this.app.stage.addChild(this.currentScene);
  }

  public loadAssets(assets: { name: string; url: string }[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Add assets to loader
      assets.forEach(asset => {
        this.loader.add(asset.name, asset.url);
      });

      // Start loading
      this.loader.load((loader, resources) => {
        console.log('Assets loaded:', resources);
        resolve();
      });

      // Handle load errors
      this.loader.onError.add((error) => {
        console.error('Asset loading error:', error);
        reject(error);
      });
    });
  }

  public destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.app.destroy(true, true);
  }
}

export default GameApp;