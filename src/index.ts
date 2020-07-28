export const depend = <T extends Record<string, any>, U extends [] | [any, ...any[]], V>(
  dependencies: T,
  cb: (deps: T, ...params: U) => V
) => {
  const fn = (...args: U) => cb(dependencies, ...args)
  fn.inject = (partialDeps?: Partial<T>) => {
    const deps = { ...dependencies, ...partialDeps }
    return (...args: U) => cb(deps, ...args)
  }
  return fn
}
