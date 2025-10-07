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

export function cata<T>(
  expr: Expression,
  abstraction: (binder: string, body: T) => T,
  application: (func: T, arg: T) => T,
  variable: (name: string) => T
): T {
  switch (expr.type) {
    case "abstraction":
      return abstraction(
        expr.binder,
        cata(expr.body, abstraction, application, variable)
      );
    case "application":
      return application(
        cata(expr.func, abstraction, application, variable),
        cata(expr.arg, abstraction, application, variable)
      );
    case "variable":
      return variable(expr.name);
    default:
      const _exhaustiveCheck: never = expr;
      return _exhaustiveCheck;
  }
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
