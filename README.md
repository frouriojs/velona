<br />
<img src="https://frouriojs.github.io/velona/assets/images/ogp.png" width="1280" alt="velona" />

<div align="center">
  <a href="https://www.npmjs.com/package/velona">
    <img src="https://img.shields.io/npm/v/velona" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/velona">
    <img src="https://img.shields.io/npm/dm/velona" alt="npm download" />
  </a>
</div>

<p align="center">Velona is TypeScript DI helper for functional programming.</p>
<br />
<br />
<br />

## Table of Contents

- [Installation](#Installation)
- [Usage](#Usage)
- [DI to browser API callback](#browser)
- [Comparison with no DI](#Comparison)
- [Usage with fs](#fs)
- [Usage with prisma](#prisma)
- [Integration test](#integration)

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
import { depend } from "velona";

const add = (a: number, b: number) => a + b;

export const basicFn = depend({ add }, ({ add }, a: number, b: number, c: number) => add(a, b) * c);
```

`sample.ts`

```ts
import { basicFn } from "./";

console.log(basicFn(2, 3, 4)); // 20
```

`index.spec.ts`

```ts
import { basicFn } from "./";

const injectedFn = basicFn.inject({ add: (a, b) => a * b });

expect(injectedFn(2, 3, 4)).toBe(2 * 3 * 4); // pass
expect(basicFn(2, 3, 4)).toBe((2 + 3) * 4); // pass
```

<a id="browser"></a>

## DI to browser API callback

`handler.ts`

```ts
import { depend } from "velona";

export const handler = depend(
  { print: (text: string) => alert(text) },
  ({ print }, e: Pick<MouseEvent, "type" | "x" | "y">) =>
    print(`type: ${e.type}, x: ${e.x}, y: ${e.y}`)
);
```

`index.ts`

```ts
import { handler } from "./handler";

document.body.addEventListener("click", handler, false);
document.body.click(); // alert('type: click, x: 0, y: 0')
```

`index.spec.ts`

```ts
import { handler } from "./handler";

const event = { type: "click", x: 1, y: 2 };

expect(() => handler(event)).toThrow(); // ReferenceError: alert is not defined (on Node.js)

const injectedHandler = handler.inject({ print: text => text });

expect(injectedHandler(event)).toBe(`type: ${event.type}, x: ${event.x}, y: ${event.y}`); // pass
```

<a id="Comparison"></a>

## Comparison with no DI

`add.ts`

```ts
export const add = (a: number, b: number) => a + b;
```

`noDI.ts`

```ts
import { add } from "./add";

export const noDIFn = (a: number, b: number, c: number) => add(a, b) * c;
```

`index.ts`

```ts
import { depend } from "velona";
import { add } from "./add";

export const basicFn = depend({ add }, ({ add }, a: number, b: number, c: number) => add(a, b) * c);
```

`sample.ts`

```ts
import { basicFn } from "./";
import { noDIFn } from "./noDI";

console.log(basicFn(2, 3, 4)); // 20
console.log(noDIFn(2, 3, 4)); // 20
```

`index.spec.ts`

```ts
import { basicFn } from "./";
import { noDIFn } from "./noDI";

const injectedFn = basicFn.inject({ add: (a, b) => a * b });

expect(injectedFn(2, 3, 4)).toBe(2 * 3 * 4); // pass
expect(basicFn(2, 3, 4)).toBe((2 + 3) * 4); // pass
expect(noDIFn(2, 3, 4)).toBe((2 + 3) * 4); // pass
```

<a id="fs"></a>

## Usage with fs

`index.ts`

```ts
import fs from "fs";
import { depend } from "velona";

type FS = {
  readFile(path: string, option: "utf8"): Promise<string>;
  writeFile(path: string, text: string, option: "utf8"): Promise<void>;
};

export const basicFn = depend(
  fs.promises as FS, // downcast for injection
  async (dependencies, path: string, text: string) => {
    await dependencies.writeFile(path, text, "utf8");
    return dependencies.readFile(path, "utf8");
  }
);
```

`sample.ts`

```ts
import { basicFn } from "./";

const text = await basicFn("sample.txt", "Hello world!"); // create sample.txt
console.log(text); // 'Hello world!'
```

`index.spec.ts`

```ts
import { basicFn } from "./";

const data: Record<string, string> = {};
const injectedFn = basicFn.inject({
  readFile: path => Promise.resolve(data[path]),
  writeFile: (path, text) => {
    data[path] = text;
    return Promise.resolve();
  },
});

const text = "Hello world!";
await expect(injectedFn("test.txt", text)).resolves.toBe(text);
```

<a id="prisma"></a>

## Usage with prisma

`tasks.ts`

```ts
import { depend } from "velona";
import { PrismaClient } from "@prisma/client";

type Task = {
  id: number;
  label: string;
  done: boolean;
};

const prisma = new PrismaClient();

export const getTasks = depend(
  { prisma: prisma as { task: { findMany(): Promise<Task[]> } } }, // inject prisma
  ({ prisma }) => prisma.task.findMany() // prisma is injected object
);
```

`tasks.spec.ts`

```ts
import { getTasks } from "$/service/tasks";

const injectedGetTasks = getTasks.inject({
  prisma: {
    task: {
      findMany: () =>
        Promise.resolve([
          { id: 0, label: "task1", done: false },
          { id: 1, label: "task2", done: false },
          { id: 2, label: "task3", done: true },
          { id: 3, label: "task4", done: true },
          { id: 4, label: "task5", done: false },
        ]),
    },
  },
});

await expect(injectedGetTasks()).resolves.toHaveLength(5);
```

<a id="integration"></a>

## Integration test

`add.ts`

```ts
export const add = (a: number, b: number) => a + b;
```

`grandchild.ts`

```ts
import { depend } from "velona";
import { add } from "./add";

export const grandchild = depend({ add }, ({ add }, a: number, b: number) => add(a, b));
```

`child.ts`

```ts
import { depend } from "velona";
import { grandchild } from "./grandchild";

export const child = depend(
  { grandchild },
  ({ grandchild }, a: number, b: number, c: number) => grandchild(a, b) * c
);
```

`parentFn.ts`

```ts
import { depend } from "velona";
import { child } from "./child";

export const parentFn = depend(
  { child, print: (data: number) => alert(data) },
  ({ child, print }, a: number, b: number, c: number) => print(child(a, b, c))
);
```

`index.ts`

```ts
import { parentFn } from "./parentFn";

parentFn(2, 3, 4); // alert(20)
```

`parentFn.spec.ts`

```ts
import { parentFn } from "./parentFn";

const injectedFn = parentFn.inject(parentDeps => ({
  child: parentDeps.child.inject(childDeps => ({
    grandchild: clildDeps.grandchild.inject({
      add: (a, b) => a * b,
    }),
  })),
  print: data => data,
}));

expect(injectedFn(2, 3, 4)).toBe(2 * 3 * 4); // pass
```

## License

Velona is licensed under a [MIT License](https://github.com/frouriojs/velona/blob/master/LICENSE).
