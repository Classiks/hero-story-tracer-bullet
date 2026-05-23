const SOUND_SOURCES = {
  buttonClick: '/assets/sounds/buttonclick.mp3',
  levelUp: '/assets/sounds/levelup.mp3',
  questAccepted: '/assets/sounds/quest-accepted.mp3',
} as const

type SoundEffect = keyof typeof SOUND_SOURCES

const POOL_SIZE = 4

const pools = new Map<SoundEffect, HTMLAudioElement[]>()
const nextPoolIndexes = new Map<SoundEffect, number>()
let audioContext: AudioContext | null = null
let buttonClickBufferPromise: Promise<AudioBuffer | null> | null = null
let soundEffectsEnabled = true

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

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null
  }

  if (audioContext) {
    return audioContext
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextConstructor) {
    return null
  }

  audioContext = new AudioContextConstructor()
  return audioContext
}

function getButtonClickBuffer(context: AudioContext) {
  if (buttonClickBufferPromise) {
    return buttonClickBufferPromise
  }

  buttonClickBufferPromise = fetch(SOUND_SOURCES.buttonClick)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load sound: ${response.status}`)
      }

      return response.arrayBuffer()
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .catch(() => null)

  return buttonClickBufferPromise
}

function playButtonClickWithWebAudio() {
  const context = getAudioContext()

  if (!context) {
    return false
  }

  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined)
  }

  void getButtonClickBuffer(context).then((buffer) => {
    if (!buffer) {
      return
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.start()
  })

  return true
}

function playWithAudioElement(effect: SoundEffect) {
  if (typeof Audio === 'undefined') {
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

export function playSoundEffect(effect: SoundEffect) {
  if (typeof window === 'undefined' || !soundEffectsEnabled) {
    return
  }

  if (effect === 'buttonClick' && playButtonClickWithWebAudio()) {
    return
  }

  playWithAudioElement(effect)
}

export function setSoundEffectsEnabled(enabled: boolean) {
  soundEffectsEnabled = enabled
}
