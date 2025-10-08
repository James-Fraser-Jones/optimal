interface Abstraction {
  type: "abstraction";
  binder: string;
  body: Expression;
}
interface Application {
  type: "application";
  func: Expression;
  arg: Expression;
}
interface Variable {
  type: "variable";
  name: string;
}
export type Expression = Abstraction | Application | Variable;

export function elim<T>(
  expr: Expression,
  abstraction: (binder: string, body: Expression) => T,
  application: (func: Expression, arg: Expression) => T,
  variable: (name: string) => T
): T {
  switch (expr.type) {
    case "abstraction":
      return abstraction(expr.binder, expr.body);
    case "application":
      return application(expr.func, expr.arg);
    case "variable":
      return variable(expr.name);
    default:
      const _exhaustiveCheck: never = expr;
      return _exhaustiveCheck;
  }
}

export function cata<T>(
  expr: Expression,
  abstraction: (binder: string, body: T) => T,
  application: (func: T, arg: T) => T,
  variable: (name: string) => T
): T {
  return elim(
    expr,
    (binder, body) =>
      abstraction(binder, cata(body, abstraction, application, variable)),
    (func, arg) =>
      application(
        cata(func, abstraction, application, variable),
        cata(arg, abstraction, application, variable)
      ),
    (name) => variable(name)
  );
}

function depth(expr: Expression): number {
  return cata(
    expr,
    (_binder, body) => 1 + body,
    (func, arg) => Math.max(func, arg),
    (_name) => 1
  );
}

function width(expr: Expression): number {
  return cata(
    expr,
    (_binder, body) => body,
    (func, arg) => func + arg,
    (_name) => 1
  );
}

export function size(expr: Expression): { width: number; height: number } {
  return {
    width: width(expr),
    height: depth(expr),
  };
}

export const S: Expression = {
  type: "abstraction",
  binder: "x",
  body: {
    type: "abstraction",
    binder: "y",
    body: {
      type: "abstraction",
      binder: "z",
      body: {
        type: "application",
        func: {
          type: "application",
          func: { type: "variable", name: "x" },
          arg: { type: "variable", name: "z" },
        },
        arg: {
          type: "application",
          func: { type: "variable", name: "y" },
          arg: { type: "variable", name: "z" },
        },
      },
    },
  },
};

export const K: Expression = {
  type: "abstraction",
  binder: "x",
  body: {
    type: "abstraction",
    binder: "y",
    body: { type: "variable", name: "x" },
  },
};

export const I: Expression = {
  type: "abstraction",
  binder: "x",
  body: { type: "variable", name: "x" },
};
