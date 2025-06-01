require('dotenv').config();
const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

const boardData = JSON.parse(fs.readFileSync("selve-trello-board.json", "utf-8"));

async function createList(name) {
  const res = await axios.post(`https://api.trello.com/1/lists`, null, {
    params: {
      name,
      idBoard: BOARD_ID,
      key: API_KEY,
      token: TOKEN
    }
  });
  return res.data.id;
}

async function createCard(name, listId) {
  await axios.post(`https://api.trello.com/1/cards`, null, {
    params: {
      name,
      idList: listId,
      key: API_KEY,
      token: TOKEN
    }
  });
}

async function importBoard() {
  for (const list of boardData.lists) {
    console.log(`📋 Creating list: ${list.name}`);
    const listId = await createList(list.name);
    for (const card of list.cards) {
      console.log(`  ➕ Adding card: ${card.name}`);
      await createCard(card.name, listId);
    }
  }
  console.log("✅ Import completed.");
}

importBoard().catch(console.error);
