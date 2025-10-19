//lambda expressions
export interface Abstraction<T = undefined> {
  type: "abstraction";
  binder: string;
  body: Expression<T>;
  metadata: T;
}
export const abstraction: (
  binder: string
) => (body: Expression) => Abstraction = (binder) => (body) => ({
  type: "abstraction",
  binder,
  body,
  metadata: undefined,
});

export interface Application<T = undefined> {
  type: "application";
  func: Expression<T>;
  arg: Expression<T>;
  metadata: T;
}
export const application: (
  func: Expression
) => (arg: Expression) => Application = (func) => (arg) => ({
  type: "application",
  func,
  arg,
  metadata: undefined,
});

export interface Variable<T = undefined> {
  type: "variable";
  name: string;
  metadata: T;
}
export const variable: (name: string) => Variable = (name) => ({
  type: "variable",
  name,
  metadata: undefined,
});

export type Expression<T = undefined> =
  | Abstraction<T>
  | Application<T>
  | Variable<T>;
export function match<T, U>(
  expr: Expression<T>,
  caseAbs: (abs: Abstraction<T>) => U,
  caseApp: (app: Application<T>) => U,
  caseVar: (v: Variable<T>) => U
): U {
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
export function cata<T, U>(
  expr: Expression<T>,
  caseAbs: (binder: string, body: U) => U,
  caseApp: (func: U, arg: U) => U,
  caseVar: (name: string) => U
): U {
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

//sized expressions
export interface SizeMetadata {
  width: number;
  height: number;
  root: number;
}
export type SizedExpression = Expression<SizeMetadata>;
// export function sizeExpression(expr: Expression): SizedExpression {
//   const sized = expr as unknown as SizedExpression;
//   return cata(
//     expr,
//     (_, body) => {
//       sized.metadata = {
//         width: body.metadata.width,
//         height: 1 + body.metadata.height,
//         root: body.metadata.root,
//       };
//       return sized;
//     },
//     (func, arg) => {
//       sized.metadata = {
//         width: func.metadata.width + arg.metadata.width,
//         height: 1 + Math.max(func.metadata.height, arg.metadata.height),
//         root:
//           (func.metadata.root + (func.metadata.width + arg.metadata.root)) / 2,
//       };
//       return sized;
//     },
//     (_) => {
//       sized.metadata = {
//         width: 1,
//         height: 1,
//         root: 0,
//       };
//       return sized;
//     }
//   );
// }
export function sizeExpression(expr: Expression): SizedExpression {
  const sized = expr as unknown as SizedExpression;
  return match(
    expr,
    (abs) => {
      const body = sizeExpression(abs.body);
      sized.metadata = {
        width: body.metadata.width,
        height: 1 + body.metadata.height,
        root: body.metadata.root,
      };
      return sized;
    },
    (app) => {
      const func: SizedExpression = sizeExpression(app.func);
      const arg: SizedExpression = sizeExpression(app.arg);
      sized.metadata = {
        width: func.metadata.width + arg.metadata.width,
        height: 1 + Math.max(func.metadata.height, arg.metadata.height),
        root:
          (func.metadata.root + (func.metadata.width + arg.metadata.root)) / 2,
      };
      return sized;
    },
    (_) => {
      sized.metadata = {
        width: 1,
        height: 1,
        root: 0,
      };
      return sized;
    }
  );
}

//example expressions
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
          func: { type: "variable", name: "x", metadata: undefined },
          arg: { type: "variable", name: "z", metadata: undefined },
          metadata: undefined,
        },
        metadata: undefined,
        arg: {
          type: "application",
          func: { type: "variable", name: "y", metadata: undefined },
          arg: { type: "variable", name: "z", metadata: undefined },
          metadata: undefined,
        },
      },
      metadata: undefined,
    },
    metadata: undefined,
  },
  metadata: undefined,
};
export const K: Expression = {
  type: "abstraction",
  binder: "x",
  body: {
    type: "abstraction",
    binder: "y",
    body: { type: "variable", name: "x", metadata: undefined },
    metadata: undefined,
  },
  metadata: undefined,
};
export const I: Expression = {
  type: "abstraction",
  binder: "x",
  body: { type: "variable", name: "x", metadata: undefined },
  metadata: undefined,
};
export const Y: Expression = {
  type: "abstraction",
  binder: "f",
  body: {
    type: "application",
    func: {
      type: "abstraction",
      binder: "x",
      body: {
        type: "application",
        func: { type: "variable", name: "f", metadata: undefined },
        arg: {
          type: "application",
          func: { type: "variable", name: "x", metadata: undefined },
          arg: { type: "variable", name: "x", metadata: undefined },
          metadata: undefined,
        },
        metadata: undefined,
      },
      metadata: undefined,
    },
    arg: {
      type: "abstraction",
      binder: "x",
      body: {
        type: "application",
        func: { type: "variable", name: "f", metadata: undefined },
        arg: {
          type: "application",
          func: { type: "variable", name: "x", metadata: undefined },
          arg: { type: "variable", name: "x", metadata: undefined },
          metadata: undefined,
        },
        metadata: undefined,
      },
      metadata: undefined,
    },
    metadata: undefined,
  },
  metadata: undefined,
};
