import { createCanvas } from "@napi-rs/canvas";

import { CreationBattleResult, CreationBattlePlayer } from "./ai";

const CARD_WIDTH = 330;
const CARD_HEIGHT = 128;
const CARD_GAP = 18;
const COLUMN_GAP = 34;
const PADDING = 36;
const HEADER_HEIGHT = 150;

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function roundedRect(
  context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawPlayer(
  context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  player: CreationBattlePlayer,
  x: number,
  y: number,
  won: boolean,
): void {
  context.fillStyle = won ? "#ffe08a" : "#e9e1f1";
  context.font = "600 17px sans-serif";
  context.textAlign = "left";
  context.fillText(truncate(player.name, 22), x, y, CARD_WIDTH - 36);
  context.fillStyle = "#bdb1ca";
  context.font = "14px sans-serif";
  const details = `${player.ai?.emojis.join("") ?? ""} ${player.creation ?? "Unknown creation"}`.trim();
  context.fillText(truncate(details, 34), x, y + 20, CARD_WIDTH - 36);
}

function drawMatch(
  context: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  results: CreationBattleResult[],
  x: number,
  y: number,
): void {
  const firstResult = results[0];
  const [first, second] = firstResult.players;
  const firstWon = results.some((result) => result.winner?.id === first.id);
  const secondWon = results.some((result) => result.winner?.id === second.id);
  const isDraw = results.every((result) => result.tie);
  const hasRematch = results.some((result) => result.rematch);

  roundedRect(context, x, y, CARD_WIDTH, CARD_HEIGHT, 16);
  context.fillStyle = "rgba(29, 23, 43, 0.94)";
  context.fill();
  context.strokeStyle = isDraw ? "#e9ba5b" : "rgba(255, 255, 255, 0.14)";
  context.lineWidth = 1.5;
  context.stroke();

  context.textAlign = "left";
  context.fillStyle = isDraw ? "#f4d07b" : "#bba9cb";
  context.font = "600 12px sans-serif";
  context.fillText(
    `MATCH ${firstResult.match ?? "?"}${hasRematch ? " • REMATCH" : ""}`,
    x + 18,
    y + 22,
  );

  drawPlayer(context, first, x + 18, y + 51, firstWon);
  drawPlayer(context, second, x + 18, y + 94, secondWon);
}

export function createPlayoffCanvas(
  results: CreationBattleResult[],
  champion: CreationBattlePlayer,
): Buffer {
  const roundNumbers = [...new Set(
    results
      .map((result) => result.round)
      .filter((round): round is number => round !== undefined),
  )].sort((a, b) => a - b);

  if (roundNumbers.length === 0) {
    throw new Error("Cannot render playoff bracket without round information.");
  }

  const matchesByRound = roundNumbers.map((round) => {
    const roundResults = results.filter((result) => result.round === round);
    const matchNumbers = [...new Set(
      roundResults
        .map((result) => result.match)
        .filter((match): match is number => match !== undefined),
    )].sort((a, b) => a - b);

    return {
      round,
      matches: matchNumbers.map((match) =>
        roundResults
          .filter((result) => result.match === match)
          .sort((a, b) => Number(a.rematch) - Number(b.rematch)),
      ),
    };
  });

  const maxMatches = Math.max(...matchesByRound.map((round) => round.matches.length));
  const width =
    PADDING * 2 +
    roundNumbers.length * CARD_WIDTH +
    (roundNumbers.length - 1) * COLUMN_GAP;
  const height =
    HEADER_HEIGHT +
    maxMatches * CARD_HEIGHT +
    Math.max(0, maxMatches - 1) * CARD_GAP +
    PADDING;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#181526");
  background.addColorStop(0.55, "#30213e");
  background.addColorStop(1, "#512849");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.textAlign = "center";
  context.fillStyle = "#f7d992";
  context.font = "bold 34px sans-serif";
  context.fillText("CLASH OF CREATIONS", width / 2, 55);
  context.fillStyle = "#ffffff";
  context.font = "600 21px sans-serif";
  context.fillText(
    `🏆 ${champion.name} — ${champion.creation ?? "Champion"}`,
    width / 2,
    94,
  );

  matchesByRound.forEach((round, columnIndex) => {
    const columnX = PADDING + columnIndex * (CARD_WIDTH + COLUMN_GAP);
    context.fillStyle = "#d7c8e3";
    context.font = "600 17px sans-serif";
    context.fillText(
      round.round === 1 ? "OPENING ROUND" : `ROUND ${round.round}`,
      columnX + CARD_WIDTH / 2,
      HEADER_HEIGHT - 17,
    );

    round.matches.forEach((matchResults, matchIndex) => {
      const y = HEADER_HEIGHT + matchIndex * (CARD_HEIGHT + CARD_GAP);
      drawMatch(context, matchResults, columnX, y);
    });
  });

  return canvas.toBuffer("image/png");
}
