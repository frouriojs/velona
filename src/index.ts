export const depend = <T, U extends [] | [any, ...any[]], V>(
  dependencies: T,
  cb: (deps: T, ...params: U) => V
) => {
  const fn = (...args: U) => cb(dependencies, ...args)
  fn.deps = dependencies
  fn.inject = (deps: T) => (...args: U) => cb(deps, ...args)
  return fn
}
