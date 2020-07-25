import fs from 'fs'
import { depend } from '../src'

test('inject add', () => {
  const add = (a: number, b: number) => a + b

  const timesAfterAdd = depend(
    (injectedAdd, a: number, b: number, c: number) => injectedAdd(a, b) * c,
    add
  )

  const injectedFn = timesAfterAdd.inject(() => 4)

  expect(injectedFn(1, 2, 3)).toBe(12)
  expect(timesAfterAdd(1, 2, 3)).toBe(9)
})

type FS = {
  readFile(path: string, option: 'utf8'): Promise<string>
  writeFile(path: string, data: string, option: 'utf8'): Promise<void>
}

test('inject fs', async () => {
  const readAfterWrite = depend(async (injectedFS, path: string, text: string) => {
    await injectedFS.writeFile(path, text, 'utf8')
    return injectedFS.readFile(path, 'utf8')
  }, fs.promises as FS)

  let tmp = ''
  const injectedFn = readAfterWrite.inject({
    readFile: () => Promise.resolve(tmp),
    writeFile: (_: string, text: string) => {
      tmp = text
      return Promise.resolve()
    }
  })

  const data = 'abc'
  await expect(injectedFn('', data)).resolves.toBe(data)
})
