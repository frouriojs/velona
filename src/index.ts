export const depend = <T extends Record<string, any>, U extends any[], V>(
  dependencies: T,
  cb: (deps: T, ...args: U) => V
) => {
  const fn = (...args: U) => cb(dependencies, ...args)
  fn.inject = (deps: Partial<T> | ((d: T) => Partial<T>)) =>
    typeof deps === 'function'
      ? depend({ ...dependencies, ...deps(dependencies) }, cb)
      : depend({ ...dependencies, ...deps }, cb)
  return fn
}
