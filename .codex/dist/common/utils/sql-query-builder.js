"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUpdateQuery = buildUpdateQuery;
function getDefinedEntries(payload, allowedColumns) {
    const valuesByColumn = payload;
    return allowedColumns
        .filter((column) => Object.prototype.hasOwnProperty.call(payload, column))
        .map((column) => [column, valuesByColumn[column]])
        .filter(([, value]) => value !== undefined);
}
function buildUpdateQuery(tableName, payload, allowedColumns, id) {
    const entries = getDefinedEntries(payload, allowedColumns);
    if (entries.length === 0) {
        return null;
    }
    const assignments = entries.map(([column], index) => column + ' = $' + (index + 1));
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
//# sourceMappingURL=sql-query-builder.js.map