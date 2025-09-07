import { useState, useEffect } from 'react'

interface ViewportInfo {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  isStandalone: boolean
  visualViewport: {
    width: number
    height: number
    offsetLeft: number
    offsetTop: number
    scale: number
  } | null
}

export const useViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const isMobile = width <= 768
    const isTablet = width > 768 && width <= 1024
    const isDesktop = width > 1024
    const orientation = width > height ? 'landscape' : 'portrait'
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      orientation,
      isStandalone,
      visualViewport: window.visualViewport ? {
        width: window.visualViewport.width,
        height: window.visualViewport.height,
        offsetLeft: window.visualViewport.offsetLeft,
        offsetTop: window.visualViewport.offsetTop,
        scale: window.visualViewport.scale
      } : null
    }
  })

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobile = width <= 768
      const isTablet = width > 768 && width <= 1024
      const isDesktop = width > 1024
      const orientation = width > height ? 'landscape' : 'portrait'
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches

      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        isStandalone,
        visualViewport: window.visualViewport ? {
          width: window.visualViewport.width,
          height: window.visualViewport.height,
          offsetLeft: window.visualViewport.offsetLeft,
          offsetTop: window.visualViewport.offsetTop,
          scale: window.visualViewport.scale
        } : null
      })
    }

    const updateVisualViewport = () => {
      if (window.visualViewport) {
        setViewport(prev => ({
          ...prev,
          visualViewport: {
            width: window.visualViewport!.width,
            height: window.visualViewport!.height,
            offsetLeft: window.visualViewport!.offsetLeft,
            offsetTop: window.visualViewport!.offsetTop,
            scale: window.visualViewport!.scale
          }
        }))
      }
    }

    // Listen for resize events
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    
    // Listen for visual viewport changes (keyboard show/hide on mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVisualViewport)
      window.visualViewport.addEventListener('scroll', updateVisualViewport)
    }

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => {
      setViewport(prev => ({
        ...prev,
        isStandalone: mediaQuery.matches
      }))
    }
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange)
    }

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVisualViewport)
        window.visualViewport.removeEventListener('scroll', updateVisualViewport)
      }

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange)
      } else {
        mediaQuery.removeListener(handleDisplayModeChange)
      }
    }
  }, [])

  return viewport
}