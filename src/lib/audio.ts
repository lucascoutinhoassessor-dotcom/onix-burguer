// ---------------------------------------------------------------------------
// Doorbell audio for new order notifications
// ---------------------------------------------------------------------------

let bellAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!bellAudio) {
    bellAudio = new Audio("/audio/audio de campainha.mp3");
    bellAudio.preload = "auto";
    bellAudio.volume = 1.0;
  }
  return bellAudio;
}

export function playDoorbell() {
  try {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // audio not available / blocked
  }
}
