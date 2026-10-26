type QueryPayload = object;

interface BuiltQuery {
  query: string;
  values: unknown[];
}

function getDefinedEntries(
  payload: QueryPayload,
  allowedColumns: readonly string[],
): Array<[string, unknown]> {
  const valuesByColumn = payload as Record<string, unknown>;

  return allowedColumns
    .filter((column) => Object.prototype.hasOwnProperty.call(payload, column))
    .map((column) => [column, valuesByColumn[column]] as [string, unknown])
    .filter(([, value]) => value !== undefined);
}

export function buildUpdateQuery(
  tableName: string,
  payload: QueryPayload,
  allowedColumns: readonly string[],
  id: number,
): BuiltQuery | null {
  const entries = getDefinedEntries(payload, allowedColumns);

  if (entries.length === 0) {
    return null;
  }

  const assignments = entries.map(
    ([column], index) => column + ' = $' + (index + 1),
  );
  const values = entries.map(([, value]) => value);
  values.push(id);

  return {
    query: `
      UPDATE ${tableName}
      SET
        ${assignments.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `,
    values,
  };
}
