/**
 * confetti — AquaLoop Phase 5.1
 *
 * Lightweight, zero-dependency HTML5 Canvas confetti explosion utility.
 * Designed for level-up celebrations, badge unlocks, and daily streak milestones.
 *
 * Features:
 * - 100% vanilla JavaScript with zero external npm dependencies.
 * - Respects prefers-reduced-motion (no-op when reduced motion is preferred).
 * - High-DPI (Retina) screen support using window.devicePixelRatio.
 * - Dynamic window resize handling while active.
 * - Automatic cleanup: cancels requestAnimationFrame and removes canvas from DOM on completion.
 * - Returns a stop() handle for immediate manual cancellation on component unmount.
 */

const DEFAULT_COLORS = [
  '#0097a7', // AquaLoop primary-600
  '#26c6da', // AquaLoop primary-400
  '#80deea', // AquaLoop primary-200
  '#66bb6a', // Leaf green-500
  '#ffca28', // Reward gold-400
  '#f9a825', // Reward gold-600
  '#1e88e5', // Info blue
  '#ffffff', // Sparkle white
]

/**
 * Generates a random float between min and max.
 */
function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

/**
 * Fires a burst of celebratory confetti particles over the viewport.
 *
 * @param {object} [options]
 * @param {number} [options.particleCount=75] - Total number of confetti particles.
 * @param {number} [options.spread=70] - Spread angle of the burst in degrees.
 * @param {number} [options.startVelocity=35] - Initial burst velocity.
 * @param {number} [options.decay=0.92] - Velocity decay factor per frame.
 * @param {number} [options.gravity=0.7] - Downward gravitational pull.
 * @param {string[]} [options.colors=DEFAULT_COLORS] - Array of CSS color hex strings.
 * @param {{x: number, y: number}} [options.origin={x: 0.5, y: 0.6}] - Normalized origin coordinates (0 to 1).
 * @param {number} [options.duration=3000] - Hard maximum duration in milliseconds.
 * @returns {{ stop: () => void }} Controller object with manual stop/cleanup function.
 */
export function fireConfetti(options = {}) {
  // 1. Accessibility: No-op if reduced motion is requested or DOM unavailable
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { stop: () => {} }
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { stop: () => {} }
  }

  const {
    particleCount = 75,
    spread = 70,
    startVelocity = 35,
    decay = 0.92,
    gravity = 0.7,
    colors = DEFAULT_COLORS,
    origin = { x: 0.5, y: 0.6 },
    duration = 3000,
  } = options

  // 2. Create and inject high-DPI overlay canvas
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '99999'

  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    return { stop: () => {} }
  }

  let width = window.innerWidth
  let height = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  function updateCanvasDimensions() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  updateCanvasDimensions()
  window.addEventListener('resize', updateCanvasDimensions)

  // 3. Initialize particles
  const originX = width * origin.x
  const originY = height * origin.y
  const angleRad = -Math.PI / 2 // Upwards (-90 degrees)
  const spreadRad = (spread * Math.PI) / 180

  const particles = []
  for (let i = 0; i < particleCount; i++) {
    const pAngle = angleRad + (Math.random() - 0.5) * spreadRad
    const speed = startVelocity * randomRange(0.6, 1.4)
    const color = colors[Math.floor(Math.random() * colors.length)]

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(pAngle) * speed,
      vy: Math.sin(pAngle) * speed,
      w: randomRange(7, 12),
      h: randomRange(4, 9),
      color,
      rotation: randomRange(0, Math.PI * 2),
      rotationSpeed: randomRange(-0.15, 0.15),
      wobble: randomRange(0, Math.PI * 2),
      wobbleSpeed: randomRange(0.08, 0.16),
      opacity: 1,
      isCircle: Math.random() > 0.65, // Variety: mix of confetti ribbons and water droplet circles
    })
  }

  let animationFrameId = null
  let isCleanedUp = false
  const startTime = performance.now()

  function cleanup() {
    if (isCleanedUp) return
    isCleanedUp = true

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    window.removeEventListener('resize', updateCanvasDimensions)

    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas)
    }
  }

  function frame(now) {
    const elapsed = now - startTime
    if (elapsed > duration || particles.length === 0) {
      cleanup()
      return
    }

    ctx.clearRect(0, 0, width, height)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      // Apply physics
      p.x += p.vx
      p.y += p.vy
      p.vx *= decay
      p.vy = p.vy * decay + gravity
      p.rotation += p.rotationSpeed
      p.wobble += p.wobbleSpeed

      // Fade out over duration
      p.opacity = Math.max(0, 1 - elapsed / duration)

      // Remove particles fallen out of bounds or invisible
      if (p.y > height + 50 || p.opacity <= 0) {
        particles.splice(i, 1)
        continue
      }

      // Render particle
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.scale(Math.cos(p.wobble), 1)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity

      if (p.isCircle) {
        ctx.beginPath()
        ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      }

      ctx.restore()
    }

    animationFrameId = requestAnimationFrame(frame)
  }

  animationFrameId = requestAnimationFrame(frame)

  return {
    stop: cleanup,
  }
}

export default fireConfetti
