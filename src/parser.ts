import * as Lambda from "./lambda";

type Parser<T> = (input: string) => [T, string] | null;

const token: (re: RegExp) => Parser<string> = (re) => (input: string) => {
  const match = re.exec(input);
  return match && match.index === 0
    ? [match[0], input.slice(match[0].length)]
    : null;
};

const failure: Parser<any> = (_) => null;
const alt: <T>(...parsers: Parser<T>[]) => Parser<T> =
  (...parsers) =>
  (input) => {
    for (const parser of parsers) {
      const res = parser(input);
      if (res) return res;
    }
    return null;
  };

const success: <T>(value: T) => Parser<T> = (value) => (input) =>
  [value, input];
const seq: <A, B>(pf: Parser<(a: A) => B>, pa: Parser<A>) => Parser<B> =
  (pf, pa) => (input) => {
    const resF = pf(input);
    if (!resF) return null;
    const [f, restF] = resF;
    const resA = pa(restF);
    if (!resA) return null;
    const [a, restA] = resA;
    return [f(a), restA];
  };

const map: <A, B>(fn: (a: A) => B, parser: Parser<A>) => Parser<B> = (
  fn,
  parser
) => seq(success(fn), parser);
const seql: <A, B>(pa: Parser<A>, pb: Parser<B>) => Parser<A> = (pa, pb) =>
  seq(
    map((a) => (_) => a, pa),
    pb
  );
const seqr: <A, B>(pa: Parser<A>, pb: Parser<B>) => Parser<B> = (pa, pb) =>
  seq(
    map((_) => (b) => b, pa),
    pb
  );

const complete: <T>(parser: Parser<T>) => Parser<T> = (parser) => (input) => {
  const res = parser(input);
  if (!res) return null;
  const [value, rest] = res;
  return rest.length === 0 ? [value, rest] : null;
};

function runParser<T>(parser: Parser<T>, input: string): T | null {
  return parser(input)?.[0] ?? null;
}

const any = token(/^.+/);
const whitespace = token(/^\s+|/);
const identifier = token(/^[a-z_][a-z_A-Z0-9]*/);
const lambda = token(/^λ|\\/);
const dot = token(/^\.|->/);
const lparen = token(/^\(/);
const rparen = token(/^\)/);

const variable: Parser<Lambda.Variable> = map(Lambda.variable, identifier);

const example = "      (λx. (λy. (x y))) (λz. z)";
console.log(any(example));
console.log(seqr(whitespace, any)(example));
