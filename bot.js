var E = Object.create,
  s = Object.defineProperty,
  O = Object.getOwnPropertyDescriptor,
  A = Object.getOwnPropertyNames,
  P = Object.getPrototypeOf,
  z = Object.prototype.hasOwnProperty,
  e = (e, t, a) => {
    a = null != e ? E(P(e)) : {};
    var r,
      o =
        !t && e && e.__esModule
          ? a
          : s(a, "default", { value: e, enumerable: !0 }),
      n = e;
    if ((n && "object" == typeof n) || "function" == typeof n)
      for (let e of A(n))
        z.call(o, e) ||
          void 0 === e ||
          s(o, e, {
            get: () => n[e],
            enumerable: !(r = O(n, e)) || r.enumerable,
          });
    return o;
  },
  t = require("discord.js"),
  m = require("discord.js"),
  p = e(require("consola")),
  l = require("discord.js"),
  U = require("discord.js"),
  a =
    (((c = {})[(c.Bangers = 1)] = "Bangers"),
    (c[(c.BioRhyme = 2)] = "BioRhyme"),
    (c[(c.CherryBomb = 3)] = "CherryBomb"),
    (c[(c.Chicle = 4)] = "Chicle"),
    (c[(c.Compagnon = 5)] = "Compagnon"),
    (c[(c.MuseoModerno = 6)] = "MuseoModerno"),
    (c[(c.NeoCastel = 7)] = "NeoCastel"),
    (c[(c.PixelifySans = 8)] = "PixelifySans"),
    (c[(c.Ribes = 9)] = "Ribes"),
    (c[(c.Sinistre = 10)] = "Sinistre"),
    (c[(c.Default = 11)] = "Default"),
    (c[(c.ZillaSlab = 12)] = "ZillaSlab"),
    c),
  r =
    (((c = {})[(c.Solid = 1)] = "Solid"),
    (c[(c.Gradient = 2)] = "Gradient"),
    (c[(c.Neon = 3)] = "Neon"),
    (c[(c.Toon = 4)] = "Toon"),
    (c[(c.Pop = 5)] = "Pop"),
    (c[(c.Glow = 6)] = "Glow"),
    c),
  h =
    ((0, require("dotenv").config)({ quiet: !0 }),
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
  L = {
    developers: new Set(["910837428862984213"]),
    isDeveloper(e) {
      return this.developers.has(e);
    },
  },
  d = require("node:fs");
function n(e) {
  let t = 0;
  for (; 1024 <= e && t < 3;) ((e /= 1024), t++);
  return e.toFixed(2) + " " + ["B", "KB", "MB", "GB"][t];
}
var o = require("discord.js"),
  i = async (e, t, a = !1) => (
    t && console.error("[Error Handler]:", t),
    (async (e, t, a = !1, r = () => {}) => {
      a
        ? await e.followUp(t).catch(r)
        : e.replied || e.deferred
          ? await e.editReply(t).catch(r)
          : await e.reply(t).catch(r);
      return null;
    })(
      e,
      {
        components: [
          new o.ContainerBuilder()
            .setAccentColor(2829617)
            .addTextDisplayComponents((e) =>
              e.setContent("An unexpected error occurred."),
            ),
        ],
        flags: o.MessageFlags.IsComponentsV2 | o.MessageFlags.Ephemeral,
      },
      a,
    )
  ),
  G = require("archiver"),
  c = require("node:child_process"),
  F = require("node:util"),
  u = e(require("node:os")),
  f = e(require("node:path")),
  g = require("node:perf_hooks"),
  Z = (0, require("node:util").promisify)(c.exec),
  J = {
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
      .addSubcommand((e) =>
        e
          .setName("display-name")
          .setDescription("Apply display types")
          .addIntegerOption((e) =>
            e
              .setName("font")
              .setDescription("Font")
              .addChoices(
                Object.keys(a)
                  .map((e) => ({ name: e, value: a[e] }))
                  .filter((e) => "number" == typeof e.value),
              )
              .setRequired(!0),
          )
          .addIntegerOption((e) =>
            e
              .setName("effect")
              .setDescription("effect")
              .addChoices(
                Object.keys(r)
                  .map((e) => ({ name: e, value: r[e] }))
                  .filter((e) => "number" == typeof e.value),
              )
              .setRequired(!0),
          ),
      )
      .addSubcommand((e) => e.setName("download").setDescription("Bot file.")),
    async execute(t) {
      if (!L.isDeveloper(t.user.id))
        return t.reply({
          content: "❌ You are not allowed to use this command.",
          ephemeral: !0,
        });
      try {
        switch (t.options.getSubcommand()) {
          case "eval":
            return (async (t) => {
              var a = t.options.getString("code", !0),
                r = g.performance.now();
              try {
                var e = await t.client._eval(`(async () => { ${a} })()`),
                  o = g.performance.now() - r;
                await y(
                  t,
                  w(
                    v(
                      (0, F.inspect)(e, {
                        depth: null,
                        colors: !1,
                        compact: !1,
                        breakLength: 100,
                      }),
                    ) || "undefined",
                    4e3,
                  ),
                  "Eval Result",
                  5793266,
                  o,
                );
              } catch (e) {
                a = g.performance.now() - r;
                await y(
                  t,
                  w(
                    v(e instanceof Error ? (e.stack ?? e.message) : "" + e),
                    4e3,
                  ),
                  "Eval Error",
                  15548997,
                  a,
                );
              }
            })(t);
          case "exec":
            return (async (t) => {
              var e = t.options.getString("command", !0),
                a = g.performance.now();
              try {
                var { stdout: r, stderr: o } = await Z(e, {
                  timeout: 3e4,
                  maxBuffer: 1048576,
                });
                await y(
                  t,
                  w(v(r || o || "No output."), 4e3),
                  "Exec Result",
                  o ? 15548997 : 5763719,
                  g.performance.now() - a,
                );
              } catch (e) {
                await y(
                  t,
                  w(e instanceof Error ? e.message : "" + e, 4e3),
                  "Exec Error",
                  15548997,
                  g.performance.now() - a,
                );
              }
            })(t);
          case "stats":
            return (async (e) => {
              var t = e.client,
                a = Math.floor(t.uptime / 1e3),
                r = process.memoryUsage(),
                o = (0, d.statSync)(
                  f.default.resolve(process.cwd(), "bot.js"),
                ).size,
                a = new l.EmbedBuilder()
                  .setColor(5793266)
                  .setTitle("Bot Statistics")
                  .addFields(
                    {
                      name: "Discord",
                      value: [
                        "🏠 Guilds: " + t.guilds.cache.size,
                        "👥 Users: " + t.users.cache.size,
                        `📡 Ping: ${t.ws.ping}ms`,
                      ].join(`
`),
                      inline: !0,
                    },
                    {
                      name: "Process",
                      value: [
                        "⏱️ Uptime: " +
                          [
                            (a = Math.floor((t = a) / 86400)) && a + "d",
                            (a = Math.floor((t %= 86400) / 3600)) && a + "h",
                            (a = Math.floor((t %= 3600) / 60)) && a + "m",
                            (t % 60) + "s",
                          ]
                            .filter(Boolean)
                            .join(" "),
                        "💾 RAM: " + n(r.rss),
                        "📦 Bundle: " + n(o),
                        "🟢 Node: " + process.version,
                      ].join(`
`),
                      inline: !0,
                    },
                    {
                      name: "System",
                      value: [
                        "🖥️ CPU: " + u.default.cpus()[0].model,
                        "⚙️ Cores: " + u.default.cpus().length,
                        "🌐 Platform: " + process.platform,
                      ].join(`
`),
                    },
                  )
                  .setTimestamp();
              await e.reply({ embeds: [a] });
            })(t);
          case "download":
            return (async (e) => {
              let s = [
                "bot.js",
                "scripts",
                "package.json",
                "README.md",
                ".env.example",
                "LICENSE",
              ];
              for (var t of s) {
                var a = f.default.resolve(process.cwd(), t);
                try {
                  (0, d.statSync)(a);
                } catch {
                  return void (await e.reply({
                    content: `Couldn't find \`${t}\`.`,
                    ephemeral: !0,
                  }));
                }
              }
              let i = f.default.join(process.cwd(), "bot.zip"),
                r =
                  (await new Promise((e, t) => {
                    var a,
                      r = (0, d.createWriteStream)(i),
                      o = new G.ZipArchive({ zlib: { level: 9 } });
                    (r.on("close", e), o.on("error", t), o.pipe(r));
                    for (a of s) {
                      var n = f.default.resolve(process.cwd(), a);
                      (0, d.statSync)(n).isDirectory()
                        ? o.directory(n, a)
                        : o.file(n, { name: a });
                    }
                    o.finalize();
                  }),
                  (0, d.statSync)(i).size);
              8388608 < r
                ? ((0, d.unlinkSync)(i),
                  await e.reply({
                    content: `The ZIP is ${n(r)}, which exceeds Discord's ${n(8388608)} attachment limit.`,
                    ephemeral: !0,
                  }))
                : (await e.reply({
                    content: "Project ZIP — " + n(r),
                    files: [new l.AttachmentBuilder(i, { name: "bot.zip" })],
                    ephemeral: !0,
                  }),
                  (0, d.unlinkSync)(i));
            })(t);
          case "display-name":
            return (async (e) => {
              e.deferReply();
              var t,
                a = e.options.getInteger("font", !0),
                r = e.options.getInteger("effect", !0);
              for (t of Array.from(e.client.guilds.cache.keys())) {
                try {
                  await (async (e, t, a, r) => {
                    try {
                      return !!(await e.rest.patch(
                        U.Routes.guildMember(
                          "string" == typeof t ? t : t.id,
                          "@me",
                        ),
                        {
                          body: {
                            display_name_font_id: a,
                            display_name_effect_id: r,
                            display_name_colors: [16711680, 16711935],
                          },
                        },
                      ));
                    } catch (e) {
                      return (
                        console.error(
                          "Name style failed:",
                          e?.rawError?.message ?? e?.message ?? "Unknown error",
                        ),
                        !1
                      );
                    }
                  })(e.client, t, a, r);
                } catch {}
                await new Promise((e) => setTimeout(e, 1500));
              }
              e.editReply("cool");
            })(t);
          default:
            throw Error("Unknown subcommand.");
        }
      } catch (e) {
        return i(t, e, t.replied);
      }
    },
  };
async function y(t, a, e, r, o) {
  let n = 0,
    s = () => ({
      embeds: [
        new l.EmbedBuilder()
          .setColor(r)
          .setTitle(e)
          .setDescription(
            `\`\`\`js
${a[n]}
\`\`\``,
          )
          .setFooter({ text: `Page ${n + 1}/${a.length} • ${o.toFixed(2)}ms` }),
      ],
      components: [
        new l.ActionRowBuilder().addComponents(
          new l.ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Previous")
            .setStyle(l.ButtonStyle.Primary)
            .setDisabled(0 === n),
          new l.ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(l.ButtonStyle.Primary)
            .setDisabled(n === a.length - 1),
        ),
      ],
      allowedMentions: { parse: [] },
    }),
    i = (await t.reply(s())).createMessageComponentCollector({ time: 3e5 });
  (i.on("collect", async (e) => {
    if (e.user.id !== t.user.id)
      return e.reply({ content: "❌ This is not your eval.", ephemeral: !0 });
    ("next" === e.customId && n++,
      "previous" === e.customId && n--,
      (n = Math.max(0, Math.min(n, a.length - 1))),
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
function v(e) {
  var t;
  for (t of [process.env.BotToken].filter(Boolean))
    e = e.replaceAll(t, "[REDACTED]");
  return e;
}
var c = require("discord.js"),
  V = require("discord.js"),
  k = require("@napi-rs/canvas"),
  H = 6e5,
  b = new Map();
async function C(e) {
  var t = Date.now(),
    a = b.get(e.id);
  return (
    (void 0 === a || H < t - a) && (await e.members.fetch(), b.set(e.id, t)),
    e.members.cache
  );
}
var W = require("@napi-rs/canvas");
function R(t) {
  for (let e = t.length - 1; 0 < e; e--) {
    var a = Math.floor(Math.random() * (e + 1));
    [t[e], t[a]] = [t[a], t[e]];
  }
  return t;
}
var Q = { tiny: 12, small: 32, medium: 48, large: 64 };
async function K(l) {
  if (l.inGuild() && l.guild) {
    var d = l.guild,
      c = l.options.getAttachment("image"),
      u = c?.url ?? d.iconURL({ size: 512, extension: "png" });
    if (u)
      if (c && !c.contentType?.startsWith("image/"))
        await l.reply({
          content: "That attachment doesn't look like an image.",
          ephemeral: !0,
        });
      else {
        let t = l.options.getBoolean("allow_bots") ?? !1,
          n = Q[l.options.getString("size") ?? "medium"],
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
          let r = [...(await C(d)).values()].filter((e) => !!t || !e.user.bot);
          if (0 === r.length)
            await l.editReply(
              t
                ? "This server has no members to build a mosaic from."
                : "This server has no non-bot members to build a mosaic from — try allow_bots:true.",
            );
          else {
            625 < r.length && (r = R([...r]).slice(0, 625));
            let a, o;
            if (e)
              ((o = Math.floor(Math.sqrt(r.length))),
                (a = R([...r]).slice(0, o * o)));
            else {
              let t = new Map(r.map((e) => [e.id, i]));
              a = [];
              for (let e = 0; e < i; e++) a.push(...r);
              625 < a.length && (a = R(a).slice(0, 625));
              for (
                var m = (o = Math.ceil(Math.sqrt(a.length))) * o;
                a.length < m;
              ) {
                var p = s ? r.filter((e) => (t.get(e.id) ?? 0) < s) : r;
                if (0 === p.length) break;
                p = p[Math.floor(Math.random() * p.length)];
                (t.set(p.id, (t.get(p.id) ?? 0) + 1), a.push(p));
              }
              a.length < m &&
                ((o = Math.floor(Math.sqrt(a.length))),
                (a = a.slice(0, o * o)));
            }
            var h = o * o;
            if (0 == h)
              await l.editReply(
                "Not enough members to make even a 1x1 mosaic with these options — try lowering unique_only/max_duplicates restrictions.",
              );
            else {
              var c = await (0, k.loadImage)(u),
                d = (0, k.createCanvas)(o, o).getContext("2d"),
                f =
                  ((d.imageSmoothingEnabled = !0),
                  (d.imageSmoothingQuality = "high"),
                  d.drawImage(c, 0, 0, o, o),
                  d.getImageData(0, 0, o, o).data),
                g = [];
              for (let e = 0; e < h; e++) {
                var y = 4 * e;
                g.push([f[y], f[1 + y], f[2 + y]]);
              }
              var w,
                v = [
                  ...(await (async (r) => {
                    let o = Array(r.length),
                      n = 0;
                    return (
                      await Promise.all(
                        Array.from(
                          { length: Math.min(20, r.length) },
                          async function () {
                            for (; n < r.length;) {
                              var e = n++;
                              o[e] =
                                ((a = t = void 0),
                                (t = (e = r[e]).displayAvatarURL({
                                  size: 64,
                                  extension: "png",
                                })),
                                (a = await (0, k.loadImage)(t)),
                                await {
                                  member: e,
                                  image: a,
                                  color: ((e) => {
                                    var t = (0, W.createCanvas)(
                                        1,
                                        1,
                                      ).getContext("2d"),
                                      [e, t, a] =
                                        ((t.imageSmoothingEnabled = !0),
                                        t.drawImage(e, 0, 0, 1, 1),
                                        t.getImageData(0, 0, 1, 1).data);
                                    return [e, t, a];
                                  })(a),
                                });
                            }
                            var t, a;
                          },
                        ),
                      ),
                      o
                    );
                  })(a)),
                ],
                b = [];
              for (w of g) {
                let t = 0,
                  a = 1 / 0;
                for (let e = 0; e < v.length; e++) {
                  var S = w,
                    x = v[e].color,
                    D = S[0] - x[0],
                    B =
                      ((512 + (B = (S[0] + x[0]) / 2)) * D * D) / 256 +
                      4 * (D = S[1] - x[1]) * D +
                      ((767 - B) * (D = S[2] - x[2]) * D) / 256;
                  B < a && ((a = B), (t = e));
                }
                (b.push(v[t]), v.splice(t, 1));
              }
              let e = (0, k.createCanvas)(o * n, o * n),
                r = e.getContext("2d");
              b.forEach((e, t) => {
                var a = (t % o) * n,
                  t = Math.floor(t / o) * n;
                r.drawImage(e.image, a, t, n, n);
              });
              u = new V.AttachmentBuilder(await e.encode("png"), {
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
var Y = {
    type: 0,
    data: new c.SlashCommandBuilder()
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
        if ("guild_icon" === t.options.getSubcommand()) return K(t);
        throw Error("Unknown subcommand.");
      } catch (e) {
        return i(t, e, t.replied);
      }
    },
  },
  X = {
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
            i(t, e);
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
          } catch {
            console.error("Error executing " + t.commandName);
          }
        else console.error(`No command matching ${t.commandName} was found.`);
      }
    },
  },
  S = require("discord.js"),
  ee = {
    type: 0,
    data: new S.SlashCommandBuilder()
      .setName("raw")
      .setDescription("Raw Output.")
      .setIntegrationTypes([S.ApplicationIntegrationType.UserInstall])
      .addSubcommand((e) =>
        e
          .setName("user")
          .setDescription("Raw User JSON.")
          .addUserOption((e) =>
            e.setName("user").setDescription("User to get raw json data"),
          )
          .addBooleanOption((e) =>
            e.setName("as_file").setDescription("Output in a file?"),
          ),
      ),
    async execute(t) {
      try {
        if ("user" === t.options.getSubcommand())
          return (async (t) => {
            var e = t.options.getUser("user") ?? t.user,
              a = t.options.getBoolean("as_file") ?? !1;
            await t.deferReply({ ephemeral: !0 });
            let r;
            try {
              r = await e.fetch().then((e) => t.client.self.users.fetch(e.id));
            } catch {
              r = await t.client.self.users.fetch(e.id);
            }
            var o,
              n = await r.getProfile();
            for (o of Object.keys(n)) o.startsWith("mutual_") && delete n[o];
            var s,
              e = JSON.stringify(n, null, 2);
            a || e.length > x
              ? ((s = new S.AttachmentBuilder(Buffer.from(e, "utf-8"), {
                  name: r.id + ".json",
                })),
                await t.editReply({
                  content:
                    !a && e.length > x
                      ? "That was too long to send inline, so here's a file instead:"
                      : void 0,
                  files: [s],
                }))
              : await t.editReply({
                  content: `\`\`\`json
${e}
\`\`\``,
                });
          })(t);
        throw Error("Unknown subcommand.");
      } catch (e) {
        return i(t, e, t.replied);
      }
    },
  },
  x = 1900,
  te = e(require("consola")),
  ae = {
    name: "clientReady",
    once: !0,
    execute(e) {
      te.default.box(`Logged in as ${e.user.tag}
${e.guilds.cache.size} guilds
${e.commands.size} commands`);
    },
  },
  D = require("discord.js");
function B(e) {
  return (
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(e) &&
    !/^-?(\.[0-9]+|[0-9]+(\.[0-9]*)?)$/.test(e)
  );
}
function N(e) {
  return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function $(e) {
  return B(e) ? `"${N(e)}"` : e;
}
function q(e) {
  return "number" == typeof e || "boolean" == typeof e
    ? "" + e
    : B(e)
      ? `"${N(e)}"`
      : e;
}
function _(e) {
  return e && 0 !== Object.keys(e).length
    ? ` [${Object.entries(e)
        .map(([e, t]) => $(e) + "=" + q(t))
        .join(", ")}]`
    : "";
}
var re = class le {
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
        .split(
          `
`,
        )
        .map((e) => "// " + e).join(`
`);
      return (this.statements.push({ kind: "raw", text: e }), this);
    }
    subgraph(e, t) {
      var a = new le();
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
        o = r ? "digraph" : "graph",
        a = this.renderStatements(this.statements, a, r ? "->" : "--", 1);
      return [(t ? "strict " : "") + o + ` ${$(e)} {`, ...a, "}"].join(`
`);
    }
    renderStatements(e, t, a, r) {
      var o,
        n = t.repeat(r),
        s = [];
      for (o of e)
        switch (o.kind) {
          case "graphAttr":
            for (var [i, l] of Object.entries(o.attrs))
              s.push("" + n + $(i) + `=${q(l)};`);
            break;
          case "nodeDefaults":
            s.push(`${n}node${_(o.attrs)};`);
            break;
          case "edgeDefaults":
            s.push(`${n}edge${_(o.attrs)};`);
            break;
          case "node":
            s.push("" + n + $(o.name) + _(o.attrs) + ";");
            break;
          case "edge":
            var d = Array.isArray(o.to)
              ? `{ ${o.to.map($).join("; ")} }`
              : $(o.to);
            s.push("" + n + $(o.from) + ` ${a} ${d}${_(o.attrs)};`);
            break;
          case "raw":
            s.push(o.text);
            break;
          case "subgraph":
            (s.push(`${n}subgraph ${$(o.name)} {`),
              s.push(
                ...this.renderStatements(o.builder.statements, t, a, r + 1),
              ),
              s.push(n + "}"));
        }
      return s;
    }
  },
  oe = {
    type: 0,
    data: new D.SlashCommandBuilder()
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
        if ("guild_members" === t.options.getSubcommand())
          return (async (a) => {
            if (a.inGuild() && a.guild) {
              let p = a.options.getBoolean("top_role_only") ?? !1,
                t = a.options.getBoolean("allow_bots") ?? !1,
                h = (await a.deferReply(), a.guild),
                e = [...(await C(h)).values()].filter(
                  (e) => !!t || !e.user.bot,
                );
              if (500 < e.length)
                await a.editReply(
                  `This server has ${e.length} members, which is too many to render (limit: 500).`,
                );
              else {
                let i = [...h.roles.cache.values()]
                    .filter((e) => e.id !== h.id)
                    .sort((e, t) => t.position - e.position),
                  l = new Map(i.map((e) => [e.id, e])),
                  d = new Map(),
                  c = [],
                  u = new Map(),
                  m = new Set();
                for (var r of e) {
                  var o,
                    n,
                    s = [...r.roles.cache.values()]
                      .filter((e) => e.id !== h.id)
                      .sort((e, t) => t.position - e.position);
                  0 === s.length
                    ? c.push(r)
                    : ((o = s[0]),
                      (n = d.get(o.id) ?? []).push(r),
                      d.set(o.id, n),
                      u.set(
                        r.id,
                        s.map((e) => e.id),
                      ),
                      s.forEach((e) => m.add(e.id)));
                }
                ((y = await (async (e) => {
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
                  var t = await e.text();
                  throw Error(
                    `QuickChart graphviz request failed: ${e.status} ` + t,
                  );
                })(
                  ((g = h.name.replace(/[^A-Za-z0-9_]/g, "_") || "G"),
                  ((e) => {
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
                          o = "#000000" === s.hexColor ? "#99aab5" : s.hexColor,
                          n = d.get(s.id) ?? [];
                        (e.subgraph("cluster_" + s.id, (e) => {
                          (e.graphAttr({
                            label: s.name,
                            style: "rounded,filled",
                            color: o,
                            fillcolor: o + "22",
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
                              fillcolor: o,
                              fontcolor: "black",
                            }));
                          for (var t of n) {
                            var a = "member_" + t.id;
                            (e.node(a, { label: f(t) }),
                              e.edge(r, a, { color: o, penwidth: 1.5 }));
                          }
                        }),
                          e.edge(t, r, {
                            style: "bold",
                            color: o,
                            penwidth: 2,
                          }));
                      }
                    if (!p)
                      for (var [a, r] of u)
                        for (var o of r.slice(1)) {
                          var n = l.get(o),
                            n =
                              n && "#000000" !== n.hexColor
                                ? n.hexColor
                                : "#99aab5";
                          e.edge("role_" + o, "member_" + a, {
                            style: "dashed",
                            color: n + "88",
                            penwidth: 1,
                            arrowsize: 0.7,
                          });
                        }
                    if (c.length) {
                      e.subgraph("cluster_no_role", (e) => {
                        (e.graphAttr({
                          label: "No Role",
                          style: "rounded,dashed",
                        }),
                          e.nodeDefaults({
                            shape: "ellipse",
                            style: "filled",
                            fillcolor: "#eeeeee",
                          }));
                        for (var t of c)
                          e.node("member_" + t.id, { label: f(t) });
                      });
                      for (var s of c)
                        e.edge(t, "member_" + s.id, {
                          style: "dotted",
                          color: "#6b7280",
                          penwidth: 1,
                        });
                    }
                  })((y = new re())),
                  y.build(g, void 0)),
                )),
                  (g = new D.AttachmentBuilder(y, { name: "guild-tree.png" })));
                function f(e) {
                  return e.user.bot
                    ? e.user.username + " [BOT]"
                    : "@" + e.user.username;
                }
                await a.editReply({ files: [g] });
              }
            } else
              await a.reply({
                content: "This command can only be used in a server.",
                ephemeral: !0,
              });
            var g, y;
          })(t);
        throw Error("Unknown subcommand.");
      } catch (e) {
        return i(t, e, t.replied);
      }
    },
  },
  c = require("discord.js-selfbot-v13"),
  M = e(require("consola")),
  j = e(require("consola")),
  ne = e(require("consola")),
  se = {
    name: "ready",
    once: !0,
    execute(e) {
      ne.default.box(`Logged in as ${e.user.tag}
${e.guilds.cache.size} guilds`);
    },
  },
  ie = e(require("ora")),
  I = e(require("consola")),
  T = new t.Client({
    intents: [
      t.GatewayIntentBits.Guilds,
      t.GatewayIntentBits.GuildMessages,
      t.GatewayIntentBits.GuildMembers,
      t.GatewayIntentBits.GuildPresences,
    ],
  });
((T.commands = new t.Collection()),
  (T.events = new t.Collection()),
  h.userToken && (T.self = new c.Client({})),
  (e = T),
  process.on("unhandledRejection", (e, t) => {
    (I.default.fatal("Unhandled Promise Rejection"),
      I.default.error("Promise:", t),
      I.default.error(e));
  }),
  process.on("uncaughtExceptionMonitor", (e, t) => {
    (I.default.warn(`Exception monitor (${t})`), I.default.error(e));
  }),
  process.on("uncaughtException", (e, t) => {
    (I.default.fatal(`Uncaught Exception (${t})`),
      I.default.error(e),
      setTimeout(() => process.exit(1), 100));
  }),
  process.on("warning", (e) => {
    I.default.warn(e.name + ": " + e.message);
  }),
  e.on("error", (e) => {
    (I.default.error("Discord client error"), I.default.error(e));
  }),
  e.on("shardError", (e, t) => {
    (I.default.error(`Shard ${t} websocket error`), I.default.error(e));
  }),
  e.on("shardDisconnect", (e, t) => {
    I.default.warn(
      `Shard ${t} disconnected (code ${e.code}, clean=${e.wasClean})`,
    );
  }),
  e.on("shardReconnecting", (e) => {
    I.default.info(`Shard ${e} reconnecting...`);
  }),
  e.on("shardResume", (e, t) => {
    I.default.success(`Shard ${e} resumed (${t} replayed events)`);
  }),
  I.default.success("Error handler initialized."),
  (async () => {
    try {
      h.validate();
      var e,
        t = (0, ie.default)("Loading events...").start(),
        a = T,
        r = [ae, X];
      p.default.start("Loading events...");
      for (e of r)
        (e.once ? a.once(e.name, e.execute) : a.on(e.name, e.execute),
          a.events.set(e.customName ?? e.name, e));
      (p.default.success("Loaded 2 events."),
        t.succeed(`Loaded ${T.events.size} events`),
        t.start("Loading commands..."));
      var o,
        n = T,
        s = [J, oe, Y, ee];
      p.default.start("Loading commands...");
      for (o of s) n.commands.set(n.commands.size, o);
      if (
        (p.default.success(
          `Loaded ${s.length} command${1 === s.length ? "" : "s"}.`,
        ),
        h.token && h.clientId)
      ) {
        var i = new m.REST({ version: "10" }).setToken(h.token);
        try {
          p.default.start("Registering application commands...");
          var l = await i.put(m.Routes.applicationCommands(h.clientId), {
            body: s.map((e) => e.data.toJSON()),
          });
          p.default.success(`Registered ${l.length} application command(s).`);
        } catch (e) {
          (p.default.error("Failed to register application commands."),
            p.default.error(e));
        }
      } else
        p.default.warn(
          "BotToken or BotID is missing. Skipping slash command registration.",
        );
      if (
        (await 0,
        t.succeed(`Loaded ${T.commands.size} commands`),
        h.token ||
          (M.default.fatal("BotToken is missing in the environment variables."),
          process.exit(1)),
        t.start("Logging into Discord..."),
        await T.login(h.token),
        t.succeed("Connected to Discord"),
        T.self && h.userToken)
      ) {
        t.start("Initializing Discord User...");
        var d,
          c = T.self,
          u = [se];
        j.default.start("Loading events...");
        for (d of u)
          d.once ? c.once(d.name, d.execute) : c.on(d.name, d.execute);
        (j.default.success("Loaded 1 event."),
          await 0,
          t.succeed("Discord User Ready"),
          t.start("Logging into Discord User..."),
          await T.self.login(h.userToken),
          t.succeed("Connected to Discord User"));
      }
    } catch (e) {
      (M.default.error(e), process.exit(1));
    }
  })());
