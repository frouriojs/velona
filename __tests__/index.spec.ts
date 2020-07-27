import fs from 'fs'
import { depend } from '../src'

test('inject add', () => {
  const add = (a: number, b: number) => a + b
  const basicFn = depend(add, (dependency, a: number, b: number, c: number) => dependency(a, b) * c)
  const injectedFn = basicFn.inject((a, b) => a * b)

  expect(injectedFn(2, 3, 4)).toBe(24)
  expect(basicFn(2, 3, 4)).toBe(20)
})

test('DOM API mocking', () => {
  const handler = depend(
    { print: (text: string) => alert(text) },
    ({ print }, e: Pick<MouseEvent, 'type' | 'x' | 'y'>) =>
      print(`type: ${e.type}, x: ${e.x}, y: ${e.y}`)
  )

  const event = { type: 'click', x: 1, y: 2 }
  expect(() => handler(event)).toThrow()
  expect(handler.inject({ print: text => text })(event)).toBe(
    `type: ${event.type}, x: ${event.x}, y: ${event.y}`
  )
})

test('integration', () => {
  const add = (a: number, b: number) => a + b
  const basicFn = depend(add, (dependency, a: number, b: number, c: number) => dependency(a, b) * c)
  const deps = { add, basicFn, square: (n: number) => n ** 2 }
  const nestedFn = depend(deps, ({ add, basicFn, square }, a: number, b: number, c: number) =>
    square(basicFn.inject(add)(a, b, c))
  )
  const injectedFn = nestedFn.inject({ ...deps, add: (a, b) => a * b })

  expect(nestedFn(2, 3, 4)).toBe(20 ** 2)
  expect(injectedFn(2, 3, 4)).toBe(24 ** 2)
})

type FS = {
  readFile(path: string, option: 'utf8'): Promise<string>
  writeFile(path: string, text: string, option: 'utf8'): Promise<void>
}

test('inject fs', async () => {
  const basicFn = depend(fs.promises as FS, async (dependencies, path: string, text: string) => {
    await dependencies.writeFile(path, text, 'utf8')
    return dependencies.readFile(path, 'utf8')
  })

  const data: Record<string, string> = {}
  const injectedFn = basicFn.inject({
    readFile: path => Promise.resolve(data[path]),
    writeFile: (path, text) => {
      data[path] = text
      return Promise.resolve()
    }
  })

  const text = 'Hello world!'
  await expect(injectedFn('test.txt', text)).resolves.toBe(text)
})
