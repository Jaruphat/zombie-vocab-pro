// Performance optimization utilities for mobile devices

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const lazyLoad = (
  target: HTMLElement,
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback()
        observer.unobserve(target)
      }
    })
  }, options)

  observer.observe(target)
  return observer
}

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(preloadImage))
}

// Memory management
export const clearUnusedMemory = () => {
  // Force garbage collection if available (development only)
  if (typeof window !== 'undefined' && 'gc' in window) {
    ;(window as any).gc()
  }
}

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}

// Device capability detection
export const getDeviceCapabilities = () => {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  
  return {
    webgl: !!gl,
    webgl2: !!canvas.getContext('webgl2'),
    devicePixelRatio: window.devicePixelRatio || 1,
    maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
    cores: navigator.hardwareConcurrency || 1,
    memory: (navigator as any).deviceMemory || 4, // GB estimate
    connectionSpeed: (navigator as any).connection?.effectiveType || 'unknown',
    isLowEndDevice: () => {
      const memory = (navigator as any).deviceMemory || 4
      const cores = navigator.hardwareConcurrency || 1
      return memory <= 2 || cores <= 2
    }
  }
}

// Adaptive quality settings based on device
export const getOptimalSettings = () => {
  const capabilities = getDeviceCapabilities()
  const isLowEnd = capabilities.isLowEndDevice()
  
  return {
    particleCount: isLowEnd ? 50 : 100,
    shadowQuality: isLowEnd ? 'low' : 'high',
    textureQuality: isLowEnd ? 0.5 : 1,
    animationFrameRate: isLowEnd ? 30 : 60,
    enableAntialiasing: !isLowEnd,
    enableBloom: !isLowEnd,
    enableParticles: true,
    maxSounds: isLowEnd ? 3 : 8
  }
}