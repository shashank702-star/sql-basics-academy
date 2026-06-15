// SQL Quest - Application State & UI Controller

document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements ---
  const editorInput = document.getElementById("sql-editor");
  const editorHighlight = document.getElementById("editor-highlight");
  const runBtn = document.getElementById("run-query-btn");
  const consoleOutput = document.getElementById("console-output");
  const tableContainer = document.getElementById("table-container");
  
  // Navigation Tabs
  const tabButtons = document.querySelectorAll(".nav-tab");
  const mainWorkspace = document.getElementById("main-workspace");
  const workspaceQuest = document.getElementById("workspace-quest");
  const workspaceSandbox = document.getElementById("workspace-sandbox");
  const workspaceResources = document.getElementById("workspace-resources");

  // AI Playground UI Elements
  const aiPromptInput = document.getElementById("ai-prompt-input");
  const aiSubmitBtn = document.getElementById("ai-submit-btn");
  const aiSuggestChips = document.querySelectorAll(".ai-suggest-chip");
  const aiExplanationBubble = document.getElementById("ai-explanation-bubble");
  const aiExplanationText = document.getElementById("ai-explanation-text");
  
  // Quest Panel Elements
  const questTitle = document.getElementById("quest-title");
  const questDescription = document.getElementById("quest-description");
  const questObjective = document.getElementById("quest-objective");
  const questHintBtn = document.getElementById("quest-hint-btn");
  const questHintText = document.getElementById("quest-hint-text");
  const questFeedback = document.getElementById("quest-feedback");
  const nextQuestBtn = document.getElementById("next-quest-btn");
  const questProgressFill = document.getElementById("quest-progress-fill");
  const questProgressText = document.getElementById("quest-progress-text");
  
  // Sandbox Table Schema Info
  const sandboxTables = document.querySelectorAll(".schema-card");
  const queryTemplates = document.querySelectorAll(".template-chip");
  
  // Roadmap Nodes
  const roadmapNodes = document.querySelectorAll(".roadmap-node");
  const roadmapModal = document.getElementById("roadmap-modal");
  const roadmapModalClose = document.getElementById("roadmap-modal-close");
  const roadmapModalTitle = document.getElementById("roadmap-modal-title");
  const roadmapModalBody = document.getElementById("roadmap-modal-body");

  // --- State Variables ---
  let currentMode = "quest"; // "quest", "sandbox", "resources"
  let currentQuestIndex = 0;
  let highestCompletedLevel = 0; // Tracks unlocked levels (0 = Lvl 1 unlocked, 1 = Lvl 2 unlocked, etc.)
  let hasCompletedCurrentQuest = false;

  // --- Quest Definitions ---
  const QUESTS = [
    {
      title: "Quest 1: Gather the Crew",
      description: "Welcome Cadet! Our spaceship, the *Star Seeker*, is preparing for departure. Before we launch, we need to list every crew member on board to verify our manifest.",
      objective: "Retrieve **all columns** and **all rows** from the `space_crew` table.",
      hint: "To select everything from a table, use the asterisk `*` operator:\n`SELECT * FROM space_crew;`",
      initialQuery: "SELECT * FROM space_crew;",
      validate: (result) => {
        if (!result.success) return false;
        if (result.tableName !== "space_crew") return false;
        const schema = window.SQLDatabase.schemas.space_crew;
        const hasAllCols = schema.every(col => result.columns.includes(col));
        return hasAllCols && result.data.length === 7;
      },
      successMessage: "Fantastic! You've retrieved the entire crew list. Commander Nova, Zara Chen, and even SAM-9 are all present and accounted for. Quest 1 Completed!"
    },
    {
      title: "Quest 2: Find the Navigator",
      description: "Great work! Now, a solar flare is approaching and we need to recalculate our jump coordinates. We need to locate our **Navigator** immediately.",
      objective: "Filter the `space_crew` table to find the crew member whose `role` is `'Navigator'`.",
      hint: "Use the `WHERE` clause to filter by column values:\n`SELECT * FROM space_crew WHERE role = 'Navigator';`",
      initialQuery: "SELECT name, role FROM space_crew WHERE ;",
      validate: (result) => {
        if (!result.success) return false;
        if (result.tableName !== "space_crew") return false;
        const containsZara = result.data.some(row => row.name === "Zara Chen" || row.role === "Navigator");
        const allAreNavigators = result.data.every(row => row.role === "Navigator");
        return containsZara && allAreNavigators && result.data.length === 1;
      },
      successMessage: "Superb! You found Zara Chen, our Navigator. She is already programming the nav-computer. Quest 2 Completed!"
    },
    {
      title: "Quest 3: Sort the Cargo Bay",
      description: "Our fuel levels are sensitive to weight distribution. We need to inspect our cargo bay and list all items sorted from **heaviest to lightest** so engineers can balance the thrusters.",
      objective: "Select all cargo items and order them by `weight_kg` in **descending** order.",
      hint: "Use `ORDER BY column DESC` to sort items from highest to lowest:\n`SELECT * FROM cargo ORDER BY weight_kg DESC;`",
      initialQuery: "SELECT item, weight_kg FROM cargo ORDER BY ;",
      validate: (result) => {
        if (!result.success) return false;
        if (result.tableName !== "cargo") return false;
        if (result.data.length < 5) return false;
        let lastWeight = Infinity;
        for (const row of result.data) {
          if (row.weight_kg === undefined) return false;
          if (row.weight_kg > lastWeight) return false;
          lastWeight = row.weight_kg;
        }
        return true;
      },
      successMessage: "Brilliant! You've sorted the cargo bay. The Titanium Plating (1200kg) and Deuterium Fuel Cells (800kg) are at the top of the list. We're fully balanced and ready to jump! Quest 3 Completed!"
    },
    {
      title: "Quest 4: Fuel Consumption & Crew Counts",
      description: "We are calculating our food and oxygen consumption ratios. Before modifying the allocations, we need to know the total number of **Active** crew members on board and their average experience (years active).",
      objective: "Calculate the **total count** of crew members and their **average years active** where `status` is `'Active'`.",
      hint: "Use `COUNT(*)` and `AVG(years_active)` aggregate functions together:\n`SELECT COUNT(*), AVG(years_active) FROM space_crew WHERE status = 'Active';`",
      initialQuery: "SELECT COUNT(*), AVG(years_active) FROM space_crew WHERE ;",
      validate: (result) => {
        if (!result.success) return false;
        if (result.tableName !== "space_crew") return false;
        if (result.data.length !== 1) return false;
        const row = result.data[0];
        const keys = Object.keys(row);
        const countKey = keys.find(k => k.toLowerCase().replace(/\s+/g, "") === "count(*)");
        const avgKey = keys.find(k => k.toLowerCase().replace(/\s+/g, "") === "avg(years_active)");
        if (!countKey || !avgKey) return false;
        return row[countKey] == 5 && Math.round(row[avgKey]) == 10;
      },
      successMessage: "Splendid! We have exactly 5 active crew members with an average of 10 years of experience. Our crew is highly skilled and ready to maintain flight operations! Quest 4 Completed!"
    },
    {
      title: "Quest 5: Destination Flight Log",
      description: "Now, let's map out where our pilots are flying. Since mission details are kept in the `space_missions` table and crew names are in the `space_crew` table, we need to link them together.",
      objective: "Perform a **JOIN** between `space_crew` and `space_missions` on `space_crew.id = space_missions.pilot_id` to retrieve the pilot's `name` and their mission `destination`.",
      hint: "Join tables using `JOIN` and the `ON` matching column criteria:\n`SELECT space_crew.name, space_missions.destination FROM space_crew JOIN space_missions ON space_crew.id = space_missions.pilot_id;`",
      initialQuery: "SELECT space_crew.name, space_missions.destination FROM space_crew JOIN space_missions ON ;",
      validate: (result) => {
        if (!result.success) return false;
        if (result.tableName !== "space_crew_join_space_missions") return false;
        if (result.data.length !== 3) return false;
        const matches = result.data.map(row => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.endsWith("name"));
          const destKey = keys.find(k => k.endsWith("destination"));
          return { name: row[nameKey], dest: row[destKey] };
        });
        const hasNova = matches.some(m => m.name === "Commander Nova" && m.dest === "Zephyr-7");
        const hasZara = matches.some(m => m.name === "Zara Chen" && m.dest === "Valkyrie");
        const hasSam = matches.some(m => m.name === "SAM-9" && m.dest === "Gorgon Prime");
        return hasNova && hasZara && hasSam;
      },
      successMessage: "Incredible! You have successfully linked the crew with their destinations. Zara is heading to Valkyrie, Commander Nova to Zephyr-7, and SAM-9 to Gorgon Prime. You have completed all flight academy quests! Master Badge Earned!"
    }
  ];

  // --- Roadmap Concepts Data ---
  const ROADMAP_CONCEPTS = {
    1: {
      title: "Level 1: SELECT & Columns",
      body: `
        <p>In databases, data is organized in <strong>tables</strong> (made of columns and rows).</p>
        <p>The <code>SELECT</code> statement is how you ask the database to show you information. Think of it like making a query to a spreadsheet.</p>
        <div class="code-block-preview">
          <span class="keyword">SELECT</span> name, role <span class="keyword">FROM</span> space_crew;
        </div>
        <ul>
          <li><code>SELECT</code> specifies which columns you want to view. Use <code>*</code> to select <em>all</em> columns.</li>
          <li><code>FROM</code> specifies the table you want to query.</li>
        </ul>
      `
    },
    2: {
      title: "Level 2: WHERE & Filtering",
      body: `
        <p>Usually, you don't want to look at all the rows. The <code>WHERE</code> clause lets you filter data based on specific conditions.</p>
        <div class="code-block-preview">
          <span class="keyword">SELECT</span> * <span class="keyword">FROM</span> space_crew <span class="keyword">WHERE</span> status = 'Active';
        </div>
        <ul>
          <li>Filters rows where the condition is <code>true</code>.</li>
          <li>Supports comparison operators: <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>.</li>
          <li>To search for text patterns, use <code>LIKE</code> with wildcards (e.g., <code>name LIKE 'Dr.%'</code> matches names starting with 'Dr.').</li>
        </ul>
      `
    },
    3: {
      title: "Level 3: ORDER BY & LIMIT",
      body: `
        <p>Databases don't store rows in any guaranteed order. To arrange your output, use the <code>ORDER BY</code> clause.</p>
        <div class="code-block-preview">
          <span class="keyword">SELECT</span> * <span class="keyword">FROM</span> cargo <span class="keyword">ORDER BY</span> weight_kg <span class="keyword">DESC</span>;
        </div>
        <ul>
          <li><code>ORDER BY column</code> sorts in ascending order (default, or <code>ASC</code>).</li>
          <li>Add <code>DESC</code> to sort in descending order (largest/latest first).</li>
          <li>To get only the top few rows, append <code>LIMIT number</code> (e.g., <code>LIMIT 3</code>).</li>
        </ul>
      `
    },
    4: {
      title: "Level 4: Aggregations & COUNT",
      body: `
        <p>Sometimes you want to summarize data instead of listing rows. SQL provides functions like <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, and <code>MAX</code>.</p>
        <div class="code-block-preview">
          <span class="keyword">SELECT</span> <span class="fn">COUNT</span>(*), <span class="fn">AVG</span>(years_active) <span class="keyword">FROM</span> space_crew;
        </div>
        <ul>
          <li><code>COUNT(*)</code> returns the total number of rows.</li>
          <li><code>AVG(column)</code> computes the mathematical average of a numeric column.</li>
        </ul>
      `
    },
    5: {
      title: "Level 5: JOIN & Multi-tables",
      body: `
        <p>In relational databases, data is split into multiple tables to avoid duplication. A <code>JOIN</code> connects tables together using common columns.</p>
        <div class="code-block-preview">
          <span class="keyword">SELECT</span> crew.name, missions.destination <br>
          <span class="keyword">FROM</span> space_crew crew <br>
          <span class="keyword">JOIN</span> space_missions missions <span class="keyword">ON</span> crew.id = missions.pilot_id;
        </div>
        <p>This links the crew table directly to the missions table to find who is flying where!</p>
      `
    }
  };

  // --- Initial Setup ---
  initQuest(0);
  updateProgressBar();
  updateUnlockedResources();

  // --- Navigation & Tab Controls ---
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const tabName = btn.getAttribute("data-tab");
      currentMode = tabName;
      
      if (tabName === "quest") {
        mainWorkspace.classList.remove("hidden");
        workspaceQuest.classList.remove("hidden");
        workspaceSandbox.classList.add("hidden");
        workspaceResources.classList.add("hidden");
        initQuest(currentQuestIndex);
      } else if (tabName === "sandbox") {
        mainWorkspace.classList.remove("hidden");
        workspaceQuest.classList.add("hidden");
        workspaceSandbox.classList.remove("hidden");
        workspaceResources.classList.add("hidden");
        editorInput.value = "SELECT * FROM planets;";
        updateHighlighting();
        clearConsole();
      } else if (tabName === "resources") {
        mainWorkspace.classList.add("hidden");
        workspaceResources.classList.remove("hidden");
        updateUnlockedResources();
      }
    });
  });

  // --- Editor & Query Logic ---
  runBtn.addEventListener("click", () => {
    executeSQL();
  });

  // Let users press Cmd+Enter or Ctrl+Enter to run query
  editorInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeSQL();
    }
  });

  // --- Syntax Highlighting Synchronizers ---
  function escapeHTML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlightSQL(text) {
    let html = escapeHTML(text);
    
    // Highlight strings
    let strings = [];
    html = html.replace(/(['"])(.*?)\1/g, (match) => {
      const id = strings.length;
      strings.push(match);
      return `__STR_${id}__`;
    });

    // Highlight SQL Keywords (case-insensitive)
    const keywords = /\b(SELECT|FROM|WHERE|ORDER\s+BY|LIMIT|AND|OR|LIKE|ASC|DESC|JOIN|ON|COUNT|SUM|AVG|MIN|MAX)\b/gi;
    html = html.replace(keywords, '<span class="hl-keyword">$&</span>');

    // Highlight numbers
    const numbers = /\b\d+(?:\.\d+)?\b/g;
    html = html.replace(numbers, '<span class="hl-number">$&</span>');

    // Highlight operators
    const operators = /(=|!=|&lt;&gt;|&gt;=|&lt;=|&gt;|&lt;)/g;
    html = html.replace(operators, '<span class="hl-operator">$&</span>');

    // Put strings back
    for (let i = 0; i < strings.length; i++) {
      html = html.replace(`__STR_${i}__`, `<span class="hl-string">${strings[i]}</span>`);
    }

    if (html.endsWith("\n") || html === "") {
      html += " ";
    }
    return html;
  }

  function updateHighlighting() {
    if (editorHighlight) {
      editorHighlight.innerHTML = highlightSQL(editorInput.value);
      editorHighlight.scrollTop = editorInput.scrollTop;
      editorHighlight.scrollLeft = editorInput.scrollLeft;
    }
  }

  editorInput.addEventListener("input", updateHighlighting);
  editorInput.addEventListener("scroll", () => {
    if (editorHighlight) {
      editorHighlight.scrollTop = editorInput.scrollTop;
      editorHighlight.scrollLeft = editorInput.scrollLeft;
    }
  });

  function executeSQL() {
    const queryText = editorInput.value;
    clearConsole();

    consoleOutput.classList.add("executing");
    setTimeout(() => consoleOutput.classList.remove("executing"), 200);

    const result = window.SQLDatabase.query(queryText);

    if (result.success) {
      renderTable(result.data, result.columns);
      printConsoleMessage(`Query executed successfully! Found ${result.data.length} row(s).`, "success");
      
      if (currentMode === "quest") {
        checkQuestCompletion(result);
      }
    } else {
      printConsoleMessage(`Syntax Error: ${result.error}`, "error");
      renderErrorFeedback(result.error);
    }
  }

  function renderTable(data, columns) {
    tableContainer.innerHTML = "";
    if (data.length === 0) {
      tableContainer.innerHTML = `<div class="empty-table-msg">Query returned 0 rows. Table is empty or no records matched the filters.</div>`;
      return;
    }

    const table = document.createElement("table");
    table.className = "sql-result-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach(row => {
      const bodyRow = document.createElement("tr");
      columns.forEach(col => {
        const td = document.createElement("td");
        if (typeof row[col] === "boolean") {
          td.textContent = row[col] ? "TRUE" : "FALSE";
          td.classList.add(row[col] ? "bool-true" : "bool-false");
        } else if (row[col] === null || row[col] === undefined) {
          td.innerHTML = `<span class="null-val">NULL</span>`;
        } else {
          td.textContent = row[col];
        }
        bodyRow.appendChild(td);
      });
      tbody.appendChild(bodyRow);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }

  function printConsoleMessage(msg, type) {
    const p = document.createElement("p");
    p.className = `console-line line-${type}`;
    p.innerHTML = `<span class="console-timestamp">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    consoleOutput.appendChild(p);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function renderErrorFeedback(errorMsg) {
    tableContainer.innerHTML = `
      <div class="sql-error-helper">
        <div class="helper-icon">💡</div>
        <div class="helper-content">
          <h4>SQL Guidance:</h4>
          <p>${errorMsg}</p>
        </div>
      </div>
    `;
  }

  function clearConsole() {
    consoleOutput.innerHTML = "";
    tableContainer.innerHTML = `<div class="table-placeholder">Table results will appear here.</div>`;
    questFeedback.classList.add("hidden");
    questFeedback.classList.remove("success-animate");
  }

  // --- Quest Logic ---
  function initQuest(index) {
    currentQuestIndex = index;
    hasCompletedCurrentQuest = false;
    const quest = QUESTS[index];

    questTitle.textContent = quest.title;
    questDescription.innerHTML = quest.description;
    questObjective.innerHTML = quest.objective;
    
    questHintText.classList.add("hidden");
    questHintText.textContent = quest.hint;
    questHintBtn.textContent = "Show Hint";

    editorInput.value = quest.initialQuery;
    updateHighlighting();
    nextQuestBtn.classList.add("hidden");
    clearConsole();
    updateProgressBar();
  }

  questHintBtn.addEventListener("click", () => {
    if (questHintText.classList.contains("hidden")) {
      questHintText.classList.remove("hidden");
      questHintBtn.textContent = "Hide Hint";
    } else {
      questHintText.classList.add("hidden");
      questHintBtn.textContent = "Show Hint";
    }
  });

  function checkQuestCompletion(result) {
    const quest = QUESTS[currentQuestIndex];
    if (quest.validate(result)) {
      hasCompletedCurrentQuest = true;
      questFeedback.className = "quest-feedback-panel visible success-panel success-animate";
      questFeedback.innerHTML = `
        <div class="feedback-icon">🎉</div>
        <div class="feedback-text">
          <h3>Quest Solved!</h3>
          <p>${quest.successMessage}</p>
        </div>
      `;
      
      // Update highest completed level
      highestCompletedLevel = Math.max(highestCompletedLevel, currentQuestIndex + 1);

      updateRoadmapState(currentQuestIndex + 1);
      updateUnlockedResources();

      if (currentQuestIndex < QUESTS.length - 1) {
        nextQuestBtn.classList.remove("hidden");
      } else {
        showCelebrationBadge();
      }
    }
  }

  nextQuestBtn.addEventListener("click", () => {
    if (currentQuestIndex < QUESTS.length - 1) {
      initQuest(currentQuestIndex + 1);
    }
  });

  function updateProgressBar() {
    const percent = Math.round(((currentQuestIndex) / QUESTS.length) * 100);
    questProgressFill.style.width = `${percent}%`;
    questProgressText.textContent = `Progress: ${currentQuestIndex}/${QUESTS.length} Quests Completed`;
  }

  function showCelebrationBadge() {
    questFeedback.className = "quest-feedback-panel visible final-success-panel";
    questFeedback.innerHTML = `
      <div class="badge-animation-container">
        <div class="glowing-badge">🌌</div>
      </div>
      <div class="feedback-text">
        <h3>Commander of SQL!</h3>
        <p>Excellent! You have successfully completed all onboarding quests and are officially certified in basic SQL operations. You are ready to explore the galaxy!</p>
        <button id="restart-quests-btn" class="action-btn secondary-btn">Restart Journey</button>
      </div>
    `;
    questProgressFill.style.width = "100%";
    questProgressText.textContent = "Progress: 5/5 Quests Completed - Master Badge Earned!";
    
    document.getElementById("restart-quests-btn").addEventListener("click", () => {
      initQuest(0);
      highestCompletedLevel = 0;
      updateRoadmapState(0);
      updateUnlockedResources();
    });
  }

  function updateRoadmapState(completedLevel) {
    roadmapNodes.forEach((node, idx) => {
      node.classList.remove("completed", "active");
      if (idx < completedLevel) {
        node.classList.add("completed");
      } else if (idx === completedLevel) {
        node.classList.add("active");
      }
    });
  }

  // --- Roadmap Modal Controllers ---
  roadmapNodes.forEach(node => {
    node.addEventListener("click", () => {
      const levelId = node.getAttribute("data-level");
      const concept = ROADMAP_CONCEPTS[levelId];
      if (concept) {
        roadmapModalTitle.textContent = concept.title;
        roadmapModalBody.innerHTML = concept.body;
        roadmapModal.classList.remove("hidden");
      }
    });
  });

  roadmapModalClose.addEventListener("click", () => {
    roadmapModal.classList.add("hidden");
  });

  window.addEventListener("click", (e) => {
    if (e.target === roadmapModal) {
      roadmapModal.classList.add("hidden");
    }
  });

  // --- Sandbox Controls ---
  queryTemplates.forEach(chip => {
    chip.addEventListener("click", () => {
      const query = chip.getAttribute("data-query");
      editorInput.value = query;
      updateHighlighting();
      executeSQL();
    });
  });

  // Schema card selection
  const schemaCardsV2 = document.querySelectorAll(".schema-card-v2");
  schemaCardsV2.forEach(card => {
    card.addEventListener("click", () => {
      schemaCardsV2.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  // Column inserts
  const schemaColumns = document.querySelectorAll(".schema-columns-list li");
  schemaColumns.forEach(li => {
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      const colName = li.querySelector(".col-name").textContent;
      const startPos = editorInput.selectionStart;
      const endPos = editorInput.selectionEnd;
      const text = editorInput.value;
      
      editorInput.value = text.substring(0, startPos) + colName + text.substring(endPos);
      editorInput.selectionStart = editorInput.selectionEnd = startPos + colName.length;
      editorInput.focus();
      updateHighlighting();
    });
  });

  // Quick view triggers
  const quickViewBtns = document.querySelectorAll(".quick-view-btn");
  quickViewBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tableName = btn.getAttribute("data-table");
      editorInput.value = `SELECT * FROM ${tableName};`;
      updateHighlighting();
      executeSQL();
    });
  });

  // --- Resource Center Logic & Gamification ---
  function updateUnlockedResources() {
    const resourceCards = document.querySelectorAll("[data-resource-lvl]");
    resourceCards.forEach(card => {
      const cardLvl = parseInt(card.getAttribute("data-resource-lvl"), 10);
      const link = card.querySelector(".resource-link-btn");
      const copyBtn = card.querySelector(".copy-code-btn");
      
      if (cardLvl <= highestCompletedLevel + 1) {
        card.classList.remove("locked");
        card.classList.add("unlocked");
        
        const badge = card.querySelector(".card-status-badge");
        if (badge) {
          badge.textContent = "Unlocked";
          badge.style.background = "var(--accent-success-light)";
          badge.style.color = "var(--accent-success)";
        }
        
        if (link) {
          link.classList.remove("disabled");
          if (cardLvl === 2) {
            link.href = "https://www.youtube.com/watch?v=7S_tz1z_5bA";
            link.textContent = "Watch Video (10 min) \u2192";
          } else if (cardLvl === 3) {
            link.href = "https://www.youtube.com/watch?v=85pG_pZgQL8";
            link.textContent = "Watch Video (12 min) \u2192";
          } else if (cardLvl === 4) {
            link.href = "https://www.youtube.com/watch?v=F3_mPZ4y_B0";
            link.textContent = "Watch Video (10 min) \u2192";
          } else if (cardLvl === 5) {
            link.href = "https://www.youtube.com/watch?v=9yeOJ0xxTuk";
            link.textContent = "Watch Video (12 min) \u2192";
          } else if (cardLvl === 1 && link.getAttribute("download")) {
            // Unlocked download link remains standard
          } else if (cardLvl === 2 && !link.getAttribute("download")) {
            link.setAttribute("download", "SQL_WHERE_Clause_Guide.txt");
            link.href = "data:text/plain;charset=utf-8,WHERE CLAUSE GUIDE:%0A- Use WHERE to filter rows based on conditions.%0A- Syntax: SELECT * FROM table WHERE column = value;%0A- Operators:%0A  = (equals)%0A  != or <> (not equal)%0A  > (greater than)%0A  < (less than)%0A  LIKE (pattern matching with %25 wildcard)";
            link.textContent = "Download Guide (TXT) \u2193";
          } else if (cardLvl === 3 && !link.getAttribute("download")) {
            link.setAttribute("download", "SQL_ORDER_LIMIT_Guide.txt");
            link.href = "data:text/plain;charset=utf-8,ORDER BY & LIMIT GUIDE:%0A- Use ORDER BY to sort rows by a column.%0A- Syntax: SELECT * FROM table ORDER BY column [ASC|DESC];%0A- Use LIMIT to restrict the number of rows returned.%0A- Syntax: SELECT * FROM table LIMIT number;%0A- Example: SELECT * FROM cargo ORDER BY weight_kg DESC LIMIT 3;";
            link.textContent = "Download Guide (TXT) \u2193";
          } else if (cardLvl === 4 && !link.getAttribute("download")) {
            link.setAttribute("download", "SQL_Aggregations_Guide.txt");
            link.href = "data:text/plain;charset=utf-8,SQL AGGREGATIONS %26 MATH GUIDE:%0A- Aggregations summarize a column of numbers into one value.%0A- Functions:%0A  COUNT(*) : Count total rows.%0A  AVG(column) : Calculate average.%0A  SUM(column) : Calculate sum.%0A  MIN(column) : Get lowest value.%0A  MAX(column) : Get highest value.%0A- Example: SELECT COUNT(*), AVG(years_active) FROM space_crew WHERE status = 'Active';";
            link.textContent = "Download Guide (TXT) \u2193";
          } else if (cardLvl === 5 && !link.getAttribute("download")) {
            link.setAttribute("download", "SQL_JOINs_Guide.txt");
            link.href = "data:text/plain;charset=utf-8,SQL JOINS %26 RELATIONSHIPS GUIDE:%0A- JOIN is used to connect two or more tables together based on a related column.%0A- Syntax: SELECT columns FROM table1 JOIN table2 ON table1.column = table2.column;%0A- Example: SELECT space_crew.name, space_missions.destination FROM space_crew JOIN space_missions ON space_crew.id = space_missions.pilot_id;";
            link.textContent = "Download Guide (TXT) \u2193";
          }
        }
        
        if (copyBtn) {
          copyBtn.removeAttribute("disabled");
          copyBtn.classList.remove("disabled");
          if (cardLvl === 2) {
            copyBtn.textContent = "Copy Code";
            copyBtn.setAttribute("data-code", "SELECT * FROM cargo WHERE weight_kg > 500;");
          } else if (cardLvl === 3) {
            copyBtn.textContent = "Copy Code";
            copyBtn.setAttribute("data-code", "SELECT * FROM planets ORDER BY distance_ly DESC;");
          } else if (cardLvl === 4) {
            copyBtn.textContent = "Copy Code";
            copyBtn.setAttribute("data-code", "SELECT COUNT(*), AVG(years_active) FROM space_crew WHERE status = 'Active';");
          } else if (cardLvl === 5) {
            copyBtn.textContent = "Copy Code";
            copyBtn.setAttribute("data-code", "SELECT space_crew.name, space_missions.destination FROM space_crew JOIN space_missions ON space_crew.id = space_missions.pilot_id;");
          }
        }
      } else {
        card.classList.remove("unlocked");
        card.classList.add("locked");
        
        const badge = card.querySelector(".card-status-badge");
        if (badge) {
          badge.textContent = "Locked";
          badge.style.background = "#e2e8f0";
          badge.style.color = "#64748b";
        }
        
        if (link) {
          link.classList.add("disabled");
          link.href = "#";
          link.removeAttribute("download");
          link.textContent = `Solve Quest ${cardLvl - 1} to Unlock`;
        }
        
        if (copyBtn) {
          copyBtn.setAttribute("disabled", "true");
          copyBtn.classList.add("disabled");
          copyBtn.textContent = "Locked";
        }
      }
    });

    const unlockSummary = document.getElementById("resource-unlock-summary");
    if (unlockSummary) {
      unlockSummary.textContent = `Unlocked: ${highestCompletedLevel + 1}/5 Levels`;
    }
  }

  // Bind Copy Code Buttons
  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("copy-code-btn")) {
      const code = e.target.getAttribute("data-code");
      if (code && !e.target.disabled) {
        navigator.clipboard.writeText(code).then(() => {
          const originalText = e.target.textContent;
          e.target.textContent = "Copied!";
          setTimeout(() => {
            e.target.textContent = originalText;
          }, 1500);
        });
      }
    }
  });

  // Download All Notes as Text File
  const downloadNotesBtn = document.getElementById("download-txt-notes-btn");
  if (downloadNotesBtn) {
    downloadNotesBtn.addEventListener("click", () => {
      let content = "=== SQL QUEST ACADEMY NOTES ===\n\n";
      content += "100% Free Forever Learning Resource\n";
      content += "===================================\n\n";
      
      content += "LEVEL 1: SELECT COLUMNS (Unlocked)\n";
      content += "Syntax:\nSELECT column1, column2 FROM table;\n";
      content += "Example:\nSELECT name, role FROM space_crew;\n\n";
      
      if (highestCompletedLevel >= 1) {
        content += "LEVEL 2: WHERE FILTERS (Unlocked)\n";
        content += "Syntax:\nSELECT * FROM table WHERE condition;\n";
        content += "Example:\nSELECT * FROM cargo WHERE weight_kg > 500;\n\n";
      } else {
        content += "LEVEL 2: WHERE FILTERS (Locked - Complete Quest 1 to unlock)\n\n";
      }
      
      if (highestCompletedLevel >= 2) {
        content += "LEVEL 3: ORDER BY & LIMIT (Unlocked)\n";
        content += "Syntax:\nSELECT * FROM table ORDER BY column [ASC|DESC] LIMIT count;\n";
        content += "Example:\nSELECT * FROM planets ORDER BY distance_ly DESC;\n\n";
      } else {
        content += "LEVEL 3: ORDER BY & LIMIT (Locked - Complete Quest 2 to unlock)\n\n";
      }

      if (highestCompletedLevel >= 3) {
        content += "LEVEL 4: AGGREGATIONS & MATH (Unlocked)\n";
        content += "Syntax:\nSELECT COUNT(*), AVG(column), SUM(column) FROM table WHERE condition;\n";
        content += "Example:\nSELECT COUNT(*), AVG(years_active) FROM space_crew WHERE status = 'Active';\n\n";
      } else {
        content += "LEVEL 4: AGGREGATIONS & MATH (Locked - Complete Quest 3 to unlock)\n\n";
      }

      if (highestCompletedLevel >= 4) {
        content += "LEVEL 5: RELATIONAL JOINS (Unlocked)\n";
        content += "Syntax:\nSELECT columns FROM table1 JOIN table2 ON table1.key = table2.key;\n";
        content += "Example:\nSELECT space_crew.name, space_missions.destination FROM space_crew JOIN space_missions ON space_crew.id = space_missions.pilot_id;\n\n";
      } else {
        content += "LEVEL 5: RELATIONAL JOINS (Locked - Complete Quest 4 to unlock)\n\n";
      }
      
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SQL_Quest_Learning_Notes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Print/Save PDF Notes
  const printNotesBtn = document.getElementById("print-pdf-notes-btn");
  if (printNotesBtn) {
    printNotesBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // --- AI SQL Copilot Engine & Animations ---
  function translatePromptToSQL(promptText) {
    const p = promptText.toLowerCase().trim();
    let sql = "";
    let explanation = "";

    if (p.includes("crew") || p.includes("member") || p.includes("people") || p.includes("manifest") || p.includes("person") || p.includes("active") || p.includes("captain") || p.includes("navigator") || p.includes("commander")) {
      if (p.includes("count") || p.includes("how many")) {
        if (p.includes("active")) {
          sql = "SELECT COUNT(*) FROM space_crew WHERE status = 'Active';";
          explanation = "I counted the total number of crew members in the `space_crew` table where the `status` is 'Active'.";
        } else {
          sql = "SELECT COUNT(*) FROM space_crew;";
          explanation = "I counted the total number of records in the `space_crew` table.";
        }
      } else if (p.includes("average") || p.includes("experience") || p.includes("avg")) {
        if (p.includes("active")) {
          sql = "SELECT AVG(years_active) FROM space_crew WHERE status = 'Active';";
          explanation = "I calculated the average of the `years_active` column in the `space_crew` table where `status` is 'Active'.";
        } else {
          sql = "SELECT AVG(years_active) FROM space_crew;";
          explanation = "I calculated the average of the `years_active` column for the entire `space_crew` table.";
        }
      } else if (p.includes("active") && p.includes("years") && (p.includes("more than") || p.includes("over") || p.includes(">") || p.includes("greater"))) {
        sql = "SELECT * FROM space_crew WHERE status = 'Active' AND years_active > 10;";
        explanation = "I filtered the `space_crew` table where `status` equals 'Active' and `years_active` is greater than 10.";
      } else if (p.includes("active")) {
        sql = "SELECT * FROM space_crew WHERE status = 'Active';";
        explanation = "I queried the `space_crew` table and filtered only rows where the `status` column equals 'Active'.";
      } else if (p.includes("captain") || p.includes("commander")) {
        sql = "SELECT * FROM space_crew WHERE role = 'Captain';";
        explanation = "I searched the `space_crew` table where the `role` is exactly 'Captain'.";
      } else if (p.includes("navigator")) {
        sql = "SELECT * FROM space_crew WHERE role = 'Navigator';";
        explanation = "I searched the `space_crew` table where the `role` is exactly 'Navigator'.";
      } else if (p.includes("sort") || p.includes("order") || p.includes("years")) {
        sql = "SELECT * FROM space_crew ORDER BY years_active DESC;";
        explanation = "I selected all crew members and sorted them by `years_active` in descending order (highest first).";
      } else {
        sql = "SELECT * FROM space_crew;";
        explanation = "I retrieved all columns and records from the `space_crew` table.";
      }
    } else if (p.includes("mission") || p.includes("destination") || p.includes("pilot") || p.includes("fly") || p.includes("heading")) {
      if (p.includes("name") || p.includes("destination") || p.includes("pilot")) {
        sql = "SELECT space_crew.name, space_missions.destination FROM space_crew JOIN space_missions ON space_crew.id = space_missions.pilot_id;";
        explanation = "I joined the `space_crew` table with the `space_missions` table matching `space_crew.id` with `space_missions.pilot_id` to show each pilot's name and mission destination.";
      } else {
        sql = "SELECT * FROM space_missions;";
        explanation = "I selected all columns and records from the `space_missions` table.";
      }
    } else if (p.includes("planet") || p.includes("world") || p.includes("space") || p.includes("exoplanet")) {
      if (p.includes("life") || p.includes("habitable") || p.includes("living")) {
        sql = "SELECT name, distance_ly FROM planets WHERE has_life = true;";
        explanation = "I queried the name and distance columns of the `planets` table where the boolean field `has_life` is true.";
      } else if (p.includes("terrestrial") || p.includes("earth")) {
        sql = "SELECT * FROM planets WHERE type = 'Terrestrial';";
        explanation = "I selected exoplanets from the `planets` table where their `type` is 'Terrestrial'.";
      } else if (p.includes("closest") || p.includes("near") || p.includes("distance") || p.includes("order") || p.includes("sort")) {
        sql = "SELECT * FROM planets ORDER BY distance_ly ASC;";
        explanation = "I retrieved all planets and sorted them by their distance (`distance_ly` light-years) in ascending order.";
      } else {
        sql = "SELECT * FROM planets;";
        explanation = "I retrieved all columns and rows from the `planets` table.";
      }
    } else if (p.includes("cargo") || p.includes("bay") || p.includes("inventory") || p.includes("item") || p.includes("goods") || p.includes("weight")) {
      if (p.includes("unsecured") || p.includes("loose") || p.includes("not secure") || p.includes("false")) {
        sql = "SELECT * FROM cargo WHERE secured = false;";
        explanation = "I filtered the cargo manifest to show items where the `secured` column is false (unlocked items).";
      } else if (p.includes("heavy") || p.includes("weight") || p.includes("sort") || p.includes("order")) {
        sql = "SELECT item, weight_kg FROM cargo ORDER BY weight_kg DESC;";
        explanation = "I selected the item name and weight, sorting the list by `weight_kg` in descending order (heaviest cargo first).";
      } else if (p.includes("tech") || p.includes("device") || p.includes("machinery")) {
        sql = "SELECT * FROM cargo WHERE category = 'Tech';";
        explanation = "I filtered the `cargo` table to display items categorized under the value 'Tech'.";
      } else {
        sql = "SELECT * FROM cargo;";
        explanation = "I selected all cargo files stored in the inventory bay.";
      }
    } else {
      return null;
    }
    return { sql, explanation };
  }

  function typeQueryInEditor(sqlText, callback) {
    editorInput.value = "";
    let index = 0;
    runBtn.disabled = true;
    if (aiSubmitBtn) aiSubmitBtn.disabled = true;
    
    const interval = setInterval(() => {
      if (index < sqlText.length) {
        editorInput.value += sqlText[index];
        updateHighlighting();
        index++;
      } else {
        clearInterval(interval);
        runBtn.disabled = false;
        if (aiSubmitBtn) aiSubmitBtn.disabled = false;
        if (callback) callback();
      }
    }, 20); // 20ms typing speed
  }

  function handleAISubmit() {
    if (!aiPromptInput) return;
    const prompt = aiPromptInput.value.trim();
    if (prompt === "") return;

    // Show simulated thinking in terminal logs
    clearConsole();
    printConsoleMessage(`SQL Copilot translating: "${prompt}"...`, "success");
    
    if (aiExplanationBubble) {
      aiExplanationBubble.classList.add("hidden");
    }

    const result = translatePromptToSQL(prompt);

    if (result) {
      // Type out query in editor and execute once typing finishes
      typeQueryInEditor(result.sql, () => {
        executeSQL();
        if (aiExplanationBubble && aiExplanationText) {
          aiExplanationText.innerHTML = `I translated your request to: <code>${result.sql}</code><br><br>${result.explanation}`;
          aiExplanationBubble.classList.remove("hidden");
        }
      });
    } else {
      setTimeout(() => {
        printConsoleMessage(`SQL Copilot: Could not translate prompt. Reverting to templates.`, "error");
        if (aiExplanationBubble && aiExplanationText) {
          aiExplanationText.innerHTML = `⚠️ <strong>Oops!</strong> I couldn't map that request. Try simpler terms like: <br>
          • <em>"find active crew members"</em><br>
          • <em>"list habitable planets"</em><br>
          • <em>"show unsecured cargo sorted by weight"</em>`;
          aiExplanationBubble.classList.remove("hidden");
        }
      }, 600);
    }
  }

  if (aiSubmitBtn) {
    aiSubmitBtn.addEventListener("click", handleAISubmit);
  }

  if (aiPromptInput) {
    aiPromptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAISubmit();
      }
    });
  }

  // Bind Suggestion Chips
  if (aiSuggestChips) {
    aiSuggestChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt");
        if (aiPromptInput) {
          aiPromptInput.value = prompt;
          handleAISubmit();
        }
      });
    });
  }
});
