import CancellationToken from "cancellationtoken";

export async function withCancel<T>(
  cancellationToken: CancellationToken,
  executor: (
    resolve: (value: T) => void,
    reject: (reason?: any) => void,
    onCancelled: (cb: (reason?: any) => void) => void
  ) => void
): Promise<T> {
  const unregister: (() => void)[] = [];
  const onCancelled = (cb: () => void) => {
    unregister.push(cancellationToken.onCancelled(cb));
  };

  try {
    return await cancellationToken.racePromise(
      new Promise((resolve, reject) => executor(resolve, reject, onCancelled))
    );
  } finally {
    unregister.forEach((item) => item());
  }
}
