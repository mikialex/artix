import { makeTerminal, makeNonTerminal } from "./parse-symbol";

const a = makeTerminal('a')
const b = makeTerminal('b')
const X = makeNonTerminal('X')
const S = makeNonTerminal('S')

X.addRule([a, X])
  .addRule([b])

S.addRule([X, X])

test('first set', () => {
  const first = S.getFirstSet();
  expect(first.size).toBe(2);
  expect(first.has(a)).toBe(true);
  expect(first.has(b)).toBe(true);
});
