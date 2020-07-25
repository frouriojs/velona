export const depend = <T, U extends [] | [any, ...any[]], V>(
  cb: (deps: T, ...params: U) => V,
  deps: T
) => {
  const fn = (...args: U) => cb(deps, ...args)
  fn.inject = (d: T) => (...args: U) => cb(d, ...args)
  return fn
}
