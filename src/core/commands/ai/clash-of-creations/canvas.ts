import { createCanvas, loadImage } from "@napi-rs/canvas";

import type {
  CreationBattlePlayer,
  CreationPlayoffMatch,
  CreationPlayoffRound,
} from "./ai";

const PADDING = 20;
const HEADER_HEIGHT = 58;
const COLUMN_WIDTH = 286;
const COLUMN_GAP = 82;
const MATCH_HEIGHT = 84;
const MATCH_SPACING = MATCH_HEIGHT + 10;
const BYE_CARD_HEIGHT = 58;
const EMOJI_SIZE = 15;
const AVATAR_SIZE = 24;

type CanvasContext = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;
type CanvasImage = Awaited<ReturnType<typeof loadImage>>;

const emojiImageCache = new Map<string, Promise<CanvasImage | null>>();
const avatarImageCache = new Map<string, Promise<CanvasImage | null>>();

interface PositionedMatch {
  match: CreationPlayoffMatch;
  x: number;
  y: number;
}

interface PositionedBye {
  player: CreationBattlePlayer;
  x: number;
  y: number;
}

function fitText(
  context: CanvasContext,
  value: string,
  maxWidth: number,
): string {
  if (context.measureText(value).width <= maxWidth) return value;

  const characters = Array.from(value);
  while (characters.length > 1) {
    characters.pop();
    const shortened = `${characters.join("")}…`;
    if (context.measureText(shortened).width <= maxWidth) return shortened;
  }
  return "…";
}

function playerLineY(
  positioned: PositionedMatch,
  player: CreationBattlePlayer,
): number {
  const playerIndex = positioned.match.players.findIndex(
    (entrant) => entrant.id === player.id,
  );
  return positioned.y + (playerIndex === 0 ? 21 : 63);
}

function emojiImageUrl(emoji: string): string {
  const customEmoji = /^<a?:\w+:(\d+)>$/.exec(emoji);
  if (customEmoji) {
    return `https://cdn.discordapp.com/emojis/${customEmoji[1]}.png?size=32`;
  }

  const codepoints = Array.from(emoji)
    .map((character) => character.codePointAt(0)!)
    .filter((codepoint) => codepoint !== 0xfe0f)
    .map((codepoint) => codepoint.toString(16))
    .join("-");
  if (!codepoints) {
    throw new Error(`Cannot create an image URL for empty emoji "${emoji}"`);
  }

  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codepoints}.png`;
}

function loadEmojiImage(emoji: string): Promise<CanvasImage | null> {
  const cached = emojiImageCache.get(emoji);
  if (cached) return cached;

  const imagePromise = (async () => {
    try {
      const response = await fetch(emojiImageUrl(emoji), {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 404) {
        console.warn(
          `Skipping unavailable playoff emoji "${emoji}" (HTTP 404).`,
        );
        return null;
      }
      if (!response.ok) {
        throw new Error(
          `Failed to load playoff emoji "${emoji}" (HTTP ${response.status})`,
        );
      }
      return await loadImage(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.warn(
        `Skipping playoff emoji "${emoji}" after a load error.`,
        error,
      );
      return null;
    }
  })();

  emojiImageCache.set(emoji, imagePromise);
  imagePromise.catch(() => emojiImageCache.delete(emoji));
  return imagePromise;
}

function loadAvatarImage(
  avatarUrl: string | undefined,
): Promise<CanvasImage | null> {
  if (!avatarUrl) return Promise.resolve(null);
  const cached = avatarImageCache.get(avatarUrl);
  if (cached) return cached;

  const imagePromise = (async () => {
    try {
      const response = await fetch(avatarUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(`Avatar request failed (HTTP ${response.status})`);
      }
      return await loadImage(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.warn("Skipping a Clash of Creations player avatar.", error);
      return null;
    }
  })();

  avatarImageCache.set(avatarUrl, imagePromise);
  return imagePromise;
}

function drawPlayer(
  context: CanvasContext,
  player: CreationBattlePlayer,
  emojiImages: Map<string, CanvasImage | null>,
  avatarImages: Map<string, CanvasImage | null>,
  winner: boolean,
  x: number,
  top: number,
  width: number,
  championMatch: boolean,
): void {
  const avatar = avatarImages.get(player.id);
  const contentX = avatar ? x + AVATAR_SIZE + 8 : x;
  const contentWidth = width - (avatar ? AVATAR_SIZE + 8 : 0);
  if (avatar) {
    context.save();
    context.beginPath();
    context.arc(x + AVATAR_SIZE / 2, top + 18, AVATAR_SIZE / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(avatar, x, top + 6, AVATAR_SIZE, AVATAR_SIZE);
    context.restore();
  }

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = winner ? '600 12px "Alexandria"' : '600 11px "Alexandria"';
  context.fillStyle = winner
    ? championMatch
      ? "#f2d58e"
      : "#f0f0f2"
    : "#d0d2d9";
  context.fillText(
    fitText(context, player.name, contentWidth),
    contentX,
    top + 11,
    contentWidth,
  );

  context.font = '400 10px "Alexandria"';
  context.textBaseline = "middle";
  context.fillStyle = "#9295a0";
  const emojis = (player.ai?.emojis ?? []).flatMap((emoji) => {
    const image = emojiImages.get(emoji);
    return image ? [image] : [];
  });
  const detailsY = top + 28;
  emojis.forEach((image, index) => {
    context.drawImage(
      image,
      contentX + index * (EMOJI_SIZE + 2),
      detailsY - EMOJI_SIZE / 2,
      EMOJI_SIZE,
      EMOJI_SIZE,
    );
  });
  const emojiWidth = emojis.length * (EMOJI_SIZE + 2);
  const creation = player.creation ?? "Unknown creation";
  context.fillText(
    fitText(context, creation, contentWidth - emojiWidth),
    contentX + emojiWidth,
    detailsY,
    contentWidth - emojiWidth,
  );
}

function drawMatch(
  context: CanvasContext,
  positioned: PositionedMatch,
  emojiImages: Map<string, CanvasImage | null>,
  avatarImages: Map<string, CanvasImage | null>,
  championId: string,
  finalRound: boolean,
): void {
  const { match, x, y } = positioned;
  const [first, second] = match.players;
  const championMatch =
    finalRound && (first.id === championId || second.id === championId);
  context.beginPath();
  context.roundRect(x, y, COLUMN_WIDTH, MATCH_HEIGHT, 6);
  context.fillStyle = championMatch
    ? "rgba(218, 181, 103, 0.12)"
    : "rgba(255, 255, 255, 0.045)";
  context.fill();
  context.strokeStyle = championMatch
    ? "rgba(218, 181, 103, 0.48)"
    : "rgba(255, 255, 255, 0.1)";
  context.lineWidth = 1;
  context.stroke();

  const winnerId = match.winner?.id;
  const firstY = y + 21;
  const secondY = y + 63;
  drawPlayer(
    context,
    first,
    emojiImages,
    avatarImages,
    winnerId === first.id,
    x + 10,
    y + 2,
    COLUMN_WIDTH - 20,
    championMatch,
  );

  context.strokeStyle = "rgba(255, 255, 255, 0.08)";
  context.beginPath();
  context.moveTo(x + 10, y + MATCH_HEIGHT / 2);
  context.lineTo(x + COLUMN_WIDTH - 10, y + MATCH_HEIGHT / 2);
  context.stroke();

  drawPlayer(
    context,
    second,
    emojiImages,
    avatarImages,
    winnerId === second.id,
    x + 10,
    y + 44,
    COLUMN_WIDTH - 20,
    championMatch,
  );

  if (winnerId) {
    const winnerY = winnerId === first.id ? firstY : secondY;
    context.beginPath();
    context.arc(x + 3, winnerY, 2, 0, Math.PI * 2);
    context.fillStyle = championMatch ? "#e2c173" : "#d7d9de";
    context.fill();
  }
}

function drawByeCard(
  context: CanvasContext,
  player: CreationBattlePlayer,
  emojiImages: Map<string, CanvasImage | null>,
  avatarImages: Map<string, CanvasImage | null>,
  x: number,
  y: number,
): void {
  context.save();
  context.beginPath();
  context.roundRect(x, y, COLUMN_WIDTH, BYE_CARD_HEIGHT, 6);
  context.fillStyle = "rgba(255, 255, 255, 0.045)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.1)";
  context.lineWidth = 1;
  context.stroke();

  drawPlayer(
    context,
    player,
    emojiImages,
    avatarImages,
    false,
    x + 10,
    y + 2,
    COLUMN_WIDTH - 56,
    false,
  );

  context.font = '600 9px "Alexandria"';
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillStyle = "#8e929e";
  context.fillText("BYE", x + COLUMN_WIDTH - 10, y + BYE_CARD_HEIGHT / 2);
  context.restore();
}

function drawConnector(
  context: CanvasContext,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  highlighted: boolean,
): void {
  const elbowX = (fromX + toX) / 2;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.bezierCurveTo(elbowX, fromY, elbowX, toY, toX, toY);
  context.strokeStyle = highlighted
    ? "rgba(226, 193, 115, 0.58)"
    : "rgba(190, 194, 205, 0.3)";
  context.lineWidth = highlighted ? 1.8 : 1.2;
  context.stroke();
}

export async function createPlayoffCanvas(
  rounds: CreationPlayoffRound[],
  champion: CreationBattlePlayer,
): Promise<Buffer> {
  if (
    rounds.length === 0 ||
    rounds.some(
      (round) => round.matches.length === 0 && round.byes.length === 0,
    )
  ) {
    throw new Error("Cannot render playoff bracket without round information.");
  }

  const allPlayers = [
    ...rounds.flatMap((round) => [
      ...round.matches.flatMap((match) => match.players),
      ...round.byes.map((bye) => bye.player),
    ]),
  ];
  const emojis = [
    ...new Set(allPlayers.flatMap((player) => player.ai?.emojis ?? [])),
  ];
  const emojiImages = new Map<string, CanvasImage | null>(
    await Promise.all(
      emojis.map(
        async (emoji) => [emoji, await loadEmojiImage(emoji)] as const,
      ),
    ),
  );
  const avatarImages = new Map<string, CanvasImage | null>(
    await Promise.all(
      allPlayers.map(
        async (player) =>
          [player.id, await loadAvatarImage(player.avatarUrl)] as const,
      ),
    ),
  );

  const width =
    PADDING * 2 +
    rounds.length * COLUMN_WIDTH +
    Math.max(0, rounds.length - 1) * COLUMN_GAP;
  const maxEntries = Math.max(
    1,
    ...rounds.map((round) => round.matches.length + round.byes.length),
  );
  const height =
    HEADER_HEIGHT +
    PADDING * 2 +
    MATCH_HEIGHT +
    Math.max(0, maxEntries - 1) * MATCH_SPACING;
  const stackTop = HEADER_HEIGHT + PADDING;
  const positionedRounds: PositionedMatch[][] = [];
  const positionedByes: PositionedBye[][] = [];
  rounds.forEach((round, roundIndex) => {
    const x = PADDING + roundIndex * (COLUMN_WIDTH + COLUMN_GAP);
    const entryCount = round.matches.length + round.byes.length;
    const offset = ((maxEntries - entryCount) * MATCH_SPACING) / 2;
    positionedRounds.push(
      round.matches.map((match, index) => ({
        match,
        x,
        y: stackTop + offset + index * MATCH_SPACING,
      })),
    );
    positionedByes.push(
      round.byes.map((bye, index) => ({
        player: bye.player,
        x,
        y:
          stackTop +
          offset +
          (round.matches.length + index) * MATCH_SPACING +
          (MATCH_HEIGHT - BYE_CARD_HEIGHT) / 2,
      })),
    );
  });

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#111218";
  context.fillRect(0, 0, width, height);

  const finalRoundIndex = rounds.length - 1;
  rounds.forEach((round, roundIndex) => {
    const x = PADDING + roundIndex * (COLUMN_WIDTH + COLUMN_GAP);
    context.font = '600 11px "Alexandria"';
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = roundIndex === finalRoundIndex ? "#e2c173" : "#858892";
    context.fillText(
      roundIndex === finalRoundIndex ? "FINAL" : `ROUND ${round.round}`,
      x,
      30,
    );
  });

  for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
    const currentRound = rounds[roundIndex];
    const nextRoundMatches = positionedRounds[roundIndex + 1];
    const currentX = PADDING + roundIndex * (COLUMN_WIDTH + COLUMN_GAP);
    const nextX = currentX + COLUMN_WIDTH + COLUMN_GAP;

    for (const positioned of positionedRounds[roundIndex]) {
      const advancingPlayers = positioned.match.tie
        ? positioned.match.players
        : positioned.match.winner
          ? [positioned.match.winner]
          : [];

      for (const player of advancingPlayers) {
        const destination = nextRoundMatches.find((next) =>
          next.match.players.some((entrant) => entrant.id === player.id),
        );
        if (!destination) continue;
        drawConnector(
          context,
          currentX + COLUMN_WIDTH,
          playerLineY(positioned, player),
          nextX,
          destination.y + MATCH_HEIGHT / 2,
          destination.match.players.some(
            (entrant) => entrant.id === champion.id,
          ),
        );
      }
    }

    for (const bye of positionedByes[roundIndex]) {
      const destination = nextRoundMatches.find((next) =>
        next.match.players.some((player) => player.id === bye.player.id),
      );
      const laneY = bye.y + BYE_CARD_HEIGHT / 2;
      drawByeCard(
        context,
        bye.player,
        emojiImages,
        avatarImages,
        currentX,
        bye.y,
      );
      if (destination) {
        drawConnector(
          context,
          currentX + COLUMN_WIDTH,
          laneY,
          nextX,
          destination.y + MATCH_HEIGHT / 2,
          destination.match.players.some((player) => player.id === champion.id),
        );
      }
    }
  }

  positionedRounds.forEach((matches, roundIndex) => {
    for (const positioned of matches) {
      drawMatch(
        context,
        positioned,
        emojiImages,
        avatarImages,
        champion.id,
        roundIndex === finalRoundIndex,
      );
    }
  });

  return canvas.toBuffer("image/png");
}
