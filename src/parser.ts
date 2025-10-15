import * as Lambda from "./lambda";

type Parser<T> = (input: string) =>
  | {
      error: false;
      value: T;
      remaining: string;
    }
  | {
      error: true;
      message: string;
    };

const token: (re: RegExp) => Parser<string> = (re) => (input: string) => {
  const match = re.exec(input);
  if (!match) {
    return {
      error: true,
      message: `TOKEN: Failed to match '${re}'`,
    };
  }
  return {
    error: false,
    value: match[0],
    remaining: input.slice(match[0].length),
  };
};

const failure: (message: string) => Parser<any> = (message) => () => ({
  error: true,
  message: `FAILURE: ${message}`,
});
const alt: <T>(...parsers: Parser<T>[]) => Parser<T> =
  (...parsers) =>
  (input) => {
    const messages: string[] = [];
    for (const parser of parsers) {
      const res = parser(input);
      if (res.error) {
        messages.push(res.message);
      } else {
        return res;
      }
    }
    return {
      error: true,
      message: `ALT: All alternatives failed\n${messages
        .map((m) => `  - ${m}`)
        .join("\n")}`,
    };
  };

const success: <T>(value: T) => Parser<T> = (value) => (input) => ({
  error: false,
  value,
  remaining: input,
});
const seq: <A, B>(pf: Parser<(a: A) => B>, pa: Parser<A>) => Parser<B> =
  (pf, pa) => (input) => {
    const f = pf(input);
    if (f.error)
      return {
        error: true,
        message: `SEQ: Failed to parse function\n  - ${f.message}`,
      };
    const a = pa(f.remaining);
    if (a.error)
      return {
        error: true,
        message: `SEQ: Failed to parse argument\n  - ${a.message}`,
      };
    return { error: false, value: f.value(a.value), remaining: a.remaining };
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

const lazy: <T>(thunk: () => Parser<T>) => Parser<T> = (thunk) => (input) =>
  thunk()(input);

const unshift: <T>(x: T) => (xs: T[]) => T[] = (x) => (xs) => [x, ...xs];
const many1: <T>(p: Parser<T>) => Parser<T[]> = (p) =>
  lazy(() => seq(map(unshift, p), many(p)));
const many: <T>(p: Parser<T>) => Parser<T[]> = (p) =>
  lazy(() => alt(many1(p), success([])));

const foldl: <T>(op: (acc: T) => (curr: T) => T) => (list: T[]) => T =
  (op) => (list) =>
    list.reduce((acc, curr) => op(acc)(curr));
const chainl1: <T>(
  p: Parser<T>,
  op: Parser<(a: T) => (b: T) => T>
) => Parser<T> = (p, op) => seq(map(foldl, op), many1(p));

const runParser: <T>(parser: Parser<T>, input: string) => T = (
  parser,
  input
) => {
  const result = parser(input);
  if (result.error) throw new Error(result.message);
  return result.value;
};

const identifier = token(/^[a-z_][a-z_A-Z0-9]*/);
const lambda = token(/^λ|\\/);
const dot = token(/^\.|->/);
const lparen = token(/^\(/);
const rparen = token(/^\)/);

const expression: Parser<Lambda.Expression> = lazy(() =>
  alt(application, term)
);
const variable: Parser<Lambda.Expression> = map(Lambda.variable, identifier);
const abstraction: Parser<Lambda.Expression> = seq(
  map(Lambda.abstraction, seqr(lambda, identifier)),
  seqr(dot, expression)
);
const parens: Parser<Lambda.Expression> = seqr(
  lparen,
  seql(expression, rparen)
);
const term: Parser<Lambda.Expression> = alt(parens, abstraction, variable);
const application: Parser<Lambda.Expression> = chainl1(
  term,
  success(Lambda.application)
);

export function parseExpression(input: string): Lambda.Expression {
  return runParser(expression, input);
}
