import fs from 'fs';
import { depend } from '../src';

test('inject option args', () => {
  const handler = depend({ print: (text?: string) => alert(text) }, ({ print }, a?: string) => {
    return print(a);
  });

  expect(handler.inject({ print: text => text })('test')).toBe('test');
  expect(handler.inject({ print: text => text })()).toBeUndefined();
});

test('inject add', () => {
  const add = (a: number, b: number) => a + b;
  const basicFn = depend({ add }, ({ add }, a: number, b: number, c: number) => add(a, b) * c);
  const injectedFn = basicFn.inject({ add: (a, b) => a * b });

  expect(injectedFn(2, 3, 4)).toBe(2 * 3 * 4);
  expect(basicFn(2, 3, 4)).toBe((2 + 3) * 4);
});

test('Browser API mocking', () => {
  const handler = depend(
    { print: (text: string) => alert(text) },
    ({ print }, e: Pick<MouseEvent, 'type' | 'x' | 'y'>) =>
      print(`type: ${e.type}, x: ${e.x}, y: ${e.y}`)
  );

  const event = { type: 'click', x: 1, y: 2 };
  expect(() => handler(event)).toThrow();
  expect(handler.inject({ print: text => text })(event)).toBe(
    `type: ${event.type}, x: ${event.x}, y: ${event.y}`
  );
});

test('integration', () => {
  const add = (a: number, b: number) => a + b;
  const grandchild = depend({ add }, ({ add }, a: number, b: number) => add(a, b));
  const child = depend(
    { grandchild },
    ({ grandchild }, a: number, b: number, c: number) => grandchild(a, b) * c
  );
  const parentFn = depend(
    { child, print: (data: number) => alert(data) },
    ({ child, print }, a: number, b: number, c: number) => print(child(a, b, c))
  );

  const childInjected = parentFn.inject({
    child: child.inject({ grandchild: grandchild.inject({ add: (a, b) => a * b }) }),
    print: data => data,
  });
  expect(childInjected(2, 3, 4)).toBe(2 * 3 * 4);
});

type FS = {
  readFile(path: string, option: 'utf8'): Promise<string>;
  writeFile(path: string, text: string, option: 'utf8'): Promise<void>;
};

test('inject fs', async () => {
  const basicFn = depend(fs.promises as FS, async (dependencies, path: string, text: string) => {
    await dependencies.writeFile(path, text, 'utf8');
    return dependencies.readFile(path, 'utf8');
  });

  const data: Record<string, string> = {};
  const injectedFn = basicFn.inject({
    readFile: path => Promise.resolve(data[path]),
    writeFile: (path, text) => {
      data[path] = text;
      return Promise.resolve();
    },
  });

  const text = 'Hello world!';
  await expect(injectedFn('test.txt', text)).resolves.toBe(text);
});
