/**
 * Report-builder formula dictionaries (pack 03). A deliberately tiny,
 * closed expression language evaluated in-process over a row's already-
 * fetched dictionary values — never SQL, never arbitrary code (pack 03
 * calls this "the highest-risk surface in the whole feature").
 *
 * Grammar:
 *   value    := number | 'string' | {DICT_NAME}
 *   expr     := value | expr op expr | ( expr ) | fn(args)
 *   op       := + - * / = != < > <= >=
 *   fn       := CONCAT | IF | ROUND | ABS | UPPER | LOWER
 *
 * Unknown dictionary names are a hard error (acceptance #4); anything
 * outside the closed set is rejected at parse time (acceptance #5).
 */

export class FormulaError extends Error {}

type Value = number | string | boolean | null;

type Token =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'ref'; v: string }
  | { t: 'ident'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lparen' }
  | { t: 'rparen' }
  | { t: 'comma' };

const FUNCTIONS = new Set(['CONCAT', 'IF', 'ROUND', 'ABS', 'UPPER', 'LOWER']);
const OPS = ['<=', '>=', '!=', '+', '-', '*', '/', '=', '<', '>'];

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '(') {
      out.push({ t: 'lparen' });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ t: 'rparen' });
      i++;
      continue;
    }
    if (c === ',') {
      out.push({ t: 'comma' });
      i++;
      continue;
    }
    if (c === '{') {
      const end = src.indexOf('}', i);
      if (end < 0) throw new FormulaError('Unclosed dictionary reference');
      out.push({ t: 'ref', v: src.slice(i + 1, end).trim() });
      i = end + 1;
      continue;
    }
    if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw new FormulaError('Unclosed string literal');
      out.push({ t: 'str', v: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (op) {
      out.push({ t: 'op', v: op });
      i += op.length;
      continue;
    }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (num) {
      out.push({ t: 'num', v: Number(num[0]) });
      i += num[0].length;
      continue;
    }
    const ident = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
    if (ident) {
      out.push({ t: 'ident', v: ident[0].toUpperCase() });
      i += ident[0].length;
      continue;
    }
    throw new FormulaError(`Unexpected character '${c}' in formula`);
  }
  return out;
}

type Node =
  | { k: 'lit'; v: Value }
  | { k: 'ref'; name: string }
  | { k: 'bin'; op: string; l: Node; r: Node }
  | { k: 'fn'; name: string; args: Node[] };

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.expr();
    if (this.pos !== this.tokens.length) throw new FormulaError('Trailing input in formula');
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  // Precedence: comparisons < additive < multiplicative < primary.
  private expr(): Node {
    let left = this.additive();
    let tk = this.peek();
    while (tk && tk.t === 'op' && ['=', '!=', '<', '>', '<=', '>='].includes(tk.v)) {
      this.pos++;
      const right = this.additive();
      left = { k: 'bin', op: tk.v, l: left, r: right };
      tk = this.peek();
    }
    return left;
  }

  private additive(): Node {
    let left = this.multiplicative();
    let tk = this.peek();
    while (tk && tk.t === 'op' && (tk.v === '+' || tk.v === '-')) {
      this.pos++;
      const right = this.multiplicative();
      left = { k: 'bin', op: tk.v, l: left, r: right };
      tk = this.peek();
    }
    return left;
  }

  private multiplicative(): Node {
    let left = this.primary();
    let tk = this.peek();
    while (tk && tk.t === 'op' && (tk.v === '*' || tk.v === '/')) {
      this.pos++;
      const right = this.primary();
      left = { k: 'bin', op: tk.v, l: left, r: right };
      tk = this.peek();
    }
    return left;
  }

  private primary(): Node {
    const tk = this.peek();
    if (!tk) throw new FormulaError('Unexpected end of formula');
    if (tk.t === 'num') {
      this.pos++;
      return { k: 'lit', v: tk.v };
    }
    if (tk.t === 'str') {
      this.pos++;
      return { k: 'lit', v: tk.v };
    }
    if (tk.t === 'ref') {
      this.pos++;
      return { k: 'ref', name: tk.v };
    }
    if (tk.t === 'lparen') {
      this.pos++;
      const inner = this.expr();
      const close = this.peek();
      if (!close || close.t !== 'rparen') throw new FormulaError('Missing closing parenthesis');
      this.pos++;
      return inner;
    }
    if (tk.t === 'ident') {
      if (!FUNCTIONS.has(tk.v)) {
        throw new FormulaError(`Unknown function or identifier '${tk.v}'`);
      }
      this.pos++;
      const open = this.peek();
      if (!open || open.t !== 'lparen') throw new FormulaError(`${tk.v} requires arguments`);
      this.pos++;
      const args: Node[] = [];
      if (this.peek()?.t !== 'rparen') {
        args.push(this.expr());
        while (this.peek()?.t === 'comma') {
          this.pos++;
          args.push(this.expr());
        }
      }
      const close = this.peek();
      if (!close || close.t !== 'rparen') throw new FormulaError('Missing closing parenthesis');
      this.pos++;
      return { k: 'fn', name: tk.v, args };
    }
    if (tk.t === 'op' && tk.v === '-') {
      this.pos++;
      return { k: 'bin', op: '-', l: { k: 'lit', v: 0 }, r: this.primary() };
    }
    throw new FormulaError('Unexpected token in formula');
  }
}

/** Parse only — used at save time to validate. Returns referenced names. */
export function parseFormula(src: string): { refs: string[] } {
  const node = new Parser(tokenize(src)).parse();
  const refs: string[] = [];
  const walk = (n: Node): void => {
    if (n.k === 'ref') refs.push(n.name);
    else if (n.k === 'bin') {
      walk(n.l);
      walk(n.r);
    } else if (n.k === 'fn') n.args.forEach(walk);
  };
  walk(node);
  return { refs: [...new Set(refs)] };
}

function num(v: Value): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  if (v === null) return 0;
  throw new FormulaError(`Expected a number, got '${String(v)}'`);
}

export function evaluateFormula(src: string, row: Record<string, Value>): Value {
  const node = new Parser(tokenize(src)).parse();
  const ev = (n: Node): Value => {
    switch (n.k) {
      case 'lit':
        return n.v;
      case 'ref': {
        if (!(n.name in row)) {
          // Acceptance #4: unknown names error, never null.
          throw new FormulaError(`Unknown dictionary '${n.name}' in formula`);
        }
        return row[n.name] ?? null;
      }
      case 'bin': {
        const l = ev(n.l);
        const r = ev(n.r);
        switch (n.op) {
          case '+':
            return typeof l === 'string' || typeof r === 'string'
              ? `${l ?? ''}${r ?? ''}`
              : num(l) + num(r);
          case '-':
            return num(l) - num(r);
          case '*':
            return num(l) * num(r);
          case '/': {
            const d = num(r);
            return d === 0 ? null : num(l) / d;
          }
          case '=':
            return l === r;
          case '!=':
            return l !== r;
          case '<':
            return num(l) < num(r);
          case '>':
            return num(l) > num(r);
          case '<=':
            return num(l) <= num(r);
          case '>=':
            return num(l) >= num(r);
          default:
            throw new FormulaError(`Unknown operator ${n.op}`);
        }
      }
      case 'fn': {
        const args = n.args.map(ev);
        switch (n.name) {
          case 'CONCAT':
            return args.map((a) => (a == null ? '' : String(a))).join('');
          case 'IF':
            if (args.length !== 3) throw new FormulaError('IF takes 3 arguments');
            return args[0] ? args[1]! : args[2]!;
          case 'ROUND': {
            if (args.length < 1 || args.length > 2) throw new FormulaError('ROUND takes 1–2 args');
            const places = args.length === 2 ? num(args[1]!) : 0;
            const f = 10 ** places;
            return Math.round(num(args[0]!) * f) / f;
          }
          case 'ABS':
            return Math.abs(num(args[0] ?? 0));
          case 'UPPER':
            return String(args[0] ?? '').toUpperCase();
          case 'LOWER':
            return String(args[0] ?? '').toLowerCase();
          default:
            throw new FormulaError(`Unknown function ${n.name}`);
        }
      }
    }
  };
  return ev(node);
}
