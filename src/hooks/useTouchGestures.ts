import { useEffect, useRef, useState } from 'react'

interface TouchGesture {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
  onPinch?: (scale: number) => void
  minSwipeDistance?: number
  maxTapTime?: number
  doubleTapDelay?: number
}

export const useTouchGestures = (options: TouchGesture = {}) => {
  const elementRef = useRef<HTMLElement>(null)
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTap = useRef<number>(0)
  const touchCount = useRef<number>(0)
  const [isPinching, setIsPinching] = useState(false)

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onPinch,
    minSwipeDistance = 50,
    maxTapTime = 300,
    doubleTapDelay = 300
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      touchCount.current = e.touches.length
      
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        touchStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        }
        setIsPinching(false)
      } else if (e.touches.length === 2) {
        setIsPinching(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && onPinch) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        // Calculate scale based on initial distance (simplified)
        onPinch(distance / 100) // Normalize for easier handling
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || touchCount.current > 1) {
        setIsPinching(false)
        return
      }

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y
      const deltaTime = Date.now() - touchStart.current.time
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Handle tap gestures
      if (distance < minSwipeDistance && deltaTime < maxTapTime) {
        const now = Date.now()
        
        if (now - lastTap.current < doubleTapDelay && onDoubleTap) {
          onDoubleTap()
          lastTap.current = 0 // Reset to prevent triple-tap
        } else if (onTap) {
          onTap()
          lastTap.current = now
        }
      }
      // Handle swipe gestures
      else if (distance >= minSwipeDistance) {
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)

        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown()
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp()
          }
        }
      }

      touchStart.current = null
      setIsPinching(false)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onPinch,
    minSwipeDistance,
    maxTapTime,
    doubleTapDelay
  ])

  return { elementRef, isPinching }
}