// Python parity: lists python-tesla-fleet-api's public surface from an AST walk
// and compares each row with this package's source, as document 03 section 1 did.
//
//   pnpm parity --python <clone of python-tesla-fleet-api> [--rows present|partial|missing|all] [--json]
//
// Reads two source trees, and nothing else. A row is one public module-level
// class, function or constant, or one public method of a class. TypeVars and
// dunders are not rows.
//
//   present  same name, reachable from a published entry, same shape as far as
//            this script can check: parameters, HTTP verb, path and literal
//            body keys, enum members and values, error attributes.
//   partial  a Node equal exists, but something differs. The row names what.
//   missing  no Node equal. `NOT_PORTED` carries document 01 section 12's rows.
//
// It cannot see behaviour. A signed command's protobuf fields are checked by
// test/proto-coverage-lock.test.ts, and nothing here has run on hardware.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(REPO, "src");

/** Published entries, from `package.json` `exports`, with their source. */
const ENTRIES: Readonly<Record<string, string>> = {
    ".": "src/index.ts",
    "./tariff": "src/tariff.ts",
    "./const": "src/const.ts",
    "./router": "src/router/index.ts",
    "./types": "src/types/index.ts",
    "./bluetooth": "src/bluetooth/index.ts",
    "./bluetooth/homey": "src/bluetooth/adapters/homey.ts",
    "./bluetooth/noble": "src/bluetooth/adapters/noble.ts",
    "./bluetooth/esphome": "src/bluetooth/adapters/esphome.ts",
};
/** Built and tested, not in `exports` until PW-17. */
const GATED_ENTRY = "src/powerwall/index.ts";
const GATED_REASON = "built, but ./powerwall is not exported until PW-17";
const GATED_SOURCE = "src/powerwall/";

/** Python class to the Node class that plays its part. */
const CLASS_MAP: Readonly<Record<string, string>> = {
    Tesla: "TeslaFleetApi",
    VehicleFleet: "VehicleSpecific",
    Vehicles: "Vehicle",
    EnergySite: "EnergySpecific",
    EnergySites: "Energy",
    // The VIN-bound class in both. Node's `Vehicle` is the VIN-free service.
    Vehicle: "VehicleSpecific",
    Seat: "Seats",
    // Node's `AuthorizedClient` is the parsed one, as in Python's other two files.
    "tesla/powerwall/models.py:AuthorizedClient": "AuthorizedClientRecord",
};

/** Python module-level name to its deliberately different Node name. */
const NAME_MAP: Readonly<Record<string, string>> = {
    MODELS: "Models",
    get_tariff_periods: "getTariffPeriods",
    unwrap_tariff_v2: "unwrapTariffV2",
    firmware_compare: "firmwareCompare",
    firmware_at_least: "firmwareAtLeast",
    // Node time constants are milliseconds, and the name says so.
    DEFAULT_KEEPALIVE_INTERVAL: "DEFAULT_KEEPALIVE_INTERVAL_MS",
    "tesla/vehicle/bluetooth.py:DEFAULT_WAKE_TIMEOUT": "DEFAULT_WAKE_TIMEOUT_MS",
    "tesla/vehicle/fleet.py:DEFAULT_WAKE_TIMEOUT": "WAKE_TIMEOUT_MS",
    LINK_TEARDOWN_TIMEOUT: "LINK_TEARDOWN_TIMEOUT_MS",
    STALE_CHUNK_TIMEOUT: "STALE_CHUNK_TIMEOUT_MS",
};

/** `Class.member` to the Node member, where it has another name or lives on another class. */
const MEMBER_MAP: Readonly<Record<string, string>> = {
    "Session.keys_for": "Session.keysFor",
    "Session.hmac_personalized": "Session.hmacPersonalized",
    "Session.aes_gcm_personalized": "Session.aesGcmPersonalized",
    "ReassemblingBuffer.receive_data": "ReassemblingBuffer.receive",
    // Python's take a device. These read the connected link.
    "TeslaBluetooth.query_display_name": "VehicleBluetooth.query_display_name",
    // No VIN in the route, so they stay on the service class (doc 01 s3).
    "VehicleFleet.list": "Vehicle.list",
    "VehicleFleet.share_invites_redeem": "Vehicle.share_invites_redeem",
};

/** Python overrides these to change behaviour, so inheriting a Node method is not enough. */
const MUST_OVERRIDE: ReadonlySet<string> = new Set(["Commands", "VehicleBluetooth", "TeslemetryVehicle", "TessieVehicle", "TeslemetryEnergySite", "TeslemetryVehicles", "TessieVehicles", "Teslemetry", "Tessie"]);

/** Why a row has no Node equal. Document 01 section 12, then what it implies. */
const NOT_PORTED: ReadonlyArray<[RegExp, string]> = [
    [/^const\.py:(IntEnum|StrEnum)$/, "doc 01 s12: `as const` objects cover these"],
    [/:(TeslemetryVehicles|TessieVehicles)\.(createFleet|createSigned|createBluetooth|specific|specificSigned)$/, "doc 01 s12: these raise in Python, and calling one is a compile error here"],
    [/^tesla\/vehicle\/vehicles\.py:Vehicles\.createBluetooth$/, "doc 01 s3: on VehiclesBluetooth in ./bluetooth, so the root entry never loads Bluetooth code"],
    [/:Tessie\.find_server$/, "doc 01 s12: raises in Python"],
    [/:PowerwallEnergySite\.connect_if_needed$/, "doc 01 s12: dead code, no caller"],
    [/^tesla\/powerwall\/authorized_clients\.py:/, "doc 01 s12: one copy, in src/energyparsers.ts"],
    [/^tesla\/bluetooth\.py:(toJson|toDict)$/, "doc 01 s12: ts-proto gives Type.toJSON"],
];

/** Missing, and not in document 01 section 12. Each needs a decision. */
const NAMED_GAPS: ReadonlyArray<[RegExp, string]> = [
    [/^const\.py:LOGGER$/, "not in doc 01 s12: Node has a per-client `logger` option, no module logger"],
    [/^tesla\/vehicle\/fleet\.py:DEFAULT_LOCALE$/, "not in doc 01 s12: Node has no process locale default, and navigation_request requires `locale`"],
    [/^tesla\/vehicle\/commands\.py:Hvac/, "not in doc 01 s12: Python's lookups of proto values, internal here"],
    [/^tesla\/vehicle\/bluetooth\.py:ReassemblingBuffer\.discard_packet$/, "not in doc 01 s12: private in Node, driven only by `receive`"],
];

/** Why a row is partial on purpose. Appended to what the check found. */
const DELIBERATE: ReadonlyArray<[RegExp, string]> = [
    [/:Seat$/, "A frozen object, and the type `Seat` is a member name. It adds the corrected REAR_LEFT_BACK and the THIRD_ROW aliases"],
    [/:(is_key_rejected|is_failover_safe)$/, "Same position, different name, which a positional caller cannot see"],
    [/\.(publish_result|publish_update)$/, "`observed_at` is an options field, so the time is named"],
    [/^tariff\.py:(TariffRate|TariffResolution)$/, "camelCase fields, as `@teslemetry/api` consumes them"],
    [/^tariff\.py:get_tariff_periods$/, "`opts.timeZone` is required, because a JS Date has no zone"],
    [/^(tariff\.py:unwrap_tariff_v2|util\.py:firmware_)/, "camelCase, as first published"],
    [/:(EnergySite|EnergySites|Tesla|VehicleFleet|Vehicle|Vehicles)$/, "doc 01 s3: Node's class names stay"],
    [/:MODELS$/, "As first published"],
    [/:Tesla\.get_rsa_private_key$/, "Python's other two arguments tune `cryptography`, and mean nothing to node:crypto"],
    [/:TeslaBluetooth\.query_display_name$/, "It reads the vehicle's connected link, as there is no device object here"],
    [/:ReassemblingBuffer\.receive_data$/, "Internal to the frame reader"],
    [/:VehicleBluetooth\.vehicle_data$/, "No endpoints raises BluetoothCloudUnavailableError, so a router sends the call to the cloud"],
    [/:(CopActivationTemps|StwHeatLevels)$/, "Internal lookup tables, in Python too"],
    [/:Session\.(keys_for|hmac_personalized|aes_gcm_personalized)$/, "Internal to signing"],
    [/:Session\.commit$/, "The keys travel as one `SessionKeys`, and pinning ignores them after first contact"],
    [/:Commands\.validate_msg$/, "Takes the request's domain, because a reply's fromDestination is unauthenticated"],
    [/:Commands\.navigation_request$/, "Unused arguments keep the REST signature callable on a signed vehicle"],
    [/:Commands\.navigation_sc_request$/, "doc 01 s12: protocol 6 needs `id`. Python never sets it"],
    [/:Commands\.navigation_gps_destination_request$/, "`order` defaults to 0, replace on protocol 6"],
    [/:Commands\.fleet_telemetry_config_create$/, "Python's `Commands` raises and only VehicleSigned signs. Node's VehicleSigned overrides it too, and VehicleBluetooth's REST path raises"],
    [/:VehicleFleet\.navigation_request$/, "Not deliberate: `locale` is second and required, `type` third, and `timestamp_ms` cannot be passed"],
    [/:VehicleFleet\.remote_boombox$/, "`sound` defaults to 0"],
    [/:VehicleFleet\.(warranty_details|fleet_status)$/, "The bound class passes its own VIN. The argument form is on Vehicle"],
    [/:Vehicles\.(createSigned|specificSigned)$/, "doc 01 s3: keys are optional arguments here"],
    [/:register_client$/, "`session` is `options.fetch`"],
];

/** Differences the checks below cannot see. These rows are partial whatever else they pass. */
const UNSEEN: ReadonlyArray<[RegExp, string]> = [
    [/:VehicleFleet\.fleet_telemetry_config_create$/, "takes the inner `config` and wraps this VIN, where Python takes `{ vins, config }`. VehicleSigned takes both"],
    [/:VehicleFleet\.navigation_request$/, "`timestamp_ms` is sent as a string, an integer in Python"],
];

type PyParam = { name: string; optional: boolean };
type Route = { verb: string; path: string; params: string[] | null; json: string[] | null };
type PyRow = {
    file: string;
    cls: string | null;
    name: string;
    kind: "class" | "method" | "property" | "function" | "const";
    params: PyParam[];
    bases: string[];
    stub: boolean;
    routes: Route[];
    /** Enum members with values, or dataclass and TypedDict fields with null. */
    members: Record<string, string | number | null> | null;
    attrs: Record<string, string | number | null>;
    value: string | number | null;
};

// `-I` so a planted module in the clone cannot run. Nothing is imported from it.
const PY_WALK = String.raw`
import ast, json, pathlib, sys
root = pathlib.Path(sys.argv[1]) / "tesla_fleet_api"
FN = (ast.FunctionDef, ast.AsyncFunctionDef)
rows = []

def lit(n):
    if isinstance(n, ast.Constant) and isinstance(n.value, (str, int, float)) and not isinstance(n.value, bool):
        return n.value
    if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.USub):
        v = lit(n.operand)
        return -v if isinstance(v, (int, float)) else None
    if isinstance(n, ast.BinOp):
        l, r = lit(n.left), lit(n.right)
        if isinstance(l, (int, float)) and isinstance(r, (int, float)):
            try:
                return eval(compile(ast.Expression(ast.BinOp(ast.Constant(l), n.op, ast.Constant(r))), "", "eval"))
            except Exception:
                return None
    return None

def params(fn):
    a = fn.args
    pos = a.posonlyargs + a.args
    out = []
    first = len(pos) - len(a.defaults)
    for i, p in enumerate(pos):
        if p.arg in ("self", "cls"):
            continue
        out.append({"name": p.arg, "optional": i >= first})
    for p, d in zip(a.kwonlyargs, a.kw_defaults):
        out.append({"name": p.arg, "optional": d is not None})
    return out

def is_stub(fn):
    body = [s for s in fn.body if not (isinstance(s, ast.Expr) and isinstance(s.value, ast.Constant))]
    if len(body) != 1 or not isinstance(body[0], ast.Raise) or body[0].exc is None:
        return False
    e = body[0].exc
    name = e.func if isinstance(e, ast.Call) else e
    return isinstance(name, ast.Name) and name.id == "NotImplementedError"

def path_of(n):
    if isinstance(n, ast.Constant) and isinstance(n.value, str):
        return n.value
    if isinstance(n, ast.JoinedStr):
        return "".join(v.value if isinstance(v, ast.Constant) else "{}" for v in n.values)
    return None

def keys_of(n):
    if isinstance(n, ast.Dict) and all(isinstance(k, ast.Constant) and isinstance(k.value, str) for k in n.keys):
        return sorted(k.value for k in n.keys)
    return None

def routes(fn):
    out = []
    for c in ast.walk(fn):
        if not (isinstance(c, ast.Call) and isinstance(c.func, ast.Attribute) and c.func.attr == "_request" and len(c.args) >= 2):
            continue
        v = c.args[0]
        verb = v.attr if isinstance(v, ast.Attribute) else None
        path = path_of(c.args[1])
        if verb is None or path is None:
            continue
        kw = {k.arg: k.value for k in c.keywords if k.arg}
        p = kw.get("params", c.args[2] if len(c.args) > 2 else None)
        j = kw.get("json", c.args[3] if len(c.args) > 3 else None)
        out.append({"verb": verb, "path": path.lstrip("/"), "params": keys_of(p) if p is not None else [], "json": keys_of(j) if j is not None else []})
    return out

def base_names(c):
    return [ast.unparse(b).split("[")[0] for b in c.bases]

def is_typevar(n):
    return isinstance(n.value, ast.Call) and isinstance(n.value.func, ast.Name) and n.value.func.id in ("TypeVar", "ParamSpec")

for p in sorted(root.rglob("*.py")):
    if "proto" in p.parts:
        continue
    rel = str(p.relative_to(root))
    for n in ast.parse(p.read_text()).body:
        base = {"file": rel, "cls": None, "params": [], "bases": [], "stub": False, "routes": [], "members": None, "attrs": {}, "value": None}
        if isinstance(n, ast.ClassDef) and not n.name.startswith("_"):
            bases = base_names(n)
            members, attrs = {}, {}
            for s in n.body:
                if isinstance(s, ast.Assign) and len(s.targets) == 1 and isinstance(s.targets[0], ast.Name):
                    members[s.targets[0].id] = lit(s.value)
                    attrs[s.targets[0].id] = lit(s.value)
                elif isinstance(s, ast.AnnAssign) and isinstance(s.target, ast.Name):
                    members[s.target.id] = None
                    if s.value is not None:
                        attrs[s.target.id] = lit(s.value)
            rows.append({**base, "name": n.name, "kind": "class", "bases": bases, "members": members, "attrs": attrs})
            for m in n.body:
                if isinstance(m, FN) and not m.name.startswith("_"):
                    deco = [ast.unparse(d) for d in m.decorator_list]
                    prop = any(d == "property" or d.endswith(".setter") for d in deco)
                    if any(d.endswith(".setter") for d in deco):
                        continue
                    rows.append({**base, "cls": n.name, "name": m.name, "kind": "property" if prop else "method", "params": params(m), "stub": is_stub(m), "routes": routes(m)})
        elif isinstance(n, FN) and not n.name.startswith("_"):
            rows.append({**base, "name": n.name, "kind": "function", "params": params(n), "stub": is_stub(n)})
        elif isinstance(n, (ast.Assign, ast.AnnAssign)):
            if n.value is None or is_typevar(n):
                continue
            for t in (n.targets if isinstance(n, ast.Assign) else [n.target]):
                if isinstance(t, ast.Name) and not t.id.startswith("_"):
                    rows.append({**base, "name": t.id, "kind": "const", "value": lit(n.value)})
print(json.dumps(rows))
`;

type NodeParam = { name: string; optional: boolean; options: boolean };
type NodeMember = {
    name: string;
    kind: "method" | "property";
    params: NodeParam[];
    node: ts.MethodDeclaration | null;
    own: boolean;
    abstract: boolean;
    from: string;
};
type NodeClass = { name: string; file: string; base: string | null; members: Map<string, NodeMember>; statics: Record<string, string | number | null> };
type NodeShape = {
    classes: Map<string, NodeClass>;
    /** Top-level declarations: functions with parameters, object literals with members. */
    decls: Map<string, { file: string; params: NodeParam[] | null; members: Record<string, string | number | null> | null; value: string | number | null; kind: string }>;
    exported: Map<string, string>;
    gated: Set<string>;
};

function nodeLiteral(e: ts.Expression | undefined): string | number | null {
    if (e === undefined) return null;
    if (ts.isAsExpression(e) || ts.isParenthesizedExpression(e) || ts.isSatisfiesExpression(e)) return nodeLiteral(e.expression);
    if (ts.isStringLiteralLike(e)) return e.text;
    if (ts.isNumericLiteral(e)) return Number(e.text);
    if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken) {
        const v = nodeLiteral(e.operand);
        return typeof v === "number" ? -v : null;
    }
    if (ts.isBinaryExpression(e)) {
        const [l, r] = [nodeLiteral(e.left), nodeLiteral(e.right)];
        if (typeof l === "number" && typeof r === "number") {
            if (e.operatorToken.kind === ts.SyntaxKind.AsteriskToken) return l * r;
            if (e.operatorToken.kind === ts.SyntaxKind.PlusToken) return l + r;
        }
    }
    return null;
}

/** The object literal behind `Object.freeze({...} as const)`, or a plain one. */
function objectLiteral(e: ts.Expression | undefined): ts.ObjectLiteralExpression | null {
    if (e === undefined) return null;
    if (ts.isAsExpression(e) || ts.isParenthesizedExpression(e) || ts.isSatisfiesExpression(e)) return objectLiteral(e.expression);
    if (ts.isObjectLiteralExpression(e)) return e;
    if (ts.isCallExpression(e) && e.arguments.length === 1) return objectLiteral(e.arguments[0]);
    return null;
}

function nodeParams(fn: ts.SignatureDeclaration): NodeParam[] {
    return fn.parameters
        .filter((p) => !(ts.isIdentifier(p.name) && p.name.text === "this"))
        .map((p) => {
            const name = ts.isIdentifier(p.name) ? p.name.text : "{...}";
            const typeText = p.type?.getText() ?? "";
            const options = !ts.isIdentifier(p.name) || /^(options|opts)$/.test(name) || /Options\b/.test(typeText) || ts.isTypeLiteralNode(p.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
            return { name, optional: p.questionToken !== undefined || p.initializer !== undefined || p.dotDotDotToken !== undefined, options };
        });
}

const hasModifier = (n: ts.Node, kind: ts.SyntaxKind): boolean =>
    ts.canHaveModifiers(n) && (ts.getModifiers(n) ?? []).some((m) => m.kind === kind);

function walkFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walkFiles(join(dir, e.name)) : e.name.endsWith(".ts") ? [join(dir, e.name)] : [],
    );
}

function readNode(): NodeShape {
    const files = walkFiles(SRC);
    const config = ts.getParsedCommandLineOfConfigFile(join(REPO, "tsconfig.json"), {}, {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (d) => {
            throw new Error(String(d.messageText));
        },
    });
    if (config === undefined) throw new Error("tsconfig.json did not parse");
    const program = ts.createProgram(files, { ...config.options, noEmit: true });
    const checker = program.getTypeChecker();
    const classes = new Map<string, NodeClass>();
    const decls: NodeShape["decls"] = new Map();

    for (const file of files) {
        const sf = program.getSourceFile(file);
        if (sf === undefined) continue;
        const rel = relative(REPO, file);
        for (const stmt of sf.statements) {
            if (ts.isClassDeclaration(stmt) && stmt.name) {
                const heritage = stmt.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
                const base = heritage ? heritage.expression.getText(sf).split("<")[0]! : null;
                const members = new Map<string, NodeMember>();
                const statics: NodeClass["statics"] = {};
                for (const m of stmt.members) {
                    if (m.name === undefined || !(ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))) continue;
                    const mname = m.name.text;
                    if (hasModifier(m, ts.SyntaxKind.PrivateKeyword)) continue;
                    if (ts.isPropertyDeclaration(m) && hasModifier(m, ts.SyntaxKind.StaticKeyword)) statics[mname] = nodeLiteral(m.initializer);
                    const abstract = hasModifier(m, ts.SyntaxKind.AbstractKeyword);
                    if (ts.isMethodDeclaration(m)) {
                        if (members.get(mname)?.node) continue;
                        members.set(mname, { name: mname, kind: "method", params: nodeParams(m), node: m, own: true, abstract, from: stmt.name.text });
                    } else if (ts.isGetAccessor(m) || ts.isPropertyDeclaration(m)) {
                        const typed = ts.isPropertyDeclaration(m) && m.initializer !== undefined && ts.isArrowFunction(m.initializer);
                        members.set(mname, { name: mname, kind: typed ? "method" : "property", params: [], node: null, own: true, abstract, from: stmt.name.text });
                    }
                }
                classes.set(stmt.name.text, { name: stmt.name.text, file: rel, base, members, statics });
            } else if (ts.isFunctionDeclaration(stmt) && stmt.name) {
                decls.set(stmt.name.text, { file: rel, params: nodeParams(stmt), members: null, value: null, kind: "function" });
            } else if (ts.isVariableStatement(stmt)) {
                for (const d of stmt.declarationList.declarations) {
                    if (!ts.isIdentifier(d.name)) continue;
                    const lit = objectLiteral(d.initializer);
                    let members: Record<string, string | number | null> | null = null;
                    if (lit) {
                        members = {};
                        for (const p of lit.properties) {
                            if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name))) {
                                members[p.name.text] = nodeLiteral(p.initializer);
                            }
                        }
                    }
                    decls.set(d.name.text, { file: rel, params: null, members, value: nodeLiteral(d.initializer), kind: "const" });
                }
            } else if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) {
                const lit = ts.isInterfaceDeclaration(stmt) ? stmt : ts.isTypeLiteralNode(stmt.type) ? stmt.type : null;
                let members: Record<string, null> | null = null;
                if (lit) {
                    members = {};
                    for (const m of lit.members) {
                        if (m.name && (ts.isIdentifier(m.name) || ts.isStringLiteralLike(m.name))) members[m.name.text] = null;
                    }
                }
                const prior = decls.get(stmt.name.text);
                if (prior === undefined) decls.set(stmt.name.text, { file: rel, params: null, members, value: null, kind: "type" });
            }
        }
    }

    // What each entry exports, under its declared name and its exported name.
    const exportsOf = (entry: string, prefix: string, sink: (name: string) => void): void => {
        const sf = program.getSourceFile(join(REPO, entry));
        const mod = sf && checker.getSymbolAtLocation(sf);
        if (mod === undefined) throw new Error(`no module for ${entry}`);
        const visit = (sym: ts.Symbol, pre: string): void => {
            for (const e of checker.getExportsOfModule(sym)) {
                const real = e.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(e) : e;
                sink(pre + e.name);
                if (real.flags & ts.SymbolFlags.ValueModule) visit(real, `${pre}${e.name}.`);
                const decl = real.declarations?.[0];
                const declared = decl && (ts.isClassDeclaration(decl) || ts.isFunctionDeclaration(decl)) ? decl.name?.text : undefined;
                if (declared) sink(pre + declared);
            }
        };
        visit(mod, prefix);
    };
    const exported = new Map<string, string>();
    for (const [path, entry] of Object.entries(ENTRIES)) {
        exportsOf(entry, "", (n) => {
            if (!exported.has(n)) exported.set(n, path);
        });
    }
    const gated = new Set<string>();
    exportsOf(GATED_ENTRY, "", (n) => gated.add(n));

    // Pull inherited members down, so a lookup sees the whole chain.
    const resolved = new Set<string>();
    const fill = (c: NodeClass): void => {
        if (resolved.has(c.name)) return;
        resolved.add(c.name);
        const parent = c.base ? classes.get(c.base) : undefined;
        if (!parent) return;
        fill(parent);
        for (const [k, v] of parent.members) if (!c.members.has(k)) c.members.set(k, { ...v, own: false });
    };
    for (const c of classes.values()) fill(c);

    return { classes, decls, exported, gated };
}

type Status = "present" | "partial" | "missing";
type Result = { id: string; area: string; status: Status; note: string; verified: string[] };

function areaOf(r: PyRow): string {
    const f = r.file;
    if (f === "exceptions.py") return "Exceptions";
    if (f.startsWith("tesla/powerwall/")) return "Local Powerwall";
    if (f === "tesla/vehicle/bluetooth.py" || f === "tesla/vehicle/broadcast.py" || f === "tesla/bluetooth.py") return "Bluetooth";
    if (f.startsWith("router/") || f === "funnel.py" || f === "tesla/vehicle/stream_glue.py") return "Routers, merge, funnel, glue";
    if (f === "teslemetry/energysite.py") return "TeslemetryEnergySite";
    if (f.startsWith("teslemetry/")) return "Teslemetry, TeslemetryVehicle";
    if (f.startsWith("tessie/")) return "Tessie, TessieVehicle";
    if (f === "tesla/energysite.py" || f === "tesla/energy_signing.py") return "Energy site, signed energy";
    if (f === "tesla/vehicle/fleet.py" && r.cls === "VehicleFleet") return "VehicleFleet REST";
    if (f === "tesla/vehicle/commands.py" && r.cls === "Commands") return "Commands signed";
    if (f === "const.py" || f === "util.py" || f === "tariff.py") return "Constants, tariff, util";
    return "Core: Tesla, OAuth, JWS, session, factories";
}

const AREAS = [
    "VehicleFleet REST",
    "Commands signed",
    "Energy site, signed energy",
    "TeslemetryEnergySite",
    "Teslemetry, TeslemetryVehicle",
    "Tessie, TessieVehicle",
    "Routers, merge, funnel, glue",
    "Bluetooth",
    "Local Powerwall",
    "Core: Tesla, OAuth, JWS, session, factories",
    "Constants, tariff, util",
    "Exceptions",
];

const squash = (s: string): string => s.replace(/_/g, "").toLowerCase();
const showPy = (ps: PyParam[]): string => ps.map((p) => p.name + (p.optional ? "?" : "")).join(", ");
const unseen = (id: string): string[] => UNSEEN.filter(([re]) => re.test(id)).map(([, why]) => why);
const showNode = (ps: NodeParam[]): string => ps.map((p) => p.name + (p.optional ? "?" : "")).join(", ");

function compareParams(py: PyParam[], node: NodeParam[]): string | null {
    if (showPy(py) === showNode(node)) return null;
    const last = node[node.length - 1];
    if (last?.options) {
        const positional = node.slice(0, -1);
        const covered = positional.every((p, i) => py[i] !== undefined && squash(py[i]!.name) === squash(p.name));
        const extra = py.length - positional.length;
        if (covered && extra >= 2) return `keyword arguments become an options object: (${showPy(py)}) vs (${showNode(node)})`;
    }
    if (py.length === node.length && py.every((p, i) => squash(p.name) === squash(node[i]!.name) && p.optional === node[i]!.optional)) return null;
    if (py.length === node.length && py.every((p, i) => p.optional === node[i]!.optional)) return `parameter names: (${showPy(py)}) vs (${showNode(node)})`;
    if (py.length === node.length) return `optional differs: (${showPy(py)}) vs (${showNode(node)})`;
    return `parameters: (${showPy(py)}) vs (${showNode(node)})`;
}

/** The `_request` calls a Node method makes, following one `this.parent.x(...)`. */
function nodeRoutes(shape: NodeShape, m: NodeMember, seen = new Set<string>()): Route[] {
    if (m.node === null || seen.has(`${m.from}.${m.name}`)) return [];
    seen.add(`${m.from}.${m.name}`);
    const out: Route[] = [];
    const keys = (a: ts.Expression | undefined): string[] | null => {
        if (a === undefined) return [];
        if (a.kind === ts.SyntaxKind.NullKeyword || a.kind === ts.SyntaxKind.UndefinedKeyword) return [];
        if (ts.isIdentifier(a) && a.text === "undefined") return [];
        if (!ts.isObjectLiteralExpression(a)) return null;
        const names: string[] = [];
        for (const p of a.properties) {
            if (ts.isSpreadAssignment(p) || p.name === undefined) return null;
            if (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) names.push(p.name.text);
            else return null;
        }
        return names.sort();
    };
    const pathText = (a: ts.Expression): string | null => {
        if (ts.isStringLiteralLike(a)) return a.text;
        if (ts.isTemplateExpression(a)) return a.head.text + a.templateSpans.map((s) => `{}${s.literal.text}`).join("");
        return null;
    };
    const visit = (n: ts.Node): void => {
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
            const called = n.expression.name.text;
            const target = n.expression.expression.getText();
            const verb = n.arguments[0];
            if (called === "_request" && verb && ts.isStringLiteralLike(verb) && n.arguments[1]) {
                const path = pathText(n.arguments[1]);
                if (path !== null) out.push({ verb: verb.text, path: path.replace(/^\//, ""), params: keys(n.arguments[2]), json: keys(n.arguments[3]) });
            } else if ((target === "this.parent" || target === "this._parent") && m.from === "VehicleSpecific") {
                const up = shape.classes.get("Vehicle")?.members.get(called);
                if (up) out.push(...nodeRoutes(shape, up, seen));
            } else if ((target === "this.parent" || target === "this._parent") && m.from === "EnergySpecific") {
                const up = shape.classes.get("Energy")?.members.get(called);
                if (up) out.push(...nodeRoutes(shape, up, seen));
            }
        }
        ts.forEachChild(n, visit);
    };
    visit(m.node);
    return out;
}

function compareRoutes(py: Route[], node: Route[]): { diff: string | null; checked: boolean } {
    if (py.length === 0 || node.length === 0) return { diff: null, checked: false };
    const shape = (r: Route): string => `${r.verb} ${r.path.replace(/\{[^}]*\}/g, "{}")}`;
    const [a, b] = [new Set(py.map(shape)), new Set(node.map(shape))];
    const missing = [...a].filter((x) => !b.has(x));
    const extra = [...b].filter((x) => !a.has(x));
    if (missing.length || extra.length) return { diff: `route: python ${[...a].join(" | ")} vs node ${[...b].join(" | ")}`, checked: true };
    for (const r of py) {
        const n = node.find((x) => shape(x) === shape(r));
        for (const part of ["json", "params"] as const) {
            const [pk, nk] = [r[part], n?.[part]];
            if (pk && nk && pk.join() !== nk.join()) return { diff: `${part} keys: python {${pk.join(", ")}} vs node {${nk.join(", ")}}`, checked: true };
        }
    }
    return { diff: null, checked: true };
}

function compareMembers(py: Record<string, string | number | null>, node: Record<string, string | number | null>, what: string): string | null {
    const lacks = Object.keys(py).filter((k) => !(k in node));
    const extra = Object.keys(node).filter((k) => !(k in py));
    if (lacks.length) return `${what} lacks ${lacks.join(", ")}`;
    const wrong = Object.keys(py).filter((k) => py[k] !== null && node[k] !== null && py[k] !== node[k]);
    if (wrong.length) return `${what} values differ: ${wrong.map((k) => `${k} ${py[k]} vs ${node[k]}`).join(", ")}`;
    if (extra.length) return `${what} adds ${extra.join(", ")}`;
    return null;
}

function reach(shape: NodeShape, name: string): { ok: boolean; note: string | null } {
    if (shape.exported.has(name)) return { ok: true, note: null };
    const file = shape.classes.get(name)?.file ?? shape.decls.get(name)?.file ?? "";
    if (shape.gated.has(name) || file.startsWith(GATED_SOURCE)) return { ok: false, note: GATED_REASON };
    return { ok: false, note: "declared, but not exported from any entry" };
}

function classify(r: PyRow, shape: NodeShape, pyClasses: Map<string, PyRow>): Result {
    const id = `${r.file}:${r.cls ? `${r.cls}.` : ""}${r.name}`;
    const out: Result = { id, area: areaOf(r), status: "missing", note: "", verified: [] };
    const notPorted = (): string | null => NOT_PORTED.find(([re]) => re.test(id))?.[1] ?? null;
    const named = (): string | null => NAMED_GAPS.find(([re]) => re.test(id))?.[1] ?? null;
    const partial = (note: string): Result => {
        const why = DELIBERATE.find(([re]) => re.test(id))?.[1];
        return { ...out, status: "partial", note: why ? `${note}. ${why}` : note };
    };
    const missing = (note: string): Result => ({ ...out, status: "missing", note: notPorted() ?? named() ?? `unresolved: ${note}` });
    const present = (): Result => ({ ...out, status: "present" });

    if (r.cls !== null) {
        if (notPorted()) return missing("");
        const pyParent = pyClasses.get(`${r.file}:${r.cls}`);
        const moved = MEMBER_MAP[`${r.cls}.${r.name}`]?.split(".");
        const nodeName = moved?.[0] ?? CLASS_MAP[r.cls] ?? r.cls;
        const c = shape.classes.get(nodeName);
        if (c === undefined) {
            const d = shape.decls.get(nodeName);
            if (d === undefined) return missing(`no class ${nodeName}`);
            if (pyParent?.bases.some((b) => /Protocol/.test(b))) {
                return reach(shape, nodeName).ok ? present() : partial(reach(shape, nodeName).note!);
            }
            return missing(`${nodeName} is not a class here`);
        }
        const wanted = moved?.[1] ?? r.name;
        const m = c.members.get(wanted);
        if (m === undefined) {
            if (r.stub && r.cls === "PowerwallEnergySite") return { ...out, note: "doc 01 s12: raises NotImplementedError in Python, and a router skips what is absent" };
            return missing(`no ${wanted} on ${nodeName}`);
        }
        const reachable = reach(shape, nodeName);
        const problems: string[] = [];
        if (!reachable.ok) problems.push(reachable.note!);
        if (moved && moved[0] !== (CLASS_MAP[r.cls] ?? r.cls)) problems.push(`on ${moved[0]}`);
        if (MUST_OVERRIDE.has(r.cls) && !m.own) problems.push(`inherited from ${m.from}, not overridden`);
        if (m.abstract) problems.push(`abstract on ${m.from}`);
        if (r.kind === "property" && m.kind === "method") problems.push("a method here, a property in Python");
        if (r.kind === "method" && m.kind === "property") problems.push("a property here, a method in Python");
        if (r.kind !== "property" && m.kind === "method") {
            const sig = compareParams(r.params, m.params);
            if (sig) problems.push(sig);
        }
        const routes = compareRoutes(r.routes, nodeRoutes(shape, m));
        if (routes.diff) problems.push(routes.diff);
        if (routes.checked) out.verified.push("route");
        if (wanted !== r.name) problems.push(`named ${wanted}`);
        problems.push(...unseen(id));
        return problems.length ? partial(problems.join("; ")) : present();
    }

    if (r.kind === "class") {
        if (notPorted()) return missing("");
        const nodeName = CLASS_MAP[`${r.file}:${r.name}`] ?? CLASS_MAP[r.name] ?? r.name;
        const c = shape.classes.get(nodeName);
        const d = shape.decls.get(nodeName);
        if (c === undefined && d === undefined) return missing(`no ${nodeName}`);
        const problems: string[] = [];
        const reachable = reach(shape, nodeName);
        if (!reachable.ok) problems.push(reachable.note!);
        if (nodeName !== r.name) problems.push(`named ${nodeName}`);
        if (r.file === "exceptions.py" || r.file === "tesla/powerwall/exceptions.py") {
            const parent = r.bases[0] === "Exception" || r.bases[0] === "BaseException" ? "Error" : r.bases[0];
            if (c === undefined) return missing(`${r.name} is not a class`);
            if (c.base !== parent) problems.push(`parent ${c.base} vs Python ${parent}`);
            for (const key of ["message", "key", "status", "code"]) {
                const py = r.attrs[key];
                if (py === undefined || py === null) continue;
                if (c.statics[key] !== py) problems.push(`${key} differs`);
            }
            if (!problems.length) out.verified.push("attributes");
        } else if (r.bases.some((b) => /Enum$/.test(b))) {
            if (d?.members) {
                const diff = compareMembers(r.members ?? {}, d.members, "enum");
                if (diff) problems.push(diff);
                else out.verified.push("members");
            } else problems.push(`${nodeName} has no literal members to compare`);
        } else if (r.members && Object.keys(r.members).length && d?.members) {
            const diff = compareMembers(r.members, d.members, "fields");
            if (diff) problems.push(diff);
        }
        return problems.length ? partial(problems.join("; ")) : present();
    }

    if (notPorted()) return missing("");
    const nodeName = NAME_MAP[`${r.file}:${r.name}`] ?? NAME_MAP[r.name] ?? r.name;
    const scoped = r.file === "tesla/jws.py" ? `jws.${nodeName}` : nodeName;
    const d = shape.decls.get(nodeName);
    const asClass = shape.classes.get(nodeName);
    if (d === undefined && asClass === undefined) return missing(`no ${nodeName}`);
    const problems: string[] = [];
    const reachable = reach(shape, scoped);
    if (!reachable.ok) problems.push(reachable.note!);
    if (nodeName !== r.name) problems.push(`named ${nodeName}`);
    if (r.kind === "function" && d?.params) {
        const sig = compareParams(r.params, d.params);
        if (sig) problems.push(sig);
    }
    if (r.kind === "const" && typeof r.value === "number" && typeof d?.value === "number" && r.value * 1000 === d.value) {
        problems.push(`milliseconds here, seconds in Python: ${r.value} s vs ${d.value} ms`);
    } else if (r.kind === "const" && r.value !== null && d?.value !== null && d?.value !== undefined && r.value !== d.value) {
        problems.push(`value ${r.value} vs ${d.value}`);
    }
    return problems.length ? partial(problems.join("; ")) : present();
}

function main(): void {
    const args = process.argv.slice(2);
    const flag = (name: string): string | undefined => {
        const i = args.indexOf(name);
        return i >= 0 ? args[i + 1] : undefined;
    };
    const clone = flag("--python") ?? process.env.PYTHON_TESLA_FLEET_API;
    if (!clone) {
        console.error("usage: pnpm parity --python <clone> [--rows present|partial|missing|all] [--json]");
        process.exit(2);
    }
    const py = spawnSync("python3", ["-I", "-c", PY_WALK, resolve(clone)], { encoding: "utf8", maxBuffer: 1 << 28 });
    if (py.status !== 0) throw new Error(`python3 failed: ${py.stderr}`);
    const rows = JSON.parse(py.stdout) as PyRow[];
    if (rows.length === 0) throw new Error(`no Python rows under ${clone}`);
    const version = /^__version__ = "(.+)"$/m.exec(readFileSync(join(clone, "tesla_fleet_api/__init__.py"), "utf8"))?.[1];
    const shape = readNode();
    const pyClasses = new Map(rows.filter((r) => r.kind === "class").map((r) => [`${r.file}:${r.name}`, r]));
    const results = rows.map((r) => classify(r, shape, pyClasses));

    if (args.includes("--json")) {
        console.log(JSON.stringify(results, null, 2));
        return;
    }
    const count = (rs: Result[], s: Status): number => rs.filter((r) => r.status === s).length;
    const line = (cells: (string | number)[]): string => `| ${cells.join(" | ")} |`;
    console.log(`Python ${version}, ${results.length} rows. Node ${JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")).version}.\n`);
    console.log(line(["Area", "Rows", "Present", "Partial", "Missing"]));
    console.log(line(["--", "--", "--", "--", "--"]));
    for (const area of AREAS) {
        const rs = results.filter((r) => r.area === area);
        console.log(line([area, rs.length, count(rs, "present"), count(rs, "partial"), count(rs, "missing")]));
    }
    console.log(line(["Total", results.length, count(results, "present"), count(results, "partial"), count(results, "missing")]));
    const gated = results.filter((r) => r.note.includes(GATED_REASON));
    const unblocked = gated.filter((r) => r.note === GATED_REASON).length;
    console.log(`\nLocal Powerwall: ${gated.length} partial rows are gated on PW-17, and ${unblocked} of them have no other difference.`);
    const unresolved = results.filter((r) => r.status === "missing" && r.note.startsWith("unresolved")).length;
    const listed = results.filter((r) => r.status === "missing" && r.note.startsWith("doc 01")).length;
    console.log(`Missing: ${listed} listed in doc 01, ${count(results, "missing") - listed - unresolved} named here, ${unresolved} unresolved.`);
    console.log(`Routes compared: ${results.filter((r) => r.verified.includes("route")).length}. Error attributes compared: ${results.filter((r) => r.verified.includes("attributes")).length}. Enum members compared: ${results.filter((r) => r.verified.includes("members")).length}.`);

    const which = flag("--rows");
    for (const status of ["missing", "partial", "present"] as const) {
        if (status === "present" && which !== "present" && which !== "all") continue;
        if (which && which !== "all" && which !== status) continue;
        console.log(`\n## ${status}\n`);
        for (const r of results.filter((x) => x.status === status)) console.log(`- ${r.id}${r.note ? `: ${r.note}` : ""}`);
    }
}

main();
