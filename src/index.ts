export const depend = <T extends Record<string, any>, U extends [] | [any, ...any[]], V>(
  dependencies: T,
  cb: (deps: T, ...params: U) => V
) => {
  const fn = (...args: U) => cb(dependencies, ...args)
  fn.inject = (deps = dependencies) => (...args: U) => cb(deps, ...args)
  return fn
}
