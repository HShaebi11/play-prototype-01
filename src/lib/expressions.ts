import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ExpressionResult = {
  value: number;
  error: boolean;
};

type Token =
  | { type: "ident"; value: string }
  | { type: "number"; value: number }
  | { type: "op"; value: "+" | "-" | "*" }
  | { type: "eof" };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const source = input.trim();

  while (index < source.length) {
    const char = source[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let ident = char;
      index += 1;
      while (index < source.length && /[a-zA-Z0-9_]/.test(source[index])) {
        ident += source[index];
        index += 1;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numberText = char;
      index += 1;
      while (index < source.length && /[0-9.]/.test(source[index])) {
        numberText += source[index];
        index += 1;
      }
      const parsed = Number.parseFloat(numberText);
      if (Number.isNaN(parsed)) {
        throw new Error("Invalid number");
      }
      tokens.push({ type: "number", value: parsed });
      continue;
    }

    if (char === "+" || char === "-" || char === "*") {
      tokens.push({ type: "op", value: char });
      index += 1;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  tokens.push({ type: "eof" });
  return tokens;
}

class Parser {
  private tokens: Token[];
  private index = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.index] ?? { type: "eof" };
  }

  private consume(): Token {
    const token = this.peek();
    this.index += 1;
    return token;
  }

  parse(): (getVar: (id: string) => number) => number {
    const expr = this.parseAdd();
    if (this.peek().type !== "eof") {
      throw new Error("Unexpected tokens after expression");
    }
    return expr;
  }

  private parseAdd(): (getVar: (id: string) => number) => number {
    let left = this.parseMul();

    if (this.peek().type === "op" && (this.peek() as { value: string }).value === "+") {
      this.consume();
      const rightToken = this.consume();
      if (rightToken.type !== "number") {
        throw new Error("Expected number after +");
      }
      const addend = rightToken.value;
      const leftFn = left;
      return (getVar) => clamp01(leftFn(getVar) + addend);
    }

    return left;
  }

  private parseMul(): (getVar: (id: string) => number) => number {
    const left = this.parseUnary();

    if (this.peek().type === "op" && (this.peek() as { value: string }).value === "*") {
      this.consume();
      const rightToken = this.consume();
      if (rightToken.type !== "number") {
        throw new Error("Expected number after *");
      }
      const multiplier = rightToken.value;
      const leftFn = left;
      return (getVar) => clamp01(leftFn(getVar) * multiplier);
    }

    return left;
  }

  private parseUnary(): (getVar: (id: string) => number) => number {
    const token = this.peek();

    if (token.type === "number" && token.value === 1) {
      this.consume();
      const op = this.consume();
      if (op.type !== "op" || op.value !== "-") {
        throw new Error("Expected - after 1");
      }
      const ident = this.consume();
      if (ident.type !== "ident") {
        throw new Error("Expected identifier after 1 -");
      }
      const id = ident.value;
      return (getVar) => clamp01(1 - getVar(id));
    }

    if (token.type === "ident") {
      this.consume();
      const id = token.value;
      return (getVar) => clamp01(getVar(id));
    }

    throw new Error("Invalid expression");
  }
}

export function evaluateExpression(
  expression: string,
  getVariable: (id: string) => number,
  fallback: number,
): ExpressionResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { value: fallback, error: true };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const evaluate = parser.parse();
    return { value: evaluate(getVariable), error: false };
  } catch {
    return { value: fallback, error: true };
  }
}

export type ExpressionStore = {
  expressions: Record<string, string>;
  setExpression: (variableId: string, expression: string) => void;
  getExpression: (variableId: string) => string;
  resetExpression: (variableId: string) => void;
};

export const useExpressionStore = create<ExpressionStore>()(
  persist(
    (set, get) => ({
      expressions: {},

      setExpression: (variableId, expression) => {
        set((state) => ({
          expressions: { ...state.expressions, [variableId]: expression },
        }));
      },

      getExpression: (variableId) => {
        return get().expressions[variableId] ?? variableId;
      },

      resetExpression: (variableId) => {
        set((state) => {
          const next = { ...state.expressions };
          delete next[variableId];
          return { expressions: next };
        });
      },
    }),
    {
      name: "play-expressions",
    },
  ),
);
