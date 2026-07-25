import {
  SlashCommandBuilder,
  AttachmentBuilder,
  GuildMember,
  Guild,
} from "discord.js";
import { CommandType, createCommandData } from "../handlers/commands";
import {
  DiGraphBuilder,
  digraphStringGenerator,
} from "../functions/digraphStringGenerator";

// Re-fetching the full member list is expensive; only do it if it's been
// a while since the last fetch for this guild. In between, discord.js's
// own guild.members.cache (kept warm by fetch + gateway events) is used.
const MEMBER_FETCH_TTL_MS = 5 * 60 * 1000;
const lastMemberFetchAt = new Map<string, number>();

async function getMembers(guild: Guild) {
  const now = Date.now();
  const last = lastMemberFetchAt.get(guild.id);

  if (last === undefined || now - last > MEMBER_FETCH_TTL_MS) {
    await guild.members.fetch();
    lastMemberFetchAt.set(guild.id, now);
  }

  return guild.members.cache;
}

// Safety valve — a graph with thousands of nodes will time out / fail to
// render (and won't be readable anyway). Tune to taste.
const MAX_MEMBERS = 500;

export default createCommandData({
  type: CommandType.ChatInput,
  data: new SlashCommandBuilder()
    .setName("tree")
    .setDescription("Generates tree diagrams")
    .addSubcommand((sub) =>
      sub
        .setName("guild_members")
        .setDescription("Generates a guild member to roles tree of a guild")
        .addBooleanOption((opt) =>
          opt
            .setName("top_role_only")
            .setDescription(
              "Only draw an edge to each member's highest role (default: edge to every role they have)",
            )
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("allow_bots")
            .setDescription(
              "Allow bots to be included in the tree (default: no)",
            )
            .setRequired(false),
        ),
    ),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    // Default is "all roles" (every role a member holds gets an edge to
    // them); pass top_role_only:true to fall back to one edge per member.
    const topRoleOnly =
      interaction.options.getBoolean("top_role_only") ?? false;
    // Default is "user members"
    // pass allow_bots:true to allow bots to be mentioned in the graph.
    const allowBots = interaction.options.getBoolean("allow_bots") ?? false;

    // Fetching all members + rendering can take a while, so defer immediately.
    await interaction.deferReply();

    const guild = interaction.guild;
    const fetched = await getMembers(guild);
    const members = [...fetched.values()].filter((m) =>
      allowBots ? true : !m.user.bot,
    );

    if (members.length > MAX_MEMBERS) {
      await interaction.editReply(
        `This server has ${members.length} members, which is too many to render ` +
          `(limit: ${MAX_MEMBERS}).`,
      );
      return;
    }

    type Member = (typeof members)[number];

    const rankedRoles = [...guild.roles.cache.values()]
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position);
    const roleById = new Map(rankedRoles.map((r) => [r.id, r]));

    // Members are always *clustered* under their single highest role (for
    // a clean, readable layout); whether they additionally get edges to
    // every other role they hold depends on topRoleOnly.
    const membersByTopRole = new Map<string, Member[]>();
    const noRoleMembers: Member[] = [];
    const memberRoleIds = new Map<string, string[]>(); // memberId -> held role ids, highest first
    const heldRoleIds = new Set<string>();

    for (const member of members) {
      const roles = [...member.roles.cache.values()]
        .filter((r) => r.id !== guild.id)
        .sort((a, b) => b.position - a.position);

      if (roles.length === 0) {
        noRoleMembers.push(member);
        continue;
      }

      const topRole = roles[0];
      const bucket = membersByTopRole.get(topRole.id) ?? [];
      bucket.push(member);
      membersByTopRole.set(topRole.id, bucket);
      memberRoleIds.set(
        member.id,
        roles.map((r) => r.id),
      );
      roles.forEach((r) => heldRoleIds.add(r.id));
    }

    function memberLabel(member: GuildMember) {
      return member.user.bot
        ? member.user.username + " [BOT]"
        : `@${member.user.username}`;
    }

    const dot = digraphStringGenerator(sanitizeId(guild.name), (g) => {
      g.graphAttr({
        // neato lays nodes out with a force-directed spring model (attract
        // along edges, repel everywhere else) and iterates until the
        // layout settles — that's the "physics stabilization." It also
        // handles clusters more evenly than fdp, which is why we're using
        // it instead of the default "dot" hierarchical layout.
        overlap: "false", // let the physics push overlapping nodes apart
        splines: "true", // curve edges around nodes instead of through them
        sep: "+16", // extra padding physics maintains around each node
        bgcolor: "#313338", // opaque (Discord dark-theme background)
        fontname: "Helvetica",
        fontcolor: "white",
      });

      const rootId = "guild";
      g.node(rootId, {
        label: guild.name,
        shape: "doubleoctagon",
        style: "filled",
        fillcolor: "#5865F2",
        fontcolor: "white",
      });

      for (const role of rankedRoles) {
        if (!heldRoleIds.has(role.id)) continue; // nobody holds this role, skip clutter

        const roleId = `role_${role.id}`;
        const color = role.hexColor === "#000000" ? "#99aab5" : role.hexColor;
        const roleMembers = membersByTopRole.get(role.id) ?? [];

        // A labeled box gets drawn around everything in this subgraph,
        // visually grouping members whose *highest* role is this one —
        // that's what keeps the physics layout tidy even in all-roles mode.
        g.subgraph(`cluster_${role.id}`, (c) => {
          c.graphAttr({
            label: role.name,
            style: "rounded,filled",
            color,
            fillcolor: `${color}22`, // same hue, low alpha, as the box fill
            fontname: "Helvetica-Bold",
          });
          c.nodeDefaults({
            shape: "ellipse",
            style: "filled",
            fillcolor: "white",
            fontname: "Helvetica",
          });

          c.node(roleId, {
            label: role.name,
            shape: "box",
            style: "rounded,filled",
            fillcolor: color,
            fontcolor: "black",
          });

          for (const member of roleMembers) {
            const id = `member_${member.id}`;
            c.node(id, { label: memberLabel(member) });
            // Solid, role-colored: this is the member's primary/top role.
            c.edge(roleId, id, { color, penwidth: 1.5 });
          }
        });

        // Declared outside the cluster — Graphviz still resolves the id
        // fine even though roleId was first defined inside the subgraph.
        // Bold + role-colored: this is the structural "backbone" edge.
        g.edge(rootId, roleId, { style: "bold", color, penwidth: 2 });
      }

      if (!topRoleOnly) {
        // Every role a member holds *besides* their top one (already
        // edged above) gets an extra edge straight to their node. This is
        // what turns the tree into a DAG in all-roles mode — a member
        // with 3 roles ends up with 3 parents. Dashed + faded + thin so
        // it visually reads as "secondary" next to the solid top-role edge.
        for (const [memberId, roleIds] of memberRoleIds) {
          for (const roleId of roleIds.slice(1)) {
            const role = roleById.get(roleId);
            const color =
              !role || role.hexColor === "#000000" ? "#99aab5" : role.hexColor;
            g.edge(`role_${roleId}`, `member_${memberId}`, {
              style: "dashed",
              color: `${color}88`, // same hue, faded
              penwidth: 1,
              arrowsize: 0.7,
            });
          }
        }
      }

      if (noRoleMembers.length) {
        g.subgraph("cluster_no_role", (c) => {
          c.graphAttr({ label: "No Role", style: "rounded,dashed" });
          c.nodeDefaults({
            shape: "ellipse",
            style: "filled",
            fillcolor: "#eeeeee",
          });
          for (const member of noRoleMembers) {
            c.node(`member_${member.id}`, {
              label: memberLabel(member),
            });
          }
        });
        for (const member of noRoleMembers) {
          g.edge(rootId, `member_${member.id}`, {
            style: "dotted",
            color: "#6b7280",
            penwidth: 1,
          });
        }
      }
    });

    const image = await renderGraphviz(dot);
    const attachment = new AttachmentBuilder(image, { name: "guild-tree.png" });
    await interaction.editReply({ files: [attachment] });
  },
});

/** Graph names must be a valid DOT ID or quoted string; keep it simple. */
function sanitizeId(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, "_") || "G";
}

/** Renders a DOT string to a PNG buffer via QuickChart's /graphviz endpoint. */
async function renderGraphviz(graph: string): Promise<Buffer> {
  const response = await fetch("https://quickchart.io/graphviz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      graph,
      layout: "neato", // force-directed physics layout, see graphAttr comment above
      format: "png",
      width: 1600,
      height: 1200,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `QuickChart graphviz request failed: ${response.status} ${detail}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
