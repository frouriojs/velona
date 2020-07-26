import fs from 'fs'
import { depend } from '../src'

test('inject add', () => {
  const add = (a: number, b: number) => a + b

  const basicFn = depend((dependency, a: number, b: number, c: number) => dependency(a, b) * c, add)

  const injectedFn = basicFn.inject((a, b) => a * b)

  expect(injectedFn(2, 3, 4)).toBe(24)
  expect(basicFn(2, 3, 4)).toBe(20)
})

type FS = {
  readFile(path: string, option: 'utf8'): Promise<string>
  writeFile(path: string, text: string, option: 'utf8'): Promise<void>
}

test('inject fs', async () => {
  const basicFn = depend(async (dependencies, path: string, text: string) => {
    await dependencies.writeFile(path, text, 'utf8')
    return dependencies.readFile(path, 'utf8')
  }, fs.promises as FS)

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
