type ℕ = number;

// ===== agents =====

type Σ =
  | "α"
  | "β"
  | "γ"
  | "δ"
  | "ϵ"
  | "ζ"
  | "η"
  | "θ"
  | "ι"
  | "κ"
  | "λ"
  | "μ"
  | "ν"
  | "ξ"
  | "ο"
  | "π"
  | "ρ"
  | "σ"
  | "τ"
  | "υ"
  | "ϕ"
  | "χ"
  | "ψ";

const ar = (agent: Σ): ℕ => {
  return 2; // placeholder
};

// ===== names =====

type N =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

// ===== terms =====

type Term = N | { agent: Σ; aux: Term[] };
//constraint: aux.length === ar(agent)

const occourences = (t: Term, n: N): ℕ =>
  typeof t === "string"
    ? t === n
      ? 1
      : 0
    : t.aux.reduce((acc, curr) => acc + occourences(curr, n), 0);
//constraint: 0 <= occourences(t, n) <= 2

const free = (t: Term, n: N): boolean => occourences(t, n) === 1;
const bound = (t: Term, n: N): boolean => occourences(t, n) === 2;

// ===== equations =====

type Equation = [Term, Term];

// ===== rules =====
