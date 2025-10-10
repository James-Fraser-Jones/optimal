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

interface ExpressionSize {
  width: number;
  height: number;
  root: number;
}
export type SizedExpression = Expression & ExpressionSize;

function match<T>(
  expr: Expression,
  caseAbs: (abs: Abstraction) => T,
  caseApp: (app: Application) => T,
  caseVar: (v: Variable) => T
): T {
  switch (expr.type) {
    case "abstraction":
      return caseAbs(expr);
    case "application":
      return caseApp(expr);
    case "variable":
      return caseVar(expr);
    default:
      const _exhaustiveCheck: never = expr;
      return _exhaustiveCheck;
  }
}

function cata<T>(
  expr: Expression,
  caseAbs: (binder: string, body: T) => T,
  caseApp: (func: T, arg: T) => T,
  caseVar: (name: string) => T
): T {
  return match(
    expr,
    (abs) => caseAbs(abs.binder, cata(abs.body, caseAbs, caseApp, caseVar)),
    (app) =>
      caseApp(
        cata(app.func, caseAbs, caseApp, caseVar),
        cata(app.arg, caseAbs, caseApp, caseVar)
      ),
    (v) => caseVar(v.name)
  );
}

export function sizeFast(expr: Expression): SizedExpression {
  return match(
    expr,
    (abs) => {
      const body = sizeFast(abs.body);
      Object.assign(abs, {
        body,
        width: body.width,
        height: 1 + body.height,
        root: body.root,
      });
      return abs as SizedExpression;
    },
    (app) => {
      const func: SizedExpression = sizeFast(app.func);
      const arg: SizedExpression = sizeFast(app.arg);
      Object.assign(app, {
        width: func.width + arg.width,
        height: 1 + Math.max(func.height, arg.height),
        root: (func.root + (func.width + arg.root)) / 2,
      });
      return app as SizedExpression;
    },
    (v) => {
      Object.assign(v, { width: 1, height: 1, root: 0 });
      return v as SizedExpression;
    }
  );
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
