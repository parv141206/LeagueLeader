const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();

const laLigaTeams = [
  {
    name: "Atlético Madrid",
    aliases: ["Atleti", "Atlético", "Atleti Madrid"],
    league: "LaLiga",
  },
  { name: "Real Madrid", aliases: ["Los Blancos", "Madrid"], league: "LaLiga" },
  { name: "Las Palmas", aliases: ["Las Palmas"], league: "LaLiga" },
  { name: "Barcelona", aliases: ["Barça"], league: "LaLiga" },
  { name: "A Bilbao", aliases: ["El Bilbó"], league: "LaLiga" },
  { name: "Sevilla", aliases: ["Los Nervionenses"], league: "LaLiga" },
  { name: "Real Betis", aliases: ["Los Verdiblancos"], league: "LaLiga" },
  { name: "Real Sociedad", aliases: ["La Real"], league: "LaLiga" },
  { name: "Alves", aliases: ["Los Negros"], league: "LaLiga" },
  { name: "Villarreal", aliases: ["El Submarino Amarillo"], league: "LaLiga" },
  { name: "Athletic Bilbao", aliases: ["Los Leones"], league: "LaLiga" },
  { name: "Osasuna", aliases: ["Los Rojillos"], league: "LaLiga" },
  { name: "Rayo Vallecano", aliases: ["Los Franjirrojos"], league: "LaLiga" },
  { name: "Getafe", aliases: ["Los Azulones"], league: "LaLiga" },
  { name: "Cádiz", aliases: ["Los Amarillos"], league: "LaLiga" },
  { name: "Celta Vigo", aliases: ["Los Celestes"], league: "LaLiga" },
  { name: "Espanyol", aliases: ["Los Pericos"], league: "LaLiga" },
  { name: "Almería", aliases: ["Los Rojiblancos"], league: "LaLiga" },
  { name: "Valladolid", aliases: ["Los Pucelanos"], league: "LaLiga" },
  { name: "Girona", aliases: ["Los Blanquivermells"], league: "LaLiga" },
  { name: "Mallorca", aliases: ["Los Bermellones"], league: "LaLiga" },
  { name: "Elche", aliases: ["Los Franjiverdes"], league: "LaLiga" },
  { name: "Levante", aliases: ["Los Granotas"], league: "LaLiga" },
];

const premierLeagueTeams = [
  { name: "Arsenal", aliases: ["The Gunners"], league: "Premier League" },
  { name: "Aston Villa", aliases: ["Villa"], league: "Premier League" },
  { name: "Bournemouth", aliases: ["The Cherries"], league: "Premier League" },
  { name: "Brentford", aliases: ["The Bees"], league: "Premier League" },
  { name: "Brighton", aliases: ["The Seagulls"], league: "Premier League" },
  { name: "Chelsea", aliases: ["The Blues"], league: "Premier League" },
  {
    name: "Crystal Palace",
    aliases: ["The Eagles", "C Palace"],
    league: "Premier League",
  },
  { name: "Everton", aliases: ["The Toffees"], league: "Premier League" },
  { name: "Fulham", aliases: ["The Cottagers"], league: "Premier League" },
  { name: "Ipswich", aliases: ["The Foxes"], league: "Premier League" },
  { name: "Leeds United", aliases: ["The Whites"], league: "Premier League" },
  { name: "Leicester City", aliases: ["The Foxes"], league: "Premier League" },
  { name: "Liverpool", aliases: ["The Reds"], league: "Premier League" },
  { name: "Manchester City", aliases: ["Man City"], league: "Premier League" },
  {
    name: "Manchester United",
    aliases: ["Man Utd", "The Red Devils"],
    league: "Premier League",
  },
  {
    name: "Newcastle United",
    aliases: ["The Magpies", "Newcastle"],
    league: "Premier League",
  },
  {
    name: "Nottingham Forest",
    aliases: ["The Reds", "Nottm Forest"],
    league: "Premier League",
  },
  { name: "Southampton", aliases: ["The Saints"], league: "Premier League" },
  { name: "Tottenham Hotspur", aliases: ["Spurs"], league: "Premier League" },
  {
    name: "West Ham United",
    aliases: ["The Hammers", "West Ham"],
    league: "Premier League",
  },
  {
    name: "Wolverhampton Wanderers",
    aliases: ["Wolves"],
    league: "Premier League",
  },
];

const PORT = process.env.PORT || 8080;
const allTeams = [...laLigaTeams, ...premierLeagueTeams];

app.use(cors({ origin: "*" }));

app.get("/", async (req, res) => {
  try {
    const allFixtures = [];
    let url = "https://www.theguardian.com/football/fixtures";
    let clickCount = 0;

    while (url && clickCount < 10) {
      console.log("Fetching URL:", url);
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
        timeout: 10000, // Set a timeout for the request
      });
      const $ = cheerio.load(data);
      const fixtures = extractFixtures($);
      allFixtures.push(...fixtures);

      const moreButton = $(".football-matches__show-more");
      if (moreButton.length) {
        url = new URL(
          moreButton.attr("href"),
          "https://www.theguardian.com"
        ).toString();
        clickCount++;
      } else {
        url = null;
      }
    }

    res.json(allFixtures);
  } catch (error) {
    console.error("Error fetching the HTML:", error.message);
    console.error("Error details:", error);
    res.status(500).send("Error fetching data");
  }
});

function extractFixtures($) {
  const fixtures = [];
  $(".football-matches__day").each((index, element) => {
    const date = $(element).find(".date-divider").text().trim();
    const matches = $(element).find(".football-match--fixture");

    matches.each((matchIndex, matchElement) => {
      const time = $(matchElement)
        .find(".football-match__status")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const teams = $(matchElement)
        .find(".football-match__teams")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const formattedMatch = formatMatch(teams);
      if (formattedMatch) {
        const res = { date, time, match: formattedMatch };
        fixtures.push(res);
      }
    });
  });
  return fixtures;
}

function formatMatch(teams) {
  for (let i = 0; i < allTeams.length; i++) {
    const team1 = allTeams[i].name;
    const league1 = allTeams[i].league;
    for (let j = 0; j < allTeams.length; j++) {
      const team2 = allTeams[j].name;
      const league2 = allTeams[j].league;
      if (team1 !== team2 && teams.includes(team1) && teams.includes(team2)) {
        return {
          match: `${team1} vs ${team2}`,
          league1,
          league2,
        };
      }
    }
  }
  return null;
}

app.get("/test", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
