# Velona

> TypeScript DI helper for functional programming

[![npm version](https://img.shields.io/npm/v/velona)](https://www.npmjs.com/package/velona)
[![Node.js CI](https://github.com/frouriojs/velona/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/frouriojs/velona/actions?query=workflow%3A%22Node.js+CI%22)
[![Codecov](https://img.shields.io/codecov/c/github/frouriojs/velona.svg)](https://codecov.io/gh/frouriojs/velona)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/frouriojs/velona.svg)](https://lgtm.com/projects/g/frouriojs/velona/context:javascript)
[![License](https://img.shields.io/npm/l/velona)](https://github.com/frouriojs/velona/blob/master/LICENSE)

## Installation

- Using [npm](https://www.npmjs.com/):

  ```sh
  $ npm install velona
  ```

- Using [Yarn](https://yarnpkg.com/):

  ```sh
  $ yarn add velona
  ```

## Usage

`index.ts`
```ts
import { depend } from 'velona'

const add = (a: number, b: number) => a + b

export const basicFn = depend(
  add,
  (dependency, a: number, b: number, c: number) => dependency(a, b) * c
)
```

`sample.ts`
```ts
import { basicFn } from './'

console.log(basicFn(2, 3, 4)) // 20
```

`index.spec.ts`
```ts
import { basicFn } from './'

const injectedFn = basicFn.inject((a, b) => a * b)

expect(injectedFn(2, 3, 4)).toBe(24) // pass
expect(basicFn(2, 3, 4)).toBe(20) // pass
```

## DI to browser API callback

`handler.ts`

```ts
import { depend } from 'velona'

export const handler = depend(
  { print: (text: string) => alert(text) },
  ({ print }, e: Pick<MouseEvent, 'type' | 'x' | 'y'>) => print(`type: ${e.type}, x: ${e.x}, y: ${e.y}`)
)
```

`index.ts`

```ts
import { handler } from './handler'

document.body.addEventListener('click', handler, false)
document.body.click() // alert('type: click, x: 0, y: 0')
```

`index.spec.ts`

```ts
import { handler } from './handler'

const event = { type: 'click', x: 1, y: 2 }

expect(() => handler(event)).toThrow() // ReferenceError: alert is not defined (on Node.js)

const injectedHandler = handler.inject({ print: text => text })

expect(injectedHandler(event)).toBe(
  `type: ${event.type}, x: ${event.x}, y: ${event.y}`
) // pass
```

## Comparison with no DI

`add.ts`
```ts
export const add = (a: number, b: number) => a + b
```

`noDI.ts`
```ts
import { add } from './add'

export const noDIFn = (a: number, b: number, c: number) => add(a, b) * c
```

`index.ts`
```ts
import { depend } from 'velona'
import { add } from './add'

export const basicFn = depend(
  add,
  (dependency, a: number, b: number, c: number) => dependency(a, b) * c
)
```

`sample.ts`
```ts
import { basicFn } from './'
import { noDIFn } from './noDI'

console.log(basicFn(2, 3, 4)) // 20
console.log(noDIFn(2, 3, 4)) // 20
```

`index.spec.ts`
```ts
import { basicFn } from './'
import { noDIFn } from './noDI'

const injectedFn = basicFn.inject((a, b) => a * b)

expect(injectedFn(2, 3, 4)).toBe(24) // pass
expect(basicFn(2, 3, 4)).toBe(20) // pass
expect(noDIFn(2, 3, 4)).toBe(20) // pass
```

## Usage with fs

`index.ts`
```ts
import fs from 'fs'
import { depend } from 'velona'

type FS = {
  readFile(path: string, option: 'utf8'): Promise<string>
  writeFile(path: string, text: string, option: 'utf8'): Promise<void>
}

export const basicFn = depend(
  fs.promises as FS, // downcast for injection
  async (dependencies, path: string, text: string) => {
    await dependencies.writeFile(path, text, 'utf8')
    return dependencies.readFile(path, 'utf8')
  }
)
```

`sample.ts`
```ts
import { basicFn } from './'

const text = await basicFn('sample.txt', 'Hello world!') // create sample.txt
console.log(text) // 'Hello world!'
```

`index.spec.ts`
```ts
import { basicFn } from './'

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
```

## Integration test

`add.ts`

```ts
export const add = (a: number, b: number) => a + b
```

`basicFn.ts`

```ts
import { depend } from 'velona'
import { add } from './add'

export const basicFn = depend(
  add,
  (dependency, a: number, b: number, c: number) => dependency(a, b) * c
)
```

`nestedFn.ts`

```ts
import { depend } from 'velona'
import { add } from './add'
import { basicFn } from './basicFn'

export const nestedFn = depend(
  { add, basicFn, square: (n: number) => n ** 2 },
  ({ add, basicFn, square }, a: number, b: number, c: number) => {
    const injectedBasicFn = basicFn.inject(add)
    return square(injectedBasicFn(a, b, c))
  }
)
```

`nestedFn.spec.ts`

```ts
import { nestedFn } from './nestedFn'

const injectedFn = nestedFn.inject({ ...nestedFn.deps, add: (a, b) => a * b })

expect(nestedFn(2, 3, 4)).toBe(20 ** 2) // pass
expect(injectedFn(2, 3, 4)).toBe(24 ** 2) // pass
```

## License

aspida is licensed under a [MIT License](https://github.com/frouriojs/velona/blob/master/LICENSE).
