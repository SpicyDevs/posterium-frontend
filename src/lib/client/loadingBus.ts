interface LoadingState {
  isActive: boolean;
  progress: number;
}

let pending = 0;
let progress = 0;
let isActive = false;
let trickleTimer: number | null = null;
let hideTimer: number | null = null;

const listeners = new Set<(state: LoadingState) => void>();

const emit = () => {
  const state = { isActive, progress };
  listeners.forEach((listener) => listener(state));
};

const clearTimers = () => {
  if (trickleTimer !== null) {
    window.clearInterval(trickleTimer);
    trickleTimer = null;
  }
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const startTrickle = () => {
  if (trickleTimer !== null) return;
  trickleTimer = window.setInterval(() => {
    if (!isActive) return;
    const next = Math.min(92, progress + (progress < 60 ? 10 : 4));
    if (next !== progress) {
      progress = next;
      emit();
    }
  }, 260);
};

export const beginGlobalLoading = () => {
  pending += 1;
  if (!isActive) {
    isActive = true;
    progress = 12;
    emit();
    startTrickle();
  }

  let done = false;
  return () => {
    if (done) return;
    done = true;
    pending = Math.max(0, pending - 1);
    if (pending > 0) return;

    clearTimers();
    progress = 100;
    emit();
    hideTimer = window.setTimeout(() => {
      progress = 0;
      isActive = false;
      emit();
      hideTimer = null;
    }, 180);
  };
};

export const subscribeLoading = (listener: (state: LoadingState) => void) => {
  listeners.add(listener);
  listener({ isActive, progress });
  return () => {
    listeners.delete(listener);
  };
};
