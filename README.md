# Trello Importer

A Node.js script to import a structured project plan into a Trello board from a JSON file.

This project automates the creation of lists and cards on a Trello board using Trello's REST API, designed specifically to bootstrap the **Selve** personality profiling SaaS project.

---

## Features

- Create Trello lists (columns) based on JSON input
- Add cards (tasks) to each list
- Simple, asynchronous, and easy to customize
- Uses Axios for HTTP requests and Node.js `fs` module for file handling

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- Trello account
- Trello API Key and Token (see below)
- A Trello board to import your data into

### Setup Trello API Key and Token

1. Go to the [Trello API keys page](https://trello.com/app-key)
2. Copy your **API Key**
3. Generate a **Token** by clicking the token link on the same page
4. Replace `YOUR_API_KEY` and `YOUR_API_TOKEN` in the script

### Get Your Trello Board ID

You can find your board's ID by running:

```bash
curl "https://api.trello.com/1/members/me/boards?key=YOUR_API_KEY&token=YOUR_API_TOKEN"
```

Or by inspecting the URL when viewing your Trello board:

```
https://trello.com/b/BOARD_ID/board-name
```

---

## Installation

Clone this repo and install dependencies:

```bash
git clone https://github.com/yourusername/selve-trello-importer.git
cd selve-trello-importer
npm install axios
```

Place your board JSON file (`self-trello-board.json`) in the root folder.

---

## Usage

Update your credentials in the `importToTrello.js` file:

```js
const API_KEY = "your_api_key_here";
const TOKEN = "your_token_here";
const BOARD_ID = "your_board_id_here";
```

Run the script:

```bash
node importToTrello.js
```

You will see console logs for each list and card created. On success, your Trello board will be populated according to the JSON structure.

---

## Best Practices

- Keep your API key and token secret. Do not commit them to public repositories.
- Use environment variables or `.env` files for managing secrets in production.
- Rate-limit your API requests to avoid hitting Trello API limits.
- Validate your JSON data structure before running the import.
- Backup your Trello board data before bulk changes.
- Use descriptive names for your lists and cards to keep the board organized.

---

## JSON Structure

Your `self-trello-board.json` file should follow this format:

```json
{
  "name": "Board Name",
  "lists": [
    {
      "name": "List Name",
      "cards": [
        { "name": "Card 1" },
        { "name": "Card 2" }
      ]
    }
  ]
}
```

### Example

```json
{
  "name": "Selve Project",
  "lists": [
    {
      "name": "Backlog",
      "cards": [
        { "name": "Design personality types" },
        { "name": "Set branding tone" }
      ]
    }
  ]
}
```

---

## License

MIT License

## Author

**Christopher** — building Selve, a next-gen self-awareness platform