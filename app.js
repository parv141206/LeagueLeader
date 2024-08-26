const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors")

const app = express();
const laLigaTeams = [
  "Atlético Madrid",
  "Real Madrid",
  "Barcelona",
  "Sevilla",
  "Real Betis",
  "Real Sociedad",
  "Villarreal",
  "Athletic Bilbao",
  "Osasuna",
  "Rayo Vallecano",
  "Getafe",
  "Cádiz",
  "Celta Vigo",
  "Espanyol",
  "Almería",
  "Valladolid",
  "Girona",
  "Mallorca",
  "Elche",
  "Levante"
];

const premierLeagueTeams = [
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton",
  "Chelsea",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Leeds United",
  "Leicester City",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Southampton",
  "Tottenham Hotspur",
  "West Ham United",
  "Wolverhampton Wanderers"
];
const PORT = process.env.PORT || 8080;
const allTeams = [...laLigaTeams, ...premierLeagueTeams];
app.use(cors({
  origin: "*"
}
))
axios.defaults.protocol = 'http';
app.get("/", async (req, res) => {
  try {
    const allFixtures = [];
    let url = "https://www.theguardian.com/football/fixtures";
    let clickCount = 0;
    while (url && clickCount < 5) {
      const { data } = await axios.get(url);
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
    console.error("Error fetching the HTML:", error);
    res.status(500).send("Error fetching data");
  }
});

function extractFixtures($) {
  const fixtures = [];
  $(".football-matches__day").each((index, element) => {
    const date = $(element).find(".date-divider").text().trim();
    const matches = $(element).find(".football-match--fixture");

    matches.each((matchIndex, matchElement) => {
      const time = $(matchElement).find(".football-match__status").text().trim().replace(/\s+/g, " ");
      const teams = $(matchElement).find(".football-match__teams").text().trim().replace(/\s+/g, " ");

      // Logic to insert 'vs' between team names
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
    const team1 = allTeams[i];
    for (let j = 0; j < allTeams.length; j++) {
      const team2 = allTeams[j];
      if (team1 !== team2 && teams.includes(team1) && teams.includes(team2)) {
        return `${team1} vs ${team2}`;
      }
    }
  }
  return null;
}

app.listen(PORT, () => {
  console.log("Server running on port 8080");
});
