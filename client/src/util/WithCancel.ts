export async function withCancel<T>(
  signal: AbortSignal | undefined,
  executor: (
    resolve: (value: T) => void,
    reject: (reason?: any) => void,
    onCancelled: (cb: (reason?: any) => void) => void
  ) => void
): Promise<T> {
  const listeners: EventListener[] = [];
  function onCancelled(cb: () => void) {
    if (signal) {
      const listener: EventListener = (_) => cb();
      listeners.push(listener);
      signal.addEventListener("abort", listener);
    }
  }

  try {
    return await new Promise((resolve, reject) =>
      executor(resolve, reject, onCancelled)
    );
  } finally {
    if (signal) {
      listeners.forEach((listener) =>
        signal.removeEventListener("abort", listener)
      );
    }
  }
}
