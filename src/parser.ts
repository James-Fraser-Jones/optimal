import * as Lambda from "./lambda";

//=== utils ===//

const cons: <T>(x: T) => (xs: T[]) => T[] = (x) => (xs) => [x, ...xs];

const foldl: <T>(op: (acc: T) => (curr: T) => T) => (list: T[]) => T =
  (op) => (list) =>
    list.reduce((acc, curr) => op(acc)(curr));

const concat: (arr: string[]) => string = (arr) => arr.join("");

//=== parser type and runner ===//

type Parser<T, U> = (input: U[]) =>
  | {
      error: false;
      value: T;
      remaining: U[];
    }
  | {
      error: true;
      message: string;
    };

const runParser: <T, U>(parser: Parser<T, U>, input: U[]) => T = (
  parser,
  input
) => {
  const result = parser(input);
  if (result.error) throw new Error(result.message);
  return result.value;
};

//=== fundamental parser combinators ===//

const failure: (message: string) => Parser<any, any> = (message) => () => ({
  error: true,
  message: `FAILURE: ${message}`,
});

const success: <T, U>(value: T) => Parser<T, U> = (value) => (input) => ({
  error: false,
  value,
  remaining: input,
});

function satisfy<T extends U, U>(cond: (b: U) => b is T): Parser<T, U>;
function satisfy<T>(cond: (b: T) => boolean): Parser<T, T>;
function satisfy<T>(cond: (b: T) => boolean): Parser<T, T> {
  return (input) => {
    const first = input[0];
    if (first === undefined) {
      return {
        error: true,
        message: `SATISFY: Unexpected end of input`,
      };
    }
    if (!cond(first)) {
      return {
        error: true,
        message: `SATISFY: Failed to satisfy condition at\n  - ${input}`,
      };
    }
    return {
      error: false,
      value: first,
      remaining: input.slice(1),
    };
  };
}

const seq: <A, B, U>(
  pf: Parser<(a: A) => B, U>,
  pa: Parser<A, U>
) => Parser<B, U> = (pf, pa) => (input) => {
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

const alt: <T, U>(...parsers: Parser<T, U>[]) => Parser<T, U> =
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

const complete: <T, U>(parser: Parser<T, U>) => Parser<T, U> =
  (parser) => (input) => {
    const result = parser(input);
    if (result.error) return result;
    if (result.remaining.length > 0) {
      return {
        error: true,
        message: `COMPLETE: Parser did not consume entire input\n  - Remaining: ${result.remaining}`,
      };
    }
    return result;
  };

const lazy: <T, U>(thunk: () => Parser<T, U>) => Parser<T, U> =
  (thunk) => (input) =>
    thunk()(input);

//=== auxillary parser combinators ===//

const char: (c: string) => Parser<string, string> = (c) =>
  satisfy((x) => x === c);

const charRange: (from: string, to: string) => Parser<string, string> = (
  from,
  to
) => satisfy((c) => c >= from && c <= to);

const map: <A, B, U>(fn: (a: A) => B, parser: Parser<A, U>) => Parser<B, U> = (
  fn,
  parser
) => seq(success(fn), parser);

const seql: <A, B, U>(pa: Parser<A, U>, pb: Parser<B, U>) => Parser<A, U> = (
  pa,
  pb
) =>
  seq(
    map((a) => (_) => a, pa),
    pb
  );

const seqr: <A, B, U>(pa: Parser<A, U>, pb: Parser<B, U>) => Parser<B, U> = (
  pa,
  pb
) =>
  seq(
    map((_) => (b) => b, pa),
    pb
  );

const many1: <T, U>(p: Parser<T, U>) => Parser<T[], U> = (p) =>
  lazy(() => seq(map(cons, p), many(p)));

const many: <T, U>(p: Parser<T, U>) => Parser<T[], U> = (p) =>
  lazy(() => alt(many1(p), success([])));

const chainl1: <T, U>(
  p: Parser<T, U>,
  op: Parser<(a: T) => (b: T) => T, U>
) => Parser<T, U> = (p, op) => seq(map(foldl, op), many1(p));

//=== lambda calculus tokenization ===//

const lambda = char("λ");

const dot = char(".");

const lparen = char("(");

const rparen = char(")");

const identifierHead = alt(charRange("a", "z"), char("_"));

const identifierTail = many(
  alt(charRange("a", "z"), char("_"), charRange("A", "Z"), charRange("0", "9"))
);

const identifier = map(concat, seq(map(cons, identifierHead), identifierTail));

const whitespace = map(
  concat,
  many1(
    alt(char(" "), char("\n"), char("\t"), char("\r"), char("\v"), char("\f"))
  )
);

interface IdentifierToken {
  kind: "identifier";
  identifier: string;
}

interface LambdaToken {
  kind: "lambda";
}

interface DotToken {
  kind: "dot";
}

interface LParenToken {
  kind: "lparen";
}

interface RParenToken {
  kind: "rparen";
}

interface WhitespaceToken {
  kind: "whitespace";
  whitespace: string;
}

type ExpressionToken =
  | IdentifierToken
  | LambdaToken
  | DotToken
  | LParenToken
  | RParenToken
  | WhitespaceToken;

const tokens: Parser<ExpressionToken[], string> = many(
  alt<ExpressionToken, string>(
    map((identifier) => ({ kind: "identifier", identifier }), identifier),
    seqr(lambda, success({ kind: "lambda" })),
    seqr(dot, success({ kind: "dot" })),
    seqr(lparen, success({ kind: "lparen" })),
    seqr(rparen, success({ kind: "rparen" })),
    map((whitespace) => ({ kind: "whitespace", whitespace }), whitespace)
  )
);

const identifierToken: Parser<IdentifierToken, ExpressionToken> = satisfy(
  (t) => t.kind === "identifier"
);

const lambdaToken: Parser<LambdaToken, ExpressionToken> = satisfy(
  (t) => t.kind === "lambda"
);

const dotToken: Parser<DotToken, ExpressionToken> = satisfy(
  (t) => t.kind === "dot"
);

const lparenToken: Parser<LParenToken, ExpressionToken> = satisfy(
  (t) => t.kind === "lparen"
);

const rparenToken: Parser<RParenToken, ExpressionToken> = satisfy(
  (t) => t.kind === "rparen"
);

//=== lambda calculus parsing ===//

const expression: Parser<Lambda.Expression, ExpressionToken> = lazy(() =>
  alt(application, term)
);

const variable: Parser<Lambda.Expression, ExpressionToken> = map(
  Lambda.variable,
  map((t: IdentifierToken) => t.identifier, identifierToken)
);

const abstraction: Parser<Lambda.Expression, ExpressionToken> = seq(
  map(
    Lambda.abstraction,
    map(
      (t: IdentifierToken) => t.identifier,
      seql(seqr(lambdaToken, identifierToken), dotToken)
    )
  ),
  expression
);

const parens: Parser<Lambda.Expression, ExpressionToken> = seqr(
  lparenToken,
  seql(expression, rparenToken)
);

const term: Parser<Lambda.Expression, ExpressionToken> = alt(
  parens,
  abstraction,
  variable
);

const application: Parser<Lambda.Expression, ExpressionToken> = chainl1(
  term,
  success(Lambda.application)
);

const topExpression: Parser<Lambda.Expression, ExpressionToken> =
  complete(expression);

//=== lambda parsing function export ===//

export function parseExpression(input: string): Lambda.Expression {
  const tokensList = runParser(tokens, [...input]);
  const filteredTokens = tokensList.filter((t) => t.kind !== "whitespace");
  return runParser(topExpression, filteredTokens);
}
