// A small fluent builder for generating Graphviz DOT `digraph { ... }` strings.
//
// Example usage reproducing the graph from your comment:
//
//   const dot = digraphStringGenerator("G", (g) => {
//     g.graphAttr({ size: "4,4" });
//     g.node("main", { shape: "doubleoctagon" });
//     g.edge("main", "parse", { weight: 8 });
//     g.edge("parse", "execute");
//     g.edge("main", "init", { style: "dotted" });
//     g.edge("main", "cleanup");
//     g.edge("execute", ["make_string", "printf"]);
//     g.edge("init", "make_string");
//     g.edgeDefaults({ color: "red" });
//     g.edge("main", "printf", { style: "bold", label: "100 times" });
//     g.node("make_string", { label: "make a\nstring" });
//     g.nodeDefaults({ shape: "star", style: "filled", color: ".7 .3 1.0" });
//     g.edge("execute", "compare");
//   });

type AttrValue = string | number | boolean;
type Attributes = Record<string, AttrValue>;

type Statement =
  | { kind: "graphAttr"; attrs: Attributes }
  | { kind: "nodeDefaults"; attrs: Attributes }
  | { kind: "edgeDefaults"; attrs: Attributes }
  | { kind: "node"; name: string; attrs?: Attributes }
  | { kind: "edge"; from: string; to: string | string[]; attrs?: Attributes }
  | { kind: "raw"; text: string }
  | { kind: "subgraph"; name: string; builder: DiGraphBuilder };

/** True if `value` needs to be wrapped in quotes to be a valid DOT ID. */
function needsQuoting(value: string): boolean {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) return false; // plain identifier
  if (/^-?(\.[0-9]+|[0-9]+(\.[0-9]*)?)$/.test(value)) return false; // numeral
  return true;
}

function escape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function formatId(id: string): string {
  return needsQuoting(id) ? `"${escape(id)}"` : id;
}

function formatValue(value: AttrValue): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return needsQuoting(value) ? `"${escape(value)}"` : value;
}

function formatAttrs(attrs?: Attributes): string {
  if (!attrs || Object.keys(attrs).length === 0) return "";
  const parts = Object.entries(attrs).map(([k, v]) => `${formatId(k)}=${formatValue(v)}`);
  return ` [${parts.join(", ")}]`;
}

export interface DigraphOptions {
  /** Emit `strict digraph` to collapse duplicate edges. Default false. */
  strict?: boolean;
  /** Directed (`->`) vs undirected (`--`) graph. Default true. */
  directed?: boolean;
  /** Indentation used for each statement line. Default 4 spaces. */
  indent?: string;
}

export class DiGraphBuilder {
  private statements: Statement[] = [];

  /** Sets one or more graph-level attributes, e.g. g.graphAttr({ size: "4,4" }) */
  graphAttr(attrs: Attributes): this {
    this.statements.push({ kind: "graphAttr", attrs });
    return this;
  }

  /** Sets default attributes applied to nodes declared afterwards. */
  nodeDefaults(attrs: Attributes): this {
    this.statements.push({ kind: "nodeDefaults", attrs });
    return this;
  }

  /** Sets default attributes applied to edges declared afterwards. */
  edgeDefaults(attrs: Attributes): this {
    this.statements.push({ kind: "edgeDefaults", attrs });
    return this;
  }

  /** Declares/updates a single node, optionally with attributes. */
  node(name: string, attrs?: Attributes): this {
    this.statements.push({ kind: "node", name, attrs });
    return this;
  }

  /**
   * Declares an edge. `to` can be a single node name or an array of names
   * to reproduce fan-out syntax like `execute -> { make_string; printf }`.
   */
  edge(from: string, to: string | string[], attrs?: Attributes): this {
    this.statements.push({ kind: "edge", from, to, attrs });
    return this;
  }

  /** Emits a raw `// comment` line (or multiple, one per input line). */
  comment(text: string): this {
    const lines = text.split("\n").map((l) => `// ${l}`).join("\n");
    this.statements.push({ kind: "raw", text: lines });
    return this;
  }

  /**
   * Groups statements into a `subgraph { ... }` block. Name it `cluster_x`
   * (Graphviz's naming convention) to get a labeled box drawn around the
   * group by the `dot` layout engine — e.g. `g.subgraph("cluster_admins", c => {...})`.
   * Nodes declared inside are still addressable by id from outside (e.g. to
   * draw an edge into the cluster from a node declared elsewhere).
   */
  subgraph(name: string, fn: (g: DiGraphBuilder) => void): this {
    const sub = new DiGraphBuilder();
    fn(sub);
    this.statements.push({ kind: "subgraph", name, builder: sub });
    return this;
  }

  /** Serializes all recorded statements into a DOT graph string. */
  build(name: string, options: DigraphOptions = {}): string {
    const indent = options.indent ?? "    ";
    const directed = options.directed ?? true;
    const strict = options.strict ?? false;
    const arrow = directed ? "->" : "--";
    const keyword = directed ? "digraph" : "graph";

    const body = this.renderStatements(this.statements, indent, arrow, 1);
    return [`${strict ? "strict " : ""}${keyword} ${formatId(name)} {`, ...body, "}"].join("\n");
  }

  private renderStatements(statements: Statement[], indent: string, arrow: string, depth: number): string[] {
    const pad = indent.repeat(depth);
    const lines: string[] = [];

    for (const stmt of statements) {
      switch (stmt.kind) {
        case "graphAttr":
          for (const [k, v] of Object.entries(stmt.attrs)) {
            lines.push(`${pad}${formatId(k)}=${formatValue(v)};`);
          }
          break;
        case "nodeDefaults":
          lines.push(`${pad}node${formatAttrs(stmt.attrs)};`);
          break;
        case "edgeDefaults":
          lines.push(`${pad}edge${formatAttrs(stmt.attrs)};`);
          break;
        case "node":
          lines.push(`${pad}${formatId(stmt.name)}${formatAttrs(stmt.attrs)};`);
          break;
        case "edge": {
          const toStr = Array.isArray(stmt.to)
            ? `{ ${stmt.to.map(formatId).join("; ")} }`
            : formatId(stmt.to);
          lines.push(`${pad}${formatId(stmt.from)} ${arrow} ${toStr}${formatAttrs(stmt.attrs)};`);
          break;
        }
        case "raw":
          lines.push(stmt.text);
          break;
        case "subgraph": {
          lines.push(`${pad}subgraph ${formatId(stmt.name)} {`);
          lines.push(...this.renderStatements(stmt.builder.statements, indent, arrow, depth + 1));
          lines.push(`${pad}}`);
          break;
        }
      }
    }

    return lines;
  }
}

export function digraphStringGenerator(
  name: string,
  builder: (g: DiGraphBuilder) => void | DiGraphBuilder,
  options?: DigraphOptions
): string {
  const g = new DiGraphBuilder();
  builder(g);
  return g.build(name, options);
}
