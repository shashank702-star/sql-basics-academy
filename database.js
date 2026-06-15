// SQL Quest - Mock Database Engine

const DATASETS = {
  space_crew: [
    { id: 1, name: "Commander Nova", role: "Captain", status: "Active", years_active: 12 },
    { id: 2, name: "Dr. Elena Rostova", role: "Chief Medical Officer", status: "Active", years_active: 8 },
    { id: 3, name: "Jax Sterling", role: "Chief Engineer", status: "Active", years_active: 10 },
    { id: 4, name: "Zara Chen", role: "Navigator", status: "Active", years_active: 5 },
    { id: 5, name: "Leo Vance", role: "Security Officer", status: "Suspended", years_active: 3 },
    { id: 6, name: "SAM-9", role: "Astromech Droid", status: "Active", years_active: 15 },
    { id: 7, name: "Dr. Sarah Kim", role: "Research Scientist", status: "Retired", years_active: 18 }
  ],
  planets: [
    { id: 1, name: "Zephyr-7", distance_ly: 4.2, type: "Terrestrial", has_life: true },
    { id: 2, name: "Gorgon Prime", distance_ly: 12.8, type: "Gas Giant", has_life: false },
    { id: 3, name: "Valkyrie", distance_ly: 8.5, type: "Terrestrial", has_life: true },
    { id: 4, name: "Krypton II", distance_ly: 25.1, type: "Ice Giant", has_life: false },
    { id: 5, name: "Helios", distance_ly: 1.5, type: "Terrestrial", has_life: false }
  ],
  cargo: [
    { id: 1, item: "Quantum Core", category: "Tech", weight_kg: 250, secured: true },
    { id: 2, item: "Hydroponic Seeds", category: "Supplies", weight_kg: 45, secured: true },
    { id: 3, item: "Deuterium Fuel Cells", category: "Fuel", weight_kg: 800, secured: false },
    { id: 4, item: "Alien Relic", category: "Specimens", weight_kg: 15, secured: false },
    { id: 5, item: "Titanium Plating", category: "Tech", weight_kg: 1200, secured: true },
    { id: 6, item: "Medical Kits", category: "Supplies", weight_kg: 90, secured: true }
  ],
  space_missions: [
    { id: 1, pilot_id: 1, destination: "Zephyr-7", ship: "Star Seeker" },
    { id: 2, pilot_id: 4, destination: "Valkyrie", ship: "Starlight-1" },
    { id: 3, pilot_id: 6, destination: "Gorgon Prime", ship: "Heavy Cruiser" }
  ]
};

const TABLE_SCHEMAS = {
  space_crew: ["id", "name", "role", "status", "years_active"],
  planets: ["id", "name", "distance_ly", "type", "has_life"],
  cargo: ["id", "item", "category", "weight_kg", "secured"],
  space_missions: ["id", "pilot_id", "destination", "ship"]
};

/**
 * Normalizes SQL queries and runs a basic parser.
 * Supports: SELECT columns FROM table [WHERE conditions] [ORDER BY col [ASC|DESC]] [LIMIT limit]
 * Also supports basic: SELECT cols FROM t1 JOIN t2 ON t1.col1 = t2.col2
 * Also supports basic aggregations: COUNT(*), COUNT(col), SUM(col), AVG(col), MIN(col), MAX(col)
 */
function runSQLQuery(queryStr) {
  if (!queryStr || queryStr.trim() === "") {
    return { success: false, error: "Empty query. Try writing 'SELECT * FROM space_crew;'" };
  }

  // Remove trailing semicolon and normalize whitespace
  let cleanQuery = queryStr.trim().replace(/;+$/, "").replace(/\s+/g, " ");

  // Beginner-friendly pre-flight checks (catch typos of major keywords)
  const lowerQuery = cleanQuery.toLowerCase();
  
  if (!lowerQuery.startsWith("select")) {
    if (lowerQuery.startsWith("selec") || lowerQuery.startsWith("slect") || lowerQuery.startsWith("selct")) {
      return { success: false, error: "Typo Alert! It looks like you misspelled 'SELECT'." };
    }
    return { success: false, error: "SQL queries generally need to start with the 'SELECT' keyword to fetch data." };
  }

  if (!lowerQuery.includes("from")) {
    if (lowerQuery.includes("form")) {
      return { success: false, error: "Typo Alert! You typed 'FORM' instead of 'FROM'. It happens to everyone!" };
    }
    return { success: false, error: "Missing 'FROM' keyword. You need to tell the database which table to get data 'FROM'." };
  }

  let tableName = "";
  let tableData = [];
  let schema = [];
  let isJoin = false;
  
  let selectColsRaw = "";
  let tableNameRaw = "";
  let whereClauseRaw = null;
  let orderByClauseRaw = null;
  let limitClauseRaw = null;
  
  if (lowerQuery.includes(" join ")) {
    isJoin = true;
    const joinRegex = /^select\s+(.+?)\s+from\s+(\w+)\s+join\s+(\w+)\s+on\s+([\w\.]+)\s*=\s*([\w\.]+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i;
    const match = cleanQuery.match(joinRegex);
    if (!match) {
      return {
        success: false,
        error: "Could not parse JOIN query. Ensure syntax matches: SELECT columns FROM table1 JOIN table2 ON table1.col1 = table2.col2 [WHERE filter] [ORDER BY col] [LIMIT num]"
      };
    }
    
    selectColsRaw = match[1].trim();
    const table1Raw = match[2].trim();
    const table2Raw = match[3].trim();
    const onCol1Raw = match[4].trim();
    const onCol2Raw = match[5].trim();
    whereClauseRaw = match[6] ? match[6].trim() : null;
    orderByClauseRaw = match[7] ? match[7].trim() : null;
    limitClauseRaw = match[8] ? match[8].trim() : null;
    
    const table1 = table1Raw.toLowerCase();
    const table2 = table2Raw.toLowerCase();
    if (!DATASETS[table1]) {
      return { success: false, error: `Table '${table1Raw}' does not exist.` };
    }
    if (!DATASETS[table2]) {
      return { success: false, error: `Table '${table2Raw}' does not exist.` };
    }
    
    const data1 = DATASETS[table1];
    const data2 = DATASETS[table2];
    const schema1 = TABLE_SCHEMAS[table1];
    const schema2 = TABLE_SCHEMAS[table2];
    
    const onCol1Parts = onCol1Raw.split(".");
    const onCol2Parts = onCol2Raw.split(".");
    const col1 = onCol1Parts[onCol1Parts.length - 1].toLowerCase();
    const col2 = onCol2Parts[onCol2Parts.length - 1].toLowerCase();
    
    const c1 = schema1.find(s => s.toLowerCase() === col1) || schema2.find(s => s.toLowerCase() === col1);
    const c2 = schema1.find(s => s.toLowerCase() === col2) || schema2.find(s => s.toLowerCase() === col2);
    if (!c1) {
      return { success: false, error: `Join column '${col1}' does not exist.` };
    }
    if (!c2) {
      return { success: false, error: `Join column '${col2}' does not exist.` };
    }
    
    let key1 = schema1.find(s => s.toLowerCase() === col1);
    let key2 = schema2.find(s => s.toLowerCase() === col2);
    if (onCol1Parts.length > 1 && onCol1Parts[0].toLowerCase() === table2) {
      key2 = schema2.find(s => s.toLowerCase() === col1);
      key1 = schema1.find(s => s.toLowerCase() === col2);
    }
    
    tableData = [];
    for (const r1 of data1) {
      for (const r2 of data2) {
        if (r1[key1] == r2[key2]) {
          const joinedRow = {};
          Object.assign(joinedRow, r1);
          Object.assign(joinedRow, r2);
          for (const [k, v] of Object.entries(r1)) {
            joinedRow[`${table1}.${k}`] = v;
          }
          for (const [k, v] of Object.entries(r2)) {
            joinedRow[`${table2}.${k}`] = v;
          }
          tableData.push(joinedRow);
        }
      }
    }
    
    schema = [];
    schema1.forEach(c => {
      schema.push(c);
      schema.push(`${table1}.${c}`);
    });
    schema2.forEach(c => {
      if (!schema.includes(c)) {
        schema.push(c);
      }
      schema.push(`${table2}.${c}`);
    });
    
    tableName = `${table1}_join_${table2}`;
  } else {
    const regex = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i;
    const match = cleanQuery.match(regex);
    if (!match) {
      if (lowerQuery.includes("where") && !lowerQuery.match(/\s+where\s+/)) {
        return { success: false, error: "Syntax error near 'WHERE'. Make sure to put spaces around 'WHERE'." };
      }
      if (lowerQuery.includes("order") && !lowerQuery.includes("order by")) {
        return { success: false, error: "To sort data, use 'ORDER BY' (both words are required)." };
      }
      return { 
        success: false, 
        error: "Could not parse query. Ensure your syntax matches: SELECT columns FROM table [WHERE filter] [ORDER BY column ASC/DESC] [LIMIT number]" 
      };
    }
    
    selectColsRaw = match[1].trim();
    tableNameRaw = match[2].trim();
    whereClauseRaw = match[3] ? match[3].trim() : null;
    orderByClauseRaw = match[4] ? match[4].trim() : null;
    limitClauseRaw = match[5] ? match[5].trim() : null;
    
    tableName = tableNameRaw.toLowerCase();
    if (!DATASETS[tableName]) {
      const availableTables = Object.keys(DATASETS).map(t => `'${t}'`).join(", ");
      return { 
        success: false, 
        error: `Table '${tableNameRaw}' does not exist. The available tables are: ${availableTables}.` 
      };
    }
    
    tableData = DATASETS[tableName];
    schema = TABLE_SCHEMAS[tableName];
  }

  // Parse columns and check for aggregate functions
  let selectedCols = [];
  let isAggregated = false;
  let aggColumns = [];

  if (selectColsRaw === "*") {
    selectedCols = [...schema];
  } else {
    const parts = selectColsRaw.split(",").map(c => c.trim());
    for (const col of parts) {
      if (col === "") {
        return { success: false, error: "Syntax error: Trailing or extra comma in SELECT columns list." };
      }
      
      const aggMatch = col.match(/^(COUNT|SUM|AVG|MIN|MAX)\((.*?)\)$/i);
      if (aggMatch) {
        isAggregated = true;
        const targetCol = aggMatch[2].trim();
        if (targetCol !== "*") {
          const matchingSchemaCol = schema.find(sc => sc.toLowerCase() === targetCol.toLowerCase());
          if (!matchingSchemaCol) {
            return { 
              success: false, 
              error: `Column '${targetCol}' inside ${aggMatch[1]}() does not exist in table '${tableNameRaw || tableName}'. Available columns: ${schema.join(", ")}.` 
            };
          }
        }
        aggColumns.push({
          expr: col,
          func: aggMatch[1].toUpperCase(),
          col: targetCol === "*" ? "*" : schema.find(sc => sc.toLowerCase() === targetCol.toLowerCase())
        });
      } else {
        const matchingSchemaCol = schema.find(sc => sc.toLowerCase() === col.toLowerCase());
        if (!matchingSchemaCol) {
          return { 
            success: false, 
            error: `Column '${col}' does not exist in table '${tableNameRaw || tableName}'. Available columns: ${schema.join(", ")}.` 
          };
        }
        aggColumns.push({
          expr: matchingSchemaCol,
          func: null,
          col: matchingSchemaCol
        });
      }
    }
    selectedCols = isAggregated ? aggColumns.map(a => a.expr) : aggColumns.map(a => a.col);
  }

  // Start with a copy of all rows
  let result = tableData.map(row => ({ ...row }));

  // Evaluate WHERE clause
  if (whereClauseRaw) {
    const filterResult = applyWhereFilter(result, whereClauseRaw, schema);
    if (!filterResult.success) {
      return { success: false, error: filterResult.error };
    }
    result = filterResult.data;
  }

  // Evaluate ORDER BY clause
  if (orderByClauseRaw) {
    const orderResult = applyOrderBy(result, orderByClauseRaw, schema);
    if (!orderResult.success) {
      return { success: false, error: orderResult.error };
    }
    result = orderResult.data;
  }

  // Evaluate LIMIT clause
  if (limitClauseRaw) {
    const limit = parseInt(limitClauseRaw, 10);
    if (isNaN(limit) || limit < 0) {
      return { success: false, error: "LIMIT value must be a positive number." };
    }
    result = result.slice(0, limit);
  }

  // Apply aggregations if required
  if (isAggregated) {
    const aggRow = {};
    aggColumns.forEach(agg => {
      const func = agg.func;
      const col = agg.col;
      const expr = agg.expr;
      
      if (func === "COUNT") {
        if (col === "*") {
          aggRow[expr] = result.length;
        } else {
          aggRow[expr] = result.filter(r => r[col] !== null && r[col] !== undefined).length;
        }
      } else if (func === "SUM") {
        let sum = 0;
        result.forEach(r => {
          const v = Number(r[col]);
          if (!isNaN(v)) sum += v;
        });
        aggRow[expr] = sum;
      } else if (func === "AVG") {
        let sum = 0;
        let count = 0;
        result.forEach(r => {
          const v = Number(r[col]);
          if (r[col] !== null && r[col] !== undefined && !isNaN(v)) {
            sum += v;
            count++;
          }
        });
        aggRow[expr] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      } else if (func === "MIN") {
        let min = Infinity;
        result.forEach(r => {
          const v = Number(r[col]);
          if (!isNaN(v) && v < min) min = v;
        });
        aggRow[expr] = min === Infinity ? 0 : min;
      } else if (func === "MAX") {
        let max = -Infinity;
        result.forEach(r => {
          const v = Number(r[col]);
          if (!isNaN(v) && v > max) max = v;
        });
        aggRow[expr] = max === -Infinity ? 0 : max;
      } else {
        aggRow[expr] = result.length > 0 ? result[0][col] : null;
      }
    });
    result = [aggRow];
  }

  // Project selected columns only
  const projectedData = result.map(row => {
    const projectedRow = {};
    selectedCols.forEach(col => {
      projectedRow[col] = row[col];
    });
    return projectedRow;
  });

  return {
    success: true,
    data: projectedData,
    columns: selectedCols,
    tableName: tableName
  };
}

/**
 * Parses and applies a simple WHERE clause.
 * Supports basic expressions: col = val, col > val, col < val, col LIKE '%val%', col != val
 * Supports compound expression with AND / OR (single level)
 */
function applyWhereFilter(data, whereStr, schema) {
  const andMatch = whereStr.match(/\s+and\s+/i);
  const orMatch = whereStr.match(/\s+or\s+/i);

  if (andMatch && orMatch) {
    return { success: false, error: "SQL Quest currently supports simple filters, or multiple filters connected by ONLY 'AND' or ONLY 'OR' (no mixing yet!)." };
  }

  if (andMatch) {
    const conditions = whereStr.split(/\s+and\s+/i);
    let filteredData = [...data];
    for (const cond of conditions) {
      const singleRes = evaluateSingleCondition(filteredData, cond, schema);
      if (!singleRes.success) return singleRes;
      filteredData = singleRes.data;
    }
    return { success: true, data: filteredData };
  } else if (orMatch) {
    const conditions = whereStr.split(/\s+or\s+/i);
    let orResults = [];
    for (const cond of conditions) {
      const singleRes = evaluateSingleCondition(data, cond, schema);
      if (!singleRes.success) return singleRes;
      orResults = orResults.concat(singleRes.data);
    }
    // De-duplicate rows by id
    const uniqueMap = {};
    orResults.forEach(row => { uniqueMap[row.id] = row; });
    return { success: true, data: Object.values(uniqueMap) };
  } else {
    return evaluateSingleCondition(data, whereStr, schema);
  }
}

function evaluateSingleCondition(data, conditionStr, schema) {
  // Parse operators: =, !=, <>, >, <, >=, <=, like
  const operators = [
    { symbol: ">=", name: "GE" },
    { symbol: "<=", name: "LE" },
    { symbol: "!=", name: "NE" },
    { symbol: "<>", name: "NE" },
    { symbol: "=", name: "EQ" },
    { symbol: ">", name: "GT" },
    { symbol: "<", name: "LT" },
    { symbol: " like ", name: "LIKE", isKeyword: true }
  ];

  let foundOp = null;
  let opSymbol = "";
  
  for (const op of operators) {
    if (op.isKeyword) {
      const idx = conditionStr.toLowerCase().indexOf(op.symbol);
      if (idx !== -1) {
        foundOp = op;
        opSymbol = conditionStr.substring(idx, idx + op.symbol.length);
        break;
      }
    } else {
      const idx = conditionStr.indexOf(op.symbol);
      if (idx !== -1) {
        foundOp = op;
        opSymbol = op.symbol;
        break;
      }
    }
  }

  if (!foundOp) {
    return { 
      success: false, 
      error: `Could not parse filter condition '${conditionStr}'. Try using operators like '=', '>', '<', or 'LIKE'.` 
    };
  }

  const opIdx = conditionStr.toLowerCase().indexOf(opSymbol.toLowerCase());
  const leftHand = conditionStr.substring(0, opIdx).trim();
  const rightHand = conditionStr.substring(opIdx + opSymbol.length).trim();

  // Validate column name
  const colName = schema.find(s => s.toLowerCase() === leftHand.toLowerCase());
  if (!colName) {
    return { success: false, error: `Filter column '${leftHand}' does not exist. Available columns: ${schema.join(", ")}` };
  }

  // Parse value (strip quotes if string)
  let val = rightHand;
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.substring(1, val.length - 1);
  } else {
    // try to parse as number or boolean
    if (val.toLowerCase() === "true") {
      val = true;
    } else if (val.toLowerCase() === "false") {
      val = false;
    } else {
      const numVal = Number(val);
      if (!isNaN(numVal) && val !== "") {
        val = numVal;
      }
    }
  }

  const filtered = data.filter(row => {
    const rowVal = row[colName];

    if (rowVal === null || rowVal === undefined) return false;

    switch (foundOp.name) {
      case "EQ":
        if (typeof rowVal === "string" && typeof val === "string") {
          return rowVal.toLowerCase() === val.toLowerCase();
        }
        return rowVal == val;
      case "NE":
        if (typeof rowVal === "string" && typeof val === "string") {
          return rowVal.toLowerCase() !== val.toLowerCase();
        }
        return rowVal != val;
      case "GT":
        return rowVal > val;
      case "LT":
        return rowVal < val;
      case "GE":
        return rowVal >= val;
      case "LE":
        return rowVal <= val;
      case "LIKE":
        if (typeof rowVal !== "string") return false;
        const cleanPattern = String(val)
          .replace(/%/g, ".*")
          .replace(/_/g, ".");
        const regex = new RegExp(`^${cleanPattern}$`, "i");
        return regex.test(rowVal);
      default:
        return false;
    }
  });

  return { success: true, data: filtered };
}

/**
 * Applies sorting based on ORDER BY.
 * Supports: ORDER BY column [ASC|DESC]
 */
function applyOrderBy(data, orderByStr, schema) {
  const parts = orderByStr.split(/\s+/);
  const colNameRaw = parts[0].trim();
  let direction = "ASC";

  if (parts.length > 1) {
    const dirRaw = parts[1].toUpperCase();
    if (dirRaw === "DESC") {
      direction = "DESC";
    } else if (dirRaw !== "ASC") {
      return { success: false, error: `Invalid sort direction '${parts[1]}'. Use 'ASC' or 'DESC'.` };
    }
  }

  const colName = schema.find(s => s.toLowerCase() === colNameRaw.toLowerCase());
  if (!colName) {
    return { success: false, error: `ORDER BY column '${colNameRaw}' does not exist.` };
  }

  const sorted = [...data].sort((a, b) => {
    let valA = a[colName];
    let valB = b[colName];

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return direction === "ASC" ? -1 : 1;
    if (valA > valB) return direction === "ASC" ? 1 : -1;
    return 0;
  });

  return { success: true, data: sorted };
}

// Export for browser and node testing
if (typeof window !== "undefined") {
  window.SQLDatabase = {
    query: runSQLQuery,
    datasets: DATASETS,
    schemas: TABLE_SCHEMAS
  };
}
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = {
    query: runSQLQuery,
    datasets: DATASETS,
    schemas: TABLE_SCHEMAS
  };
}
