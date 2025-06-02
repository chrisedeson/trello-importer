// importBoard.js

/**
 * A professional Trello‐importer for your "SELVE" project.
 *
 * Reads `selve-trello-board.json`, ensures all listed labels exist
 * (creating any missing ones with valid Trello colors), then creates
 * lists and cards—each card gets its description and the proper label(s).
 *
 * Before running:
 *  1) npm install axios dotenv
 *  2) Create a `.env` file with TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID
 *  3) Place `selve-trello-board.json` next to this script
 *  4) node importBoard.js
 */

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

// Load the JSON board definition
const boardData = JSON.parse(fs.readFileSync("selve-trello-board.json", "utf-8"));

/**
 * Trello allows exactly these colors for labels:
 *   green, yellow, orange, red, purple, blue, sky, pink, lime, black
 */
const VALID_COLORS = new Set([
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "blue",
  "sky",
  "pink",
  "lime",
  "black",
]);

// In‐memory map of existing labels on the Trello board: { labelName: { id, color } }
let existingLabelsMap = {};

/**
 * 1) Fetch all existing labels on the board so we can reuse them.
 * 2) Build a map: existingLabelsMap[labelName] = { id: ..., color: ... }
 */
async function fetchExistingLabels() {
  const res = await axios.get(
    `https://api.trello.com/1/boards/${BOARD_ID}/labels`,
    {
      params: {
        key: API_KEY,
        token: TOKEN,
        limit: 1000,
      },
    }
  );

  res.data.forEach((label) => {
    // Use the exact name (case‐sensitive) as the key
    existingLabelsMap[label.name] = {
      id: label.id,
      color: label.color,
    };
  });
}

/**
 * Create a new Trello label on the board.
 * Must specify a valid Trello color string.
 * Returns the new label's ID.
 */
async function createLabel(labelName, color) {
  const res = await axios.post("https://api.trello.com/1/labels", null, {
    params: {
      idBoard: BOARD_ID,
      name: labelName,
      color,
      key: API_KEY,
      token: TOKEN,
    },
  });
  existingLabelsMap[labelName] = {
    id: res.data.id,
    color: res.data.color,
  };
  return res.data.id;
}

/**
 * Given a labelName, pick a valid Trello color.
 * If the labelName is not recognized, default to "blue".
 */
function chooseColorForLabel(labelName) {
  const lower = labelName.toLowerCase();

  if (lower === "frontend") return "blue";
  if (lower === "backend") return "green";
  if (lower === "ai") return "purple";
  if (lower === "devops") return "black";
  if (lower === "analytics") return "orange";
  if (lower === "research") return "yellow";
  if (lower === "business") return "pink";
  if (lower === "design") return "sky";
  if (lower === "legal") return "red";
  if (lower === "planning") return "lime";
  if (lower === "feature") return "black";
  if (lower === "integration") return "sky";
  if (lower === "auth") return "purple";
  if (lower === "database") return "blue";
  if (lower === "monitoring") return "red";
  if (lower === "security") return "black";
  if (lower === "mobile") return "sky";

  // Fallback
  return "blue";
}

/**
 * Ensure every label in `labelNames` exists on the board.
 * Returns an object mapping the name → Trello ID.
 */
async function ensureLabels(labelNames) {
  const labelIdsMap = {};

  for (const name of labelNames) {
    // If already fetched and exists, reuse
    if (existingLabelsMap[name]) {
      labelIdsMap[name] = existingLabelsMap[name].id;
      continue;
    }

    // Otherwise, create a new one with a valid color
    const color = chooseColorForLabel(name);
    if (!VALID_COLORS.has(color)) {
      throw new Error(
        `Trello label color "${color}" is not valid. Must be one of: ${[
          ...VALID_COLORS,
        ].join(", ")}`
      );
    }

    const newId = await createLabel(name, color);
    labelIdsMap[name] = newId;
  }

  return labelIdsMap;
}

/**
 * Create a Trello list (column) under the board.
 * Returns the new list's ID.
 */
async function createList(listName) {
  const res = await axios.post(`https://api.trello.com/1/lists`, null, {
    params: {
      name: listName,
      idBoard: BOARD_ID,
      key: API_KEY,
      token: TOKEN,
    },
  });
  return res.data.id;
}

/**
 * Create a single card with optional description and label IDs.
 * Returns the new card's ID (not used but returned for potential extension).
 */
async function createCard(cardName, listId, description = "", labelIds = []) {
  // Trello expects idLabels as a comma‐separated string of label IDs
  const params = {
    name: cardName,
    idList: listId,
    key: API_KEY,
    token: TOKEN,
    ...(description && { desc: description }),
    ...(labelIds.length && { idLabels: labelIds.join(",") }),
  };

  const res = await axios.post("https://api.trello.com/1/cards", null, { params });
  return res.data.id;
}

/**
 * Main import flow:
 *   1) fetch existing labels
 *   2) gather all labels from JSON, ensure they exist
 *   3) create lists in order
 *   4) create cards with name, description, and correct label IDs
 */
async function importBoard() {
  console.log("🚀 Starting Trello import for 'Self'...");

  // 1. Fetch existing labels on the board
  await fetchExistingLabels();
  console.log("✅ Fetched existing labels.\n");

  // 2. Collect all unique label names from the JSON
  const allLabelNames = new Set();
  boardData.lists.forEach((list) => {
    list.cards.forEach((card) => {
      if (Array.isArray(card.labels)) {
        card.labels.forEach((lbl) => allLabelNames.add(lbl));
      }
    });
  });

  // 3. Ensure each label exists on Trello (create missing ones)
  const labelIdsMap = await ensureLabels([...allLabelNames]);
  console.log(
    `✅ Ensured ${Object.keys(labelIdsMap).length} label(s):`,
    Object.keys(labelIdsMap).join(", "),
    "\n"
  );

  // 4. Create lists and cards
  for (const list of boardData.lists) {
    console.log(`📋 Creating list: ${list.name}`);
    const listId = await createList(list.name);

    for (const card of list.cards) {
      const assignedLabelIds = (card.labels || []).map((lbl) => labelIdsMap[lbl]);

      console.log(`  ➕ Creating card: ${card.name}`);
      await createCard(card.name, listId, card.description || "", assignedLabelIds);
    }

    console.log(`✅ Finished list: ${list.name}\n`);
  }

  console.log("🎉 All lists and cards created successfully!");
}

importBoard().catch((err) => {
  console.error("\n❌ Import failed:");
  if (err.response?.data) console.error(err.response.data);
  else console.error(err.message);
});
