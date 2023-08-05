export type Injectable<T, U extends any[], V> = {
  (...args: U): V;
  inject: (deps: Partial<T> | ((d: T) => Partial<T>)) => Injectable<T, U, V>;
};

export const depend = <T extends Record<string, any>, U extends any[], V>(
  dependencies: T,
  cb: (deps: T, ...args: U) => V
): Injectable<T, U, V> => {
  const fn = (...args: U) => cb(dependencies, ...args);
  fn.inject = (deps: Partial<T> | ((d: T) => Partial<T>)) =>
    typeof deps === 'function'
      ? depend({ ...dependencies, ...deps(dependencies) }, cb)
      : depend({ ...dependencies, ...deps }, cb);
  return fn;
};
