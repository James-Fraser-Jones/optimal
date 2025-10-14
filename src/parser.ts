import { type Token } from "typescript-parsec";
import {
  buildLexer,
  expectEOF,
  expectSingleResult,
  rule,
} from "typescript-parsec";
import { alt, apply, kmid, lrec_sc, seq, str, tok } from "typescript-parsec";

const TokenKind = {
  Number: "Number",
  Add: "Add",
  Sub: "Sub",
  Mul: "Mul",
  Div: "Div",
  LParen: "LParen",
  RParen: "RParen",
  Space: "Space",
} as const;

type TokenKindObject = typeof TokenKind;
type TokenKind = TokenKindObject[keyof TokenKindObject];

const lexer = buildLexer([
  [true, /^\d+(\.\d+)?/g, TokenKind.Number],
  [true, /^\+/g, TokenKind.Add],
  [true, /^\-/g, TokenKind.Sub],
  [true, /^\*/g, TokenKind.Mul],
  [true, /^\//g, TokenKind.Div],
  [true, /^\(/g, TokenKind.LParen],
  [true, /^\)/g, TokenKind.RParen],
  [false, /^\s+/g, TokenKind.Space],
]);

function applyNumber(value: Token<"Number">): number {
  return +value.text;
}

function applyUnary(value: [Token<TokenKind>, number]): number {
  switch (value[0].text) {
    case "+":
      return +value[1];
    case "-":
      return -value[1];
    default:
      throw new Error(`Unknown unary operator: ${value[0].text}`);
  }
}

function applyBinary(
  first: number,
  second: [Token<TokenKind>, number]
): number {
  switch (second[0].text) {
    case "+":
      return first + second[1];
    case "-":
      return first - second[1];
    case "*":
      return first * second[1];
    case "/":
      return first / second[1];
    default:
      throw new Error(`Unknown binary operator: ${second[0].text}`);
  }
}

const TERM = rule<TokenKind, number>();
const FACTOR = rule<TokenKind, number>();
const EXP = rule<TokenKind, number>();

/*
TERM
  = NUMBER
  = ('+' | '-') TERM
  = '(' EXP ')'
*/
TERM.setPattern(
  alt(
    apply(tok(TokenKind.Number), applyNumber),
    apply(seq(alt(str("+"), str("-")), TERM), applyUnary),
    kmid(str("("), EXP, str(")"))
  )
);

/*
FACTOR
  = TERM
  = FACTOR ('*' | '/') TERM
*/
FACTOR.setPattern(
  lrec_sc(TERM, seq(alt(str("*"), str("/")), TERM), applyBinary)
);

/*
EXP
  = FACTOR
  = EXP ('+' | '-') FACTOR
*/
EXP.setPattern(
  lrec_sc(FACTOR, seq(alt(str("+"), str("-")), FACTOR), applyBinary)
);

function evaluate(expr: string): number {
  return expectSingleResult(expectEOF(EXP.parse(lexer.parse(expr))));
}

function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg ?? "Assertion failed");
  }
}

assert(evaluate("1") === 1);
assert(evaluate("+1.5") === 1.5);
assert(evaluate("-0.5") === -0.5);
assert(evaluate("1 + 2") === 3);
assert(evaluate("1 - 2") === -1);
assert(evaluate("1 * 2") === 2);
assert(evaluate("1 / 2") === 0.5);
assert(evaluate("1 + 2 * 3 + 4") === 11);
assert(evaluate("(1 + 2) * (3 + 4)") === 21);
assert(evaluate("1.2--3.4") === 4.6);
