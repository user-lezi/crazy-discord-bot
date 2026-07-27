var I = Object.create,
  o = Object.defineProperty,
  A = Object.getOwnPropertyDescriptor,
  O = Object.getOwnPropertyNames,
  z = Object.getPrototypeOf,
  P = Object.prototype.hasOwnProperty,
  L = (t, a, r, n) => {
    if ((a && "object" == typeof a) || "function" == typeof a)
      for (let e of O(a))
        P.call(t, e) ||
          e === r ||
          o(t, e, {
            get: () => a[e],
            enumerable: !(n = A(a, e)) || n.enumerable,
          });
    return t;
  },
  e = (e, t, a) => (
    (a = null != e ? I(z(e)) : {}),
    L(
      !t && e && e.__esModule
        ? a
        : o(a, "default", { value: e, enumerable: !0 }),
      e,
    )
  ),
  t = require("discord.js"),
  s = require("discord.js"),
  i = e(require("consola")),
  l = require("discord.js");
function a(e) {
  return e;
}
var c = {
    colors: { success: 5763719, error: 15548997, info: 5793266 },
    limits: { evalTimeout: 3e4 },
  },
  U = require("dotenv"),
  d =
    ((0, U.config)({ quiet: !0 }),
    {
      token: process.env.BotToken ?? "",
      clientId: process.env.BotID ?? "",
      userToken: process.env.UserToken ?? null,
      validate() {
        var e = [];
        if (
          (this.token || e.push("BotToken"),
          this.clientId || e.push("BotID"),
          e.length)
        )
          throw Error("Missing environment variables: " + e.join(", "));
      },
    }),
  G = {
    developers: new Set(["910837428862984213"]),
    isDeveloper(e) {
      return this.developers.has(e);
    },
  },
  u = require("node:fs");
function m(e) {
  let t = 0;
  for (; 1024 <= e && t < 3;) ((e /= 1024), t++);
  return e.toFixed(2) + " " + ["B", "KB", "MB", "GB"][t];
}
function F(e) {
  var t = Math.floor(e / 86400),
    a = Math.floor((e %= 86400) / 3600),
    r = Math.floor((e %= 3600) / 60);
  return [t && t + "d", a && a + "h", r && r + "m", (e % 60) + "s"]
    .filter(Boolean)
    .join(" ");
}
var p = require("discord.js");
async function r(t, e, a = !1, r = null, n = !1, o = () => {}) {
  if (
    (n = n
      ? await t.followUp(e).catch(o)
      : t.replied || t.deferred
        ? await t.editReply(e).catch(o)
        : await t.reply(e).catch(o)) &&
    (a || r)
  ) {
    let e = n instanceof p.Message ? n : await t.fetchReply().catch(o);
    return (
      e &&
        e instanceof p.Message &&
        r &&
        setTimeout(() => {
          e.delete().catch(o);
        }, r),
      e instanceof p.Message ? e : null
    );
  }
  return null;
}
var n = {
    authorOnly: async (e, t, a = !1) =>
      r(
        e,
        {
          content:
            t ??
            "This session belongs to someone else. Run your own command sequence to interact!",
          flags: p.MessageFlags.Ephemeral,
        },
        !1,
        null,
        a,
      ),
    unknownError: async (e, t, a = !1) => (
      t && console.error("[Error Handler]:", t),
      r(
        e,
        {
          components: [
            new p.ContainerBuilder()
              .setAccentColor(2829617)
              .addTextDisplayComponents((e) =>
                e.setContent("An unexpected error occurred."),
              ),
          ],
          flags: p.MessageFlags.IsComponentsV2 | p.MessageFlags.Ephemeral,
        },
        !1,
        null,
        a,
      )
    ),
  },
  Z = require("archiver"),
  V = require("node:child_process"),
  H = require("node:util"),
  h = e(require("node:os")),
  f = e(require("node:path")),
  g = require("node:perf_hooks"),
  J = require("node:util"),
  Q = (0, J.promisify)(V.exec),
  W = a({
    type: 0,
    data: new l.SlashCommandBuilder()
      .setName("devtool")
      .setDescription("Developer only.")
      .setIntegrationTypes([l.ApplicationIntegrationType.UserInstall])
      .addSubcommand((e) =>
        e
          .setName("eval")
          .setDescription("Evaluate JavaScript code.")
          .addStringOption((e) =>
            e
              .setName("code")
              .setDescription("Code to evaluate.")
              .setRequired(!0),
          ),
      )
      .addSubcommand((e) =>
        e
          .setName("exec")
          .setDescription("Execute a shell command.")
          .addStringOption((e) =>
            e
              .setName("command")
              .setDescription("Shell command.")
              .setRequired(!0),
          ),
      )
      .addSubcommand((e) =>
        e.setName("stats").setDescription("Show bot statistics."),
      )
      .addSubcommand((e) => e.setName("download").setDescription("Bot file.")),
    async execute(t) {
      if (!G.isDeveloper(t.user.id))
        return t.reply({
          content: "❌ You are not allowed to use this command.",
          ephemeral: !0,
        });
      try {
        switch (t.options.getSubcommand()) {
          case "eval":
            return ee(t);
          case "exec":
            return K(t);
          case "stats":
            return X(t);
          case "download":
            return Y(t);
          default:
            throw Error("Unknown subcommand.");
        }
      } catch (e) {
        return n.unknownError(t, e, t.replied);
      }
    },
  });
async function K(t) {
  var e = t.options.getString("command", !0),
    a = g.performance.now();
  try {
    var { stdout: r, stderr: n } = await Q(e, {
      timeout: c.limits.evalTimeout,
      maxBuffer: 1048576,
    });
    await v(
      t,
      w(y(r || n || "No output."), 4e3),
      "Exec Result",
      n ? c.colors.error : c.colors.success,
      g.performance.now() - a,
    );
  } catch (e) {
    await v(
      t,
      w(e instanceof Error ? e.message : "" + e, 4e3),
      "Exec Error",
      c.colors.error,
      g.performance.now() - a,
    );
  }
}
async function Y(e) {
  var t;
  let s = [
    "bot.js",
    "scripts",
    "package.json",
    "README.md",
    ".env.example",
    "LICENSE",
  ];
  for (t of s) {
    var a = f.default.resolve(process.cwd(), t);
    try {
      (0, u.statSync)(a);
    } catch {
      return void (await e.reply({
        content: `Couldn't find \`${t}\`.`,
        ephemeral: !0,
      }));
    }
  }
  let i = f.default.join(process.cwd(), "bot.zip");
  await new Promise((e, t) => {
    var a,
      r = (0, u.createWriteStream)(i),
      n = new Z.ZipArchive({ zlib: { level: 9 } });
    (r.on("close", e), n.on("error", t), n.pipe(r));
    for (a of s) {
      var o = f.default.resolve(process.cwd(), a);
      (0, u.statSync)(o).isDirectory()
        ? n.directory(o, a)
        : n.file(o, { name: a });
    }
    n.finalize();
  });
  var r = (0, u.statSync)(i).size;
  8388608 < r
    ? ((0, u.unlinkSync)(i),
      await e.reply({
        content: `The ZIP is ${m(r)}, which exceeds Discord's ${m(8388608)} attachment limit.`,
        ephemeral: !0,
      }))
    : (await e.reply({
        content: "Project ZIP — " + m(r),
        files: [new l.AttachmentBuilder(i, { name: "bot.zip" })],
        ephemeral: !0,
      }),
      (0, u.unlinkSync)(i));
}
async function X(e) {
  var t = e.client,
    a = Math.floor(t.uptime / 1e3),
    r = process.memoryUsage(),
    n = (0, u.statSync)(f.default.resolve(process.cwd(), "bot.js")).size,
    t = new l.EmbedBuilder()
      .setColor(c.colors.info)
      .setTitle("Bot Statistics")
      .addFields(
        {
          name: "Discord",
          value: [
            "🏠 Guilds: " + t.guilds.cache.size,
            "👥 Users: " + t.users.cache.size,
            `📡 Ping: ${t.ws.ping}ms`,
          ].join("\n"),
          inline: !0,
        },
        {
          name: "Process",
          value: [
            "⏱️ Uptime: " + F(a),
            "💾 RAM: " + m(r.rss),
            "📦 Bundle: " + m(n),
            "🟢 Node: " + process.version,
          ].join("\n"),
          inline: !0,
        },
        {
          name: "System",
          value: [
            "🖥️ CPU: " + h.default.cpus()[0].model,
            "⚙️ Cores: " + h.default.cpus().length,
            "🌐 Platform: " + process.platform,
          ].join("\n"),
        },
      )
      .setTimestamp();
  await e.reply({ embeds: [t] });
}
async function ee(t) {
  var a = t.options.getString("code", !0),
    r = g.performance.now();
  try {
    var e = await t.client._eval(`(async () => { ${a} })()`),
      n = g.performance.now() - r;
    await v(
      t,
      w(
        y(
          (0, H.inspect)(e, {
            depth: null,
            colors: !1,
            compact: !1,
            breakLength: 100,
          }),
        ) || "undefined",
        4e3,
      ),
      "Eval Result",
      c.colors.info,
      n,
    );
  } catch (e) {
    a = g.performance.now() - r;
    await v(
      t,
      w(y(e instanceof Error ? (e.stack ?? e.message) : "" + e), 4e3),
      "Eval Error",
      c.colors.error,
      a,
    );
  }
}
async function v(t, a, e, r, n) {
  let o = 0,
    s = () => ({
      embeds: [
        new l.EmbedBuilder()
          .setColor(r)
          .setTitle(e)
          .setDescription(
            `\`\`\`js
${a[o]}
\`\`\``,
          )
          .setFooter({ text: `Page ${o + 1}/${a.length} • ${n.toFixed(2)}ms` }),
      ],
      components: [
        new l.ActionRowBuilder().addComponents(
          new l.ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Previous")
            .setStyle(l.ButtonStyle.Primary)
            .setDisabled(0 === o),
          new l.ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(l.ButtonStyle.Primary)
            .setDisabled(o === a.length - 1),
        ),
      ],
      allowedMentions: { parse: [] },
    }),
    i = (await t.reply(s())).createMessageComponentCollector({ time: 3e5 });
  (i.on("collect", async (e) => {
    if (e.user.id !== t.user.id)
      return e.reply({ content: "❌ This is not your eval.", ephemeral: !0 });
    ("next" === e.customId && o++,
      "previous" === e.customId && o--,
      (o = Math.max(0, Math.min(o, a.length - 1))),
      await e.update(s()));
  }),
    i.on("end", () => {
      t.editReply({ components: [] }).catch(() => {});
    }));
}
function w(t, a) {
  var r = [];
  for (let e = 0; e < t.length; e += a) r.push(t.slice(e, e + a));
  return r;
}
function y(e) {
  var t;
  for (t of [process.env.BotToken].filter(Boolean))
    e = e.replaceAll(t, "[REDACTED]");
  return e;
}
var k = require("discord.js"),
  $ = require("@napi-rs/canvas"),
  te = 6e5,
  b = new Map();
async function D(e) {
  var t = Date.now(),
    a = b.get(e.id);
  return (
    (void 0 === a || te < t - a) && (await e.members.fetch(), b.set(e.id, t)),
    e.members.cache
  );
}
function S(t) {
  for (let e = t.length - 1; 0 < e; e--) {
    var a = Math.floor(Math.random() * (e + 1));
    [t[e], t[a]] = [t[a], t[e]];
  }
  return t;
}
var ae = a({
    type: 0,
    data: new k.SlashCommandBuilder()
      .setName("image")
      .setDescription("Crazy images")
      .addSubcommand((e) =>
        e
          .setName("guild_icon")
          .setDescription("Guild icon wow")
          .addBooleanOption((e) =>
            e
              .setName("allow_bots")
              .setDescription(
                "Allow bots to be included in the image (default: no)",
              )
              .setRequired(!1),
          )
          .addStringOption((e) =>
            e
              .setName("size")
              .setDescription(
                "Output resolution — bigger is slower to render (default: medium)",
              )
              .setRequired(!1)
              .addChoices(
                { name: "Tiny (faster)", value: "tiny" },
                { name: "Small (fast)", value: "small" },
                { name: "Medium (default)", value: "medium" },
                { name: "Large (slow)", value: "large" },
              ),
          )
          .addBooleanOption((e) =>
            e
              .setName("unique_only")
              .setDescription(
                "Never reuse a member's avatar twice — shrinks the grid instead of duplicating (default: no)",
              )
              .setRequired(!1),
          )
          .addIntegerOption((e) =>
            e
              .setName("max_duplicates")
              .setDescription(
                "Max times a single member's avatar can repeat when filling the grid (default: no limit)",
              )
              .setRequired(!1)
              .setMinValue(1)
              .setMaxValue(20),
          )
          .addIntegerOption((e) =>
            e
              .setName("multiplier")
              .setDescription(
                "Repeat every member's avatar, e.g. 2 = everyone appears twice (default: 1)",
              )
              .setRequired(!1)
              .setMinValue(1)
              .setMaxValue(50),
          )
          .addAttachmentOption((e) =>
            e
              .setName("image")
              .setDescription("Recreate this image instead of the guild icon")
              .setRequired(!1),
          ),
      ),
    async execute(t) {
      try {
        if ("guild_icon" !== t.options.getSubcommand())
          throw Error("Unknown subcommand.");
        return oe(t);
      } catch (e) {
        return n.unknownError(t, e, t.replied);
      }
    },
  }),
  B = 625,
  re = { tiny: 12, small: 32, medium: 48, large: 64 },
  ne = 20;
async function oe(l) {
  if (l.inGuild() && l.guild) {
    var c = l.guild,
      d = l.options.getAttachment("image"),
      u = d?.url ?? c.iconURL({ size: 512, extension: "png" });
    if (u)
      if (d && !d.contentType?.startsWith("image/"))
        await l.reply({
          content: "That attachment doesn't look like an image.",
          ephemeral: !0,
        });
      else {
        let t = l.options.getBoolean("allow_bots") ?? !1,
          o = re[l.options.getString("size") ?? "medium"],
          e = l.options.getBoolean("unique_only") ?? !1,
          s = l.options.getInteger("max_duplicates") ?? void 0,
          i = l.options.getInteger("multiplier") ?? 1;
        if (e && 1 < i)
          await l.reply({
            content:
              "unique_only and multiplier can't be used together — unique_only forbids repeats entirely.",
            ephemeral: !0,
          });
        else if (void 0 !== s && s < i)
          await l.reply({
            content: `max_duplicates (${s}) can't be lower than multiplier (${i}).`,
            ephemeral: !0,
          });
        else {
          await l.deferReply();
          let r = [...(await D(c)).values()].filter((e) => !!t || !e.user.bot);
          if (0 === r.length)
            await l.editReply(
              t
                ? "This server has no members to build a mosaic from."
                : "This server has no non-bot members to build a mosaic from — try allow_bots:true.",
            );
          else {
            r.length > B && (r = S([...r]).slice(0, B));
            let a, n;
            if (e)
              ((n = Math.floor(Math.sqrt(r.length))),
                (a = S([...r]).slice(0, n * n)));
            else {
              let t = new Map(r.map((e) => [e.id, i]));
              a = [];
              for (let e = 0; e < i; e++) a.push(...r);
              a.length > B && (a = S(a).slice(0, B));
              for (
                var m = (n = Math.ceil(Math.sqrt(a.length))) * n;
                a.length < m;
              ) {
                var p = s ? r.filter((e) => (t.get(e.id) ?? 0) < s) : r;
                if (0 === p.length) break;
                p = p[Math.floor(Math.random() * p.length)];
                (t.set(p.id, (t.get(p.id) ?? 0) + 1), a.push(p));
              }
              a.length < m &&
                ((n = Math.floor(Math.sqrt(a.length))),
                (a = a.slice(0, n * n)));
            }
            var h = n * n;
            if (0 == h)
              await l.editReply(
                "Not enough members to make even a 1x1 mosaic with these options — try lowering unique_only/max_duplicates restrictions.",
              );
            else {
              var d = await (0, $.loadImage)(u),
                c = (0, $.createCanvas)(n, n).getContext("2d"),
                f =
                  ((c.imageSmoothingEnabled = !0),
                  (c.imageSmoothingQuality = "high"),
                  c.drawImage(d, 0, 0, n, n),
                  c.getImageData(0, 0, n, n).data),
                g = [];
              for (let e = 0; e < h; e++) {
                var v = 4 * e;
                g.push([f[v], f[1 + v], f[2 + v]]);
              }
              var w,
                y = [
                  ...(await le(a, ne, async (e) => {
                    var t = e.displayAvatarURL({ size: 64, extension: "png" }),
                      t = await (0, $.loadImage)(t);
                    return { member: e, image: t, color: se(t) };
                  })),
                ],
                b = [];
              for (w of g) {
                let t = 0,
                  a = 1 / 0;
                for (let e = 0; e < y.length; e++) {
                  var x = ie(w, y[e].color);
                  x < a && ((a = x), (t = e));
                }
                (b.push(y[t]), y.splice(t, 1));
              }
              let e = (0, $.createCanvas)(n * o, n * o),
                r = e.getContext("2d");
              b.forEach((e, t) => {
                var a = (t % n) * o,
                  t = Math.floor(t / n) * o;
                r.drawImage(e.image, a, t, o, o);
              });
              u = new k.AttachmentBuilder(await e.encode("png"), {
                name: "image.png",
              });
              await l.editReply({ files: [u] });
            }
          }
        }
      }
    else
      await l.reply({
        content:
          "This server doesn't have an icon set — try the image option to use a custom picture instead.",
        ephemeral: !0,
      });
  } else
    await l.reply({
      content: "This command can only be used in a server.",
      ephemeral: !0,
    });
}
function se(e) {
  var t = (0, $.createCanvas)(1, 1).getContext("2d"),
    [e, t, a] =
      ((t.imageSmoothingEnabled = !0),
      t.drawImage(e, 0, 0, 1, 1),
      t.getImageData(0, 0, 1, 1).data);
  return [e, t, a];
}
function ie(e, t) {
  var a = e[0] - t[0],
    r = e[1] - t[1],
    n = e[2] - t[2],
    e = (e[0] + t[0]) / 2;
  return ((512 + e) * a * a) / 256 + 4 * r * r + ((767 - e) * n * n) / 256;
}
async function le(t, e, a) {
  let r = Array(t.length),
    n = 0;
  return (
    await Promise.all(
      Array.from({ length: Math.min(e, t.length) }, async function () {
        for (; n < t.length;) {
          var e = n++;
          r[e] = await a(t[e]);
        }
      }),
    ),
    r
  );
}
function x(e) {
  return e;
}
var ce = x({
    name: "interactionCreate",
    once: !1,
    async execute(t) {
      var e = t.client;
      if (t.isChatInputCommand()) {
        var a = e.commands.find((e) => e.data.name == t.commandName);
        if (!a)
          return void console.error(
            `No command matching ${t.commandName} was found.`,
          );
        try {
          await a.execute(t);
        } catch (e) {
          console.error("Error executing " + t.commandName);
          try {
            n.unknownError(t, e);
          } catch {}
        }
      }
      if (t.isAutocomplete()) {
        a = e.commands.find((e) => e.data.name == t.commandName);
        if (a)
          try {
            a.autocomplete
              ? await a.autocomplete(t)
              : t.respond([
                  {
                    name: "This option do not have autocomplete feature.",
                    value: "error",
                  },
                ]);
          } catch (e) {
            console.error("Error executing " + t.commandName);
          }
        else console.error(`No command matching ${t.commandName} was found.`);
      }
    },
  }),
  de = e(require("consola")),
  ue = x({
    name: "clientReady",
    once: !0,
    execute(e) {
      de.default.box(`Logged in as ${e.user.tag}
${e.guilds.cache.size} guilds
${e.commands.size} commands`);
    },
  }),
  q = require("discord.js");
function C(e) {
  return (
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(e) &&
    !/^-?(\.[0-9]+|[0-9]+(\.[0-9]*)?)$/.test(e)
  );
}
function M(e) {
  return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function E(e) {
  return C(e) ? `"${M(e)}"` : e;
}
function R(e) {
  return "number" == typeof e || "boolean" == typeof e
    ? "" + e
    : C(e)
      ? `"${M(e)}"`
      : e;
}
function _(e) {
  return e && 0 !== Object.keys(e).length
    ? ` [${Object.entries(e)
        .map(([e, t]) => E(e) + "=" + R(t))
        .join(", ")}]`
    : "";
}
var me = class Re {
  statements = [];
  graphAttr(e) {
    return (this.statements.push({ kind: "graphAttr", attrs: e }), this);
  }
  nodeDefaults(e) {
    return (this.statements.push({ kind: "nodeDefaults", attrs: e }), this);
  }
  edgeDefaults(e) {
    return (this.statements.push({ kind: "edgeDefaults", attrs: e }), this);
  }
  node(e, t) {
    return (this.statements.push({ kind: "node", name: e, attrs: t }), this);
  }
  edge(e, t, a) {
    return (
      this.statements.push({ kind: "edge", from: e, to: t, attrs: a }),
      this
    );
  }
  comment(e) {
    e = e
      .split("\n")
      .map((e) => "// " + e)
      .join("\n");
    return (this.statements.push({ kind: "raw", text: e }), this);
  }
  subgraph(e, t) {
    var a = new Re();
    return (
      t(a),
      this.statements.push({ kind: "subgraph", name: e, builder: a }),
      this
    );
  }
  build(e, t = {}) {
    var a = t.indent ?? "    ",
      r = t.directed ?? !0,
      t = t.strict ?? !1,
      n = r ? "digraph" : "graph",
      a = this.renderStatements(this.statements, a, r ? "->" : "--", 1);
    return [(t ? "strict " : "") + n + ` ${E(e)} {`, ...a, "}"].join("\n");
  }
  renderStatements(e, t, a, r) {
    var n,
      o = t.repeat(r),
      s = [];
    for (n of e)
      switch (n.kind) {
        case "graphAttr":
          for (var [i, l] of Object.entries(n.attrs))
            s.push("" + o + E(i) + `=${R(l)};`);
          break;
        case "nodeDefaults":
          s.push(`${o}node${_(n.attrs)};`);
          break;
        case "edgeDefaults":
          s.push(`${o}edge${_(n.attrs)};`);
          break;
        case "node":
          s.push("" + o + E(n.name) + _(n.attrs) + ";");
          break;
        case "edge":
          var c = Array.isArray(n.to)
            ? `{ ${n.to.map(E).join("; ")} }`
            : E(n.to);
          s.push("" + o + E(n.from) + ` ${a} ${c}${_(n.attrs)};`);
          break;
        case "raw":
          s.push(n.text);
          break;
        case "subgraph":
          (s.push(`${o}subgraph ${E(n.name)} {`),
            s.push(...this.renderStatements(n.builder.statements, t, a, r + 1)),
            s.push(o + "}"));
      }
    return s;
  }
};
function pe(e, t, a) {
  var r = new me();
  return (t(r), r.build(e, a));
}
var T = 500,
  he = a({
    type: 0,
    data: new q.SlashCommandBuilder()
      .setName("tree")
      .setDescription("Generates tree diagrams")
      .addSubcommand((e) =>
        e
          .setName("guild_members")
          .setDescription("Generates a guild member to roles tree of a guild")
          .addBooleanOption((e) =>
            e
              .setName("top_role_only")
              .setDescription(
                "Only draw an edge to each member's highest role (default: edge to every role they have)",
              )
              .setRequired(!1),
          )
          .addBooleanOption((e) =>
            e
              .setName("allow_bots")
              .setDescription(
                "Allow bots to be included in the tree (default: no)",
              )
              .setRequired(!1),
          ),
      ),
    async execute(t) {
      try {
        if ("guild_members" !== t.options.getSubcommand())
          throw Error("Unknown subcommand.");
        return fe(t);
      } catch (e) {
        return n.unknownError(t, e, t.replied);
      }
    },
  });
async function fe(a) {
  if (a.inGuild() && a.guild) {
    let p = a.options.getBoolean("top_role_only") ?? !1,
      t = a.options.getBoolean("allow_bots") ?? !1,
      h = (await a.deferReply(), a.guild),
      e = [...(await D(h)).values()].filter((e) => !!t || !e.user.bot);
    if (e.length > T)
      await a.editReply(
        `This server has ${e.length} members, which is too many to render (limit: ${T}).`,
      );
    else {
      let i = [...h.roles.cache.values()]
          .filter((e) => e.id !== h.id)
          .sort((e, t) => t.position - e.position),
        l = new Map(i.map((e) => [e.id, e])),
        c = new Map(),
        d = [],
        u = new Map(),
        m = new Set();
      for (var r of e) {
        var n,
          o,
          s = [...r.roles.cache.values()]
            .filter((e) => e.id !== h.id)
            .sort((e, t) => t.position - e.position);
        0 === s.length
          ? d.push(r)
          : ((n = s[0]),
            (o = c.get(n.id) ?? []).push(r),
            c.set(n.id, o),
            u.set(
              r.id,
              s.map((e) => e.id),
            ),
            s.forEach((e) => m.add(e.id)));
      }
      var f = await ve(
          pe(ge(h.name), (e) => {
            e.graphAttr({
              overlap: "false",
              splines: "true",
              sep: "+16",
              bgcolor: "#313338",
              fontname: "Helvetica",
              fontcolor: "white",
            });
            var t = "guild";
            e.node(t, {
              label: h.name,
              shape: "doubleoctagon",
              style: "filled",
              fillcolor: "#5865F2",
              fontcolor: "white",
            });
            for (let s of i)
              if (m.has(s.id)) {
                let r = "role_" + s.id,
                  n = "#000000" === s.hexColor ? "#99aab5" : s.hexColor,
                  o = c.get(s.id) ?? [];
                (e.subgraph("cluster_" + s.id, (e) => {
                  (e.graphAttr({
                    label: s.name,
                    style: "rounded,filled",
                    color: n,
                    fillcolor: n + "22",
                    fontname: "Helvetica-Bold",
                  }),
                    e.nodeDefaults({
                      shape: "ellipse",
                      style: "filled",
                      fillcolor: "white",
                      fontname: "Helvetica",
                    }),
                    e.node(r, {
                      label: s.name,
                      shape: "box",
                      style: "rounded,filled",
                      fillcolor: n,
                      fontcolor: "black",
                    }));
                  for (var t of o) {
                    var a = "member_" + t.id;
                    (e.node(a, { label: g(t) }),
                      e.edge(r, a, { color: n, penwidth: 1.5 }));
                  }
                }),
                  e.edge(t, r, { style: "bold", color: n, penwidth: 2 }));
              }
            if (!p)
              for (var [a, r] of u)
                for (var n of r.slice(1)) {
                  var o = l.get(n),
                    o = o && "#000000" !== o.hexColor ? o.hexColor : "#99aab5";
                  e.edge("role_" + n, "member_" + a, {
                    style: "dashed",
                    color: o + "88",
                    penwidth: 1,
                    arrowsize: 0.7,
                  });
                }
            if (d.length) {
              e.subgraph("cluster_no_role", (e) => {
                (e.graphAttr({ label: "No Role", style: "rounded,dashed" }),
                  e.nodeDefaults({
                    shape: "ellipse",
                    style: "filled",
                    fillcolor: "#eeeeee",
                  }));
                for (var t of d) e.node("member_" + t.id, { label: g(t) });
              });
              for (var s of d)
                e.edge(t, "member_" + s.id, {
                  style: "dotted",
                  color: "#6b7280",
                  penwidth: 1,
                });
            }
          }),
        ),
        f = new q.AttachmentBuilder(f, { name: "guild-tree.png" });
      function g(e) {
        return e.user.bot ? e.user.username + " [BOT]" : "@" + e.user.username;
      }
      await a.editReply({ files: [f] });
    }
  } else
    await a.reply({
      content: "This command can only be used in a server.",
      ephemeral: !0,
    });
}
function ge(e) {
  return e.replace(/[^A-Za-z0-9_]/g, "_") || "G";
}
async function ve(e) {
  var t,
    e = await fetch("https://quickchart.io/graphviz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graph: e,
        layout: "neato",
        format: "png",
        width: 1600,
        height: 1200,
      }),
    });
  if (e.ok) return Buffer.from(await e.arrayBuffer());
  throw (
    (t = await e.text()),
    Error(`QuickChart graphviz request failed: ${e.status} ` + t)
  );
}
function we(e) {
  var t,
    a = [ue, ce];
  i.default.start("Loading events...");
  for (t of a)
    (t.once ? e.once(t.name, t.execute) : e.on(t.name, t.execute),
      e.events.set(t.customName ?? t.name, t));
  i.default.success(`Loaded ${a.length} event${1 === a.length ? "" : "s"}.`);
}
async function ye(e) {
  var t,
    a = [W, he, ae];
  i.default.start("Loading commands...");
  for (t of a) e.commands.set(e.commands.size, t);
  if (
    (i.default.success(
      `Loaded ${a.length} command${1 === a.length ? "" : "s"}.`,
    ),
    d.token && d.clientId)
  ) {
    var r = new s.REST({ version: "10" }).setToken(d.token);
    try {
      i.default.start("Registering application commands...");
      var n = await r.put(s.Routes.applicationCommands(d.clientId), {
        body: a.map((e) => e.data.toJSON()),
      });
      i.default.success(`Registered ${n.length} application command(s).`);
    } catch (e) {
      (i.default.error("Failed to register application commands."),
        i.default.error(e));
    }
  } else
    i.default.warn(
      "BotToken or BotID is missing. Skipping slash command registration.",
    );
}
var be = require("discord.js-selfbot-v13"),
  xe = e(require("consola")),
  ke = e(require("consola")),
  $e = e(require("consola"));
function De(e) {
  return e;
}
var Se = De({
  name: "ready",
  once: !0,
  execute(e) {
    $e.default.box(`Logged in as ${e.user.tag}
${e.guilds.cache.size} guilds`);
  },
});
function Be(e) {
  var t,
    a = [Se];
  ke.default.start("Loading events...");
  for (t of a) t.once ? e.once(t.name, t.execute) : e.on(t.name, t.execute);
  ke.default.success(`Loaded ${a.length} event${1 === a.length ? "" : "s"}.`);
}
function qe(e) {
  Be(e);
}
var Ce = e(require("ora")),
  N = e(require("consola"));
function Me(e) {
  (process.on("unhandledRejection", (e, t) => {
    (N.default.fatal("Unhandled Promise Rejection"),
      N.default.error("Promise:", t),
      N.default.error(e));
  }),
    process.on("uncaughtExceptionMonitor", (e, t) => {
      (N.default.warn(`Exception monitor (${t})`), N.default.error(e));
    }),
    process.on("uncaughtException", (e, t) => {
      (N.default.fatal(`Uncaught Exception (${t})`),
        N.default.error(e),
        setTimeout(() => process.exit(1), 100));
    }),
    process.on("warning", (e) => {
      N.default.warn(e.name + ": " + e.message);
    }),
    e.on("error", (e) => {
      (N.default.error("Discord client error"), N.default.error(e));
    }),
    e.on("shardError", (e, t) => {
      (N.default.error(`Shard ${t} websocket error`), N.default.error(e));
    }),
    e.on("shardDisconnect", (e, t) => {
      N.default.warn(
        `Shard ${t} disconnected (code ${e.code}, clean=${e.wasClean})`,
      );
    }),
    e.on("shardReconnecting", (e) => {
      N.default.info(`Shard ${e} reconnecting...`);
    }),
    e.on("shardResume", (e, t) => {
      N.default.success(`Shard ${e} resumed (${t} replayed events)`);
    }),
    N.default.success("Error handler initialized."));
}
var j = new t.Client({
  intents: [
    t.GatewayIntentBits.Guilds,
    t.GatewayIntentBits.GuildMessages,
    t.GatewayIntentBits.GuildMembers,
    t.GatewayIntentBits.GuildPresences,
  ],
});
async function Ee() {
  try {
    d.validate();
    var e = (0, Ce.default)("Loading events...").start();
    (we(j),
      e.succeed(`Loaded ${j.events.size} events`),
      e.start("Loading commands..."),
      await ye(j),
      e.succeed(`Loaded ${j.commands.size} commands`),
      d.token ||
        (xe.default.fatal("BotToken is missing in the environment variables."),
        process.exit(1)),
      e.start("Logging into Discord..."),
      await j.login(d.token),
      e.succeed("Connected to Discord"),
      j.self &&
        d.userToken &&
        (e.start("Initializing Discord User..."),
        await qe(j.self),
        e.succeed("Discord User Ready"),
        e.start("Logging into Discord User..."),
        await j.self.login(d.userToken),
        e.succeed("Connected to Discord User")));
  } catch (e) {
    (xe.default.error(e), process.exit(1));
  }
}
((j.commands = new t.Collection()),
  (j.events = new t.Collection()),
  d.userToken && (j.self = new be.Client({})),
  Me(j),
  Ee());
