import { adminQuery, type AdminQueryInput } from "./admin.functions";

type Res = { data: any; error: { message: string } | null };

class Query implements PromiseLike<Res> {
  private p: AdminQueryInput;

  constructor(table: string) {
    this.p = { table, action: "select", filters: [] };
  }

  select(sel?: string) {
    if (this.p.action === "select") this.p.select = sel ?? "*";
    else this.p.returning = sel ?? "*";
    return this;
  }
  insert(values: unknown) {
    this.p.action = "insert";
    this.p.values = values;
    return this;
  }
  update(values: unknown) {
    this.p.action = "update";
    this.p.values = values;
    return this;
  }
  delete() {
    this.p.action = "delete";
    return this;
  }
  eq(column: string, value: unknown) {
    this.p.filters!.push([column, value]);
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) {
    this.p.order = { column, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number) {
    this.p.limit = n;
    return this;
  }
  single() {
    this.p.single = true;
    return this;
  }

  then<TResult1 = Res, TResult2 = never>(
    onfulfilled?: ((value: Res) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return adminQuery({ data: this.p }).then((r) => r as Res, undefined).then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    );
  }
}

/** Todas as leituras/escritas do ERP passam pelo servidor, protegidas por senha. */
export const db = {
  from: (table: string) => new Query(table),
};
