// The signal when a step timer ends: three short chimes and a buzz, each
// only where the device supports it.

let audio: AudioContext | null = null

// Browsers only allow sound after a tap, so this is called from the tap that
// starts a timer, and the alarm can play later when it ends.
export function primeAlarm() {
  if (!('AudioContext' in window)) return
  audio ??= new AudioContext()
  void audio.resume()
}

export function soundAlarm() {
  navigator.vibrate?.([300, 150, 300, 150, 300])
  if (!audio) return
  const start = audio.currentTime + 0.05
  for (let i = 0; i < 3; i++) {
    const at = start + i * 0.45
    const tone = audio.createOscillator()
    const volume = audio.createGain()
    tone.type = 'sine'
    tone.frequency.value = 880
    volume.gain.setValueAtTime(0.0001, at)
    volume.gain.exponentialRampToValueAtTime(0.3, at + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.35)
    tone.connect(volume).connect(audio.destination)
    tone.start(at)
    tone.stop(at + 0.4)
  }
}
