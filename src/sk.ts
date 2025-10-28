//structural type equality
type Eq<T extends Term, U extends Term> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

//definition of SK-calculus terms
type S = "S";
type K = "K";
interface App<T extends Term, U extends Term> {
  t: T;
  u: U;
}
type Term = S | K | App<Term, Term>;

//reduction and evaluation of SK-calculus terms
type Reduce<T extends Term> = T extends App<App<K, infer X>, infer Y>
  ? X
  : T extends App<App<App<S, infer X>, infer Y>, infer Z>
  ? App<App<X, Z>, App<Y, Z>>
  : T extends App<infer Func, infer Arg>
  ? Reduce<Func> extends infer ReducedFunc
    ? [ReducedFunc] extends [Func]
      ? Reduce<Arg> extends infer ReducedArg
        ? [ReducedArg] extends [Arg]
          ? T
          : App<Func, ReducedArg extends Term ? ReducedArg : never>
        : never
      : App<ReducedFunc extends Term ? ReducedFunc : never, Arg>
    : never
  : T;
type Evaluate<T extends Term> = Reduce<T> extends infer TReduced
  ? [TReduced] extends [T]
    ? T
    : Evaluate<TReduced extends Term ? TReduced : never>
  : never;

//example programs
type I = App<App<S, K>, K>;
type Zero = App<K, I>;
type Succ = App<App<S, App<App<S, App<K, S>>, K>>, S>;
type One = App<Succ, Zero>;
type Two = App<Succ, One>;
type Three = App<Succ, Two>;
type Plus = App<App<S, App<App<S, App<K, S>>, K>>, I>;
type ZeroPlusOne = App<App<Plus, Zero>, One>;
type OnePlusTwo = App<App<Plus, One>, Two>;

//tests
type Test1 = Eq<Evaluate<App<I, K>>, K>;
type Test2 = Eq<Evaluate<App<App<App<S, K>, I>, K>>, K>;
type OnePlusTwoEqualsThree = Eq<Evaluate<OnePlusTwo>, Three>; //hits recursion limit :/
