const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerTablePascalToCamel = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsPascalToCamel = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API-1
app.get("/players/", async (request, response) => {
  const sqlQuery = `SELECT * FROM player_details`;
  const result = await db.all(sqlQuery);
  response.send(result.map((each) => convertPlayerTablePascalToCamel(each)));
});

//API-2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const sqlQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const result = await db.get(sqlQuery);
  response.send(result.map((each) => convertPlayerTablePascalToCamel(each)));
});

//API-3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { player_name } = request.body;
  const sqlQuery = `UPDATE player_details SET player_name = '${player_name}' WHERE player_id = ${playerId}`;
  const result = await db.run(sqlQuery);
  response.send("Player Details Updated");
});

//API-4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const sqlQuery = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const result = await db.all(sqlQuery);
  response.send(result.map((each) => convertMatchDetailsPascalToCamel(each)));
});

//API-5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const sqlQuery = `SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id = ${playerId}`;
  const result = await db.all(sqlQuery);
  response.send(result.map((each) => convertMatchDetailsPascalToCamel(each)));
});

//API-6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const sqlQuery = `SELECT * FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id WHERE match_id = ${matchId}`;
  const result = await db.all(sqlQuery);
  response.send(result.map((each) => convertPlayerTablePascalToCamel(each)));
});

//API-7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const sqlQuery = `SELECT player_details.player_id, player_details.player_name, SUM(score), COUNT(fours), COUNT(sixes) FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id`;
  const result = await db.all(sqlQuery);
  response.send({
    playerId: result["player_id"],
    playerName: result["player_name"],
    totalScore: result["SUM(score)"],
    totalFours: result["COUNT(fours)"],
    totalSixes: result["COUNT(sixes)"],
  });
});

module.exports = app;
