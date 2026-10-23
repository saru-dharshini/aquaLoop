/**
 * useAnimatedNumber — AquaLoop Phase 5.1
 *
 * Lightweight, zero-dependency custom hook that smoothly interpolates
 * numeric values (such as citizen XP and water litres saved) using requestAnimationFrame.
 *
 * Features:
 * - Respects window.matchMedia('(prefers-reduced-motion: reduce)')
 * - Cubic ease-out deceleration curve for natural momentum
 * - Clean cancellation on component unmount or rapid target value shifts
 * - Configurable decimals, duration, and easing
 */

import { useState, useEffect, useRef } from 'react'

/**
 * Default cubic ease-out curve.
 * @param {number} t - Normalized time (0 to 1).
 * @returns {number} Eased progress (0 to 1).
 */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/**
 * Checks whether the environment prefers reduced motion.
 * @returns {boolean}
 */
function checkPrefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Interpolates numeric values smoothly.
 *
 * @param {number|string} targetValue - Numeric goal to animate towards.
 * @param {object} [options]
 * @param {number} [options.duration=800] - Animation duration in milliseconds.
 * @param {number} [options.decimals=0] - Decimal places to round to.
 * @param {boolean} [options.animateOnMount=true] - Whether to animate from 0 on first mount.
 * @param {function} [options.easing=easeOutCubic] - Custom easing function.
 * @returns {number} The current interpolated numeric value.
 */
export function useAnimatedNumber(targetValue, options = {}) {
  const {
    duration = 800,
    decimals = 0,
    animateOnMount = true,
    easing = easeOutCubic,
  } = options

  const safeTarget = Number.isFinite(Number(targetValue)) ? Number(targetValue) : 0
  const prefersReducedMotion = checkPrefersReducedMotion()

  // Track start position across renders
  const startValRef = useRef(animateOnMount ? 0 : safeTarget)
  const isFirstMountRef = useRef(true)

  const [displayValue, setDisplayValue] = useState(() => {
    if (prefersReducedMotion || !animateOnMount) return safeTarget
    return 0
  })

  useEffect(() => {
    if (prefersReducedMotion) {
      startValRef.current = safeTarget
      return
    }

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      if (!animateOnMount) {
        startValRef.current = safeTarget
        return
      }
    }

    const startVal = startValRef.current
    const delta = safeTarget - startVal

    if (Math.abs(delta) < 0.0001 || duration <= 0) {
      startValRef.current = safeTarget
      return
    }

    let animationFrameId
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easing(progress)
      const current = startVal + delta * eased

      const factor = Math.pow(10, decimals)
      const rounded = Math.round(current * factor) / factor
      setDisplayValue(rounded)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        startValRef.current = safeTarget
        setDisplayValue(safeTarget)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [safeTarget, duration, decimals, animateOnMount, easing, prefersReducedMotion])

  // If user prefers reduced motion, return safeTarget directly
  if (prefersReducedMotion) {
    return safeTarget
  }

  return displayValue
}

export default useAnimatedNumber
