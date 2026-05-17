const SOUND_SOURCES = {
  buttonClick: '/assets/sounds/buttonclick.mp3',
  levelUp: '/assets/sounds/levelup.mp3',
  questAccepted: '/assets/sounds/quest-accepted.mp3',
} as const

type SoundEffect = keyof typeof SOUND_SOURCES

const POOL_SIZE = 4

const pools = new Map<SoundEffect, HTMLAudioElement[]>()
const nextPoolIndexes = new Map<SoundEffect, number>()

function createAudio(src: string) {
  const audio = new Audio(src)
  audio.preload = 'auto'
  return audio
}

function getAudioPool(effect: SoundEffect) {
  const existingPool = pools.get(effect)

  if (existingPool) {
    return existingPool
  }

  const pool = Array.from({ length: POOL_SIZE }, () => createAudio(SOUND_SOURCES[effect]))
  pools.set(effect, pool)
  nextPoolIndexes.set(effect, 0)
  return pool
}

export function playSoundEffect(effect: SoundEffect) {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return
  }

  const pool = getAudioPool(effect)
  const poolIndex = nextPoolIndexes.get(effect) ?? 0
  const audio = pool[poolIndex] ?? pool[0]

  nextPoolIndexes.set(effect, (poolIndex + 1) % pool.length)

  try {
    audio.currentTime = 0
  } catch {
    // Some browsers disallow seeking until metadata is ready; playback can still proceed.
  }

  void audio.play().catch(() => undefined)
}
