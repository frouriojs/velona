type Deps<T extends Record<string, any>> = {
  [P in keyof T]: T[P] extends { _velone: boolean }
    ? (...deps: Parameters<T[P]>) => ReturnType<T[P]>
    : T[P]
}

export const depend = <T extends Record<string, any>, U extends [] | [any, ...any[]], V>(
  dependencies: T,
  cb: (deps: Deps<T>, ...params: U) => V
) => {
  const fn = (...args: U) => cb(dependencies, ...args)
  fn._velone = true
  fn.inject = (deps: Deps<T>) => (...args: U) => cb(deps, ...args)
  return fn
}
