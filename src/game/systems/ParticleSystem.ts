import * as PIXI from 'pixi.js';

export class ParticleSystem {
  private static instance: ParticleSystem;

  static getInstance(): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem();
    }
    return ParticleSystem.instance;
  }

  createMuzzleFlash(x: number, y: number, container: PIXI.Container): void {
    const flash = new PIXI.Graphics();
    flash.beginFill(0xFFFF00);
    flash.drawCircle(0, 0, 8);
    flash.endFill();
    flash.position.set(x, y);
    flash.alpha = 0.8;
    
    container.addChild(flash);

    // Animate fade out
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      flash.alpha -= 0.1;
      if (flash.alpha <= 0) {
        container.removeChild(flash);
        flash.destroy();
        ticker.destroy();
      }
    });
    ticker.start();
  }

  createHitEffect(x: number, y: number, container: PIXI.Container): void {
    for (let i = 0; i < 5; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(0xFF0000);
      particle.drawCircle(0, 0, 3);
      particle.endFill();
      
      const angle = (Math.PI * 2 * i) / 5;
      const speed = 2 + Math.random() * 3;
      
      particle.position.set(x, y);
      container.addChild(particle);

      const ticker = new PIXI.Ticker();
      ticker.add(() => {
        particle.x += Math.cos(angle) * speed;
        particle.y += Math.sin(angle) * speed;
        particle.alpha -= 0.05;
        
        if (particle.alpha <= 0) {
          container.removeChild(particle);
          particle.destroy();
          ticker.destroy();
        }
      });
      ticker.start();
    }
  }

  createDeathEffect(x: number, y: number, container: PIXI.Container): void {
    for (let i = 0; i < 10; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(0x90EE90);
      particle.drawRect(-2, -2, 4, 4);
      particle.endFill();
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      
      particle.position.set(x, y);
      container.addChild(particle);

      const ticker = new PIXI.Ticker();
      ticker.add(() => {
        particle.x += Math.cos(angle) * speed;
        particle.y += Math.sin(angle) * speed - 2; // gravity
        particle.alpha -= 0.02;
        
        if (particle.alpha <= 0) {
          container.removeChild(particle);
          particle.destroy();
          ticker.destroy();
        }
      });
      ticker.start();
    }
  }

  createSuccessEffect(x: number, y: number, container: PIXI.Container): void {
    const text = new PIXI.Text('✓ CORRECT!', {
      fontSize: 24,
      fill: 0x00FF00,
      fontWeight: 'bold'
    });
    
    text.anchor.set(0.5);
    text.position.set(x, y);
    container.addChild(text);

    const ticker = new PIXI.Ticker();
    let time = 0;
    ticker.add(() => {
      time += 0.1;
      text.y -= 2;
      text.alpha = Math.max(0, 1 - time / 2);
      
      if (text.alpha <= 0) {
        container.removeChild(text);
        text.destroy();
        ticker.destroy();
      }
    });
    ticker.start();
  }

  createFailEffect(x: number, y: number, container: PIXI.Container): void {
    const text = new PIXI.Text('✗ WRONG!', {
      fontSize: 24,
      fill: 0xFF0000,
      fontWeight: 'bold'
    });
    
    text.anchor.set(0.5);
    text.position.set(x, y);
    container.addChild(text);

    const ticker = new PIXI.Ticker();
    let time = 0;
    ticker.add(() => {
      time += 0.1;
      text.y -= 1;
      text.alpha = Math.max(0, 1 - time / 2);
      
      if (text.alpha <= 0) {
        container.removeChild(text);
        text.destroy();
        ticker.destroy();
      }
    });
    ticker.start();
  }
}