"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshPaths = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const resolve_wp_1 = __importDefault(require("./resolve-wp"));
const vite_1 = require("vite");
const vite_plugin_full_reload_1 = __importDefault(require("vite-plugin-full-reload"));
let exitHandlersBound = false;
exports.refreshPaths = [
    "app/View/Components/**",
    "resources/views/**",
    "routes/**",
];
/**
 * gutenberg plugin for Vite.
 *
 * @param config - A config object or relative path(s) of the scripts to be compiled.
 */
function gutenberg(config) {
    const pluginConfig = resolvePluginConfig(config);
    return [
        resolvegutenbergPlugin(pluginConfig),
        ...resolveFullReloadConfig(pluginConfig),
    ];
}
exports.default = gutenberg;
/**
 * Resolve the gutenberg Plugin configuration.
 */
function resolvegutenbergPlugin(pluginConfig) {
    let viteDevServerUrl;
    let resolvedConfig;
    const defaultAliases = {
        "@": "/src/js",
    };
    return {
        name: "gutenberg",
        enforce: "post",
        options: resolve_wp_1.default.options,
        outputOptions: resolve_wp_1.default.outputOptions,
        config: (userConfig, { command, mode }) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            const ssr = !!((_a = userConfig.build) === null || _a === void 0 ? void 0 : _a.ssr);
            const env = (0, vite_1.loadEnv)(mode, userConfig.envDir || process.cwd(), "");
            const assetUrl = (_b = env.ASSET_URL) !== null && _b !== void 0 ? _b : "";
            return {
                base: command === "build"
                    ? resolveBase(pluginConfig, assetUrl)
                    : "",
                publicDir: false,
                build: {
                    manifest: !ssr,
                    outDir: (_d = (_c = userConfig.build) === null || _c === void 0 ? void 0 : _c.outDir) !== null && _d !== void 0 ? _d : resolveOutDir(pluginConfig, ssr),
                    rollupOptions: {
                        input: (_g = (_f = (_e = userConfig.build) === null || _e === void 0 ? void 0 : _e.rollupOptions) === null || _f === void 0 ? void 0 : _f.input) !== null && _g !== void 0 ? _g : resolveInput(pluginConfig, ssr),
                        output: {
                            format: 'iife',
                        },
                    },
                },
                server: {
                    origin: "__gutenberg_vite_placeholder__",
                    ...(process.env.gutenberg_SAIL
                        ? {
                            host: (_j = (_h = userConfig.server) === null || _h === void 0 ? void 0 : _h.host) !== null && _j !== void 0 ? _j : "0.0.0.0",
                            port: (_l = (_k = userConfig.server) === null || _k === void 0 ? void 0 : _k.port) !== null && _l !== void 0 ? _l : (env.VITE_PORT
                                ? parseInt(env.VITE_PORT)
                                : 5173),
                            strictPort: (_o = (_m = userConfig.server) === null || _m === void 0 ? void 0 : _m.strictPort) !== null && _o !== void 0 ? _o : true,
                        }
                        : undefined),
                },
                resolve: {
                    alias: Array.isArray((_p = userConfig.resolve) === null || _p === void 0 ? void 0 : _p.alias)
                        ? [
                            ...((_r = (_q = userConfig.resolve) === null || _q === void 0 ? void 0 : _q.alias) !== null && _r !== void 0 ? _r : []),
                            ...Object.keys(defaultAliases).map((alias) => ({
                                find: alias,
                                replacement: defaultAliases[alias],
                            })),
                        ]
                        : {
                            ...defaultAliases,
                            ...(_s = userConfig.resolve) === null || _s === void 0 ? void 0 : _s.alias,
                        },
                },
                ssr: {
                    noExternal: noExternalInertiaHelpers(userConfig),
                },
            };
        },
        configResolved(config) {
            resolvedConfig = config;
        },
        transform(code) {
            if (resolvedConfig.command === "serve") {
                return code.replace(/__gutenberg_vite_placeholder__/g, viteDevServerUrl);
            }
        },
        configureServer(server) {
            var _a, _b;
            const envDir = resolvedConfig.envDir || process.cwd();
            const appUrl = (_a = (0, vite_1.loadEnv)(resolvedConfig.mode, envDir, "APP_URL").APP_URL) !== null && _a !== void 0 ? _a : "localhost:8888";
            (_b = server.httpServer) === null || _b === void 0 ? void 0 : _b.once("listening", () => {
                var _a;
                const address = (_a = server.httpServer) === null || _a === void 0 ? void 0 : _a.address();
                const isAddressInfo = (x) => typeof x === "object";
                if (isAddressInfo(address)) {
                    viteDevServerUrl = resolveDevServerUrl(address, server.config);
                    fs_1.default.writeFileSync(pluginConfig.hotFile, viteDevServerUrl);
                    setTimeout(() => {
                        // server.config.logger.info(`\n  ${colors.red(`${colors.bold('gutenberg')} ${gutenbergVersion()}`)}  ${colors.dim('plugin')} ${colors.bold(`v${pluginVersion()}`)}`)
                        server.config.logger.info("");
                        server.config.logger.info(`  ${picocolors_1.default.green("➜")}  ${picocolors_1.default.bold("APP_URL")}: ${picocolors_1.default.cyan(appUrl.replace(/:(\d+)/, (_, port) => `:${picocolors_1.default.bold(port)}`))}`);
                    }, 100);
                }
            });
            if (exitHandlersBound) {
                return;
            }
            const clean = () => {
                if (fs_1.default.existsSync(pluginConfig.hotFile)) {
                    fs_1.default.rmSync(pluginConfig.hotFile);
                }
            };
            process.on("exit", clean);
            process.on("SIGINT", process.exit);
            process.on("SIGTERM", process.exit);
            process.on("SIGHUP", process.exit);
            exitHandlersBound = true;
            return () => server.middlewares.use((req, res, next) => {
                if (req.url === "/index.html") {
                    res.statusCode = 404;
                    res.end(fs_1.default
                        .readFileSync(path_1.default.join(__dirname, "dev-server-index.html"))
                        .toString()
                        .replace(/{{ APP_URL }}/g, appUrl));
                }
                next();
            });
        },
    };
}
/**
 * Convert the users configuration into a standard structure with defaults.
 */
function resolvePluginConfig(config) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (typeof config === "undefined") {
        throw new Error("gutenberg-vite-plugin: missing configuration.");
    }
    if (typeof config === "string" || Array.isArray(config)) {
        config = { input: config, ssr: config };
    }
    if (typeof config.input === "undefined") {
        throw new Error('gutenberg-vite-plugin: missing configuration for "input".');
    }
    if (typeof config.publicDirectory === "string") {
        config.publicDirectory = config.publicDirectory
            .trim()
            .replace(/^\/+/, "");
        if (config.publicDirectory === "") {
            throw new Error("gutenberg-vite-plugin: publicDirectory must be a subdirectory. E.g. 'public'.");
        }
    }
    if (typeof config.buildDirectory === "string") {
        config.buildDirectory = config.buildDirectory
            .trim()
            .replace(/^\/+/, "")
            .replace(/\/+$/, "");
        if (config.buildDirectory === "") {
            throw new Error("gutenberg-vite-plugin: buildDirectory must be a subdirectory. E.g. 'build'.");
        }
    }
    if (typeof config.ssrOutputDirectory === "string") {
        config.ssrOutputDirectory = config.ssrOutputDirectory
            .trim()
            .replace(/^\/+/, "")
            .replace(/\/+$/, "");
    }
    if (config.refresh === true) {
        config.refresh = [{ paths: exports.refreshPaths }];
    }
    return {
        input: config.input,
        publicDirectory: (_a = config.publicDirectory) !== null && _a !== void 0 ? _a : "static",
        buildDirectory: (_b = config.buildDirectory) !== null && _b !== void 0 ? _b : "build",
        ssr: (_c = config.ssr) !== null && _c !== void 0 ? _c : config.input,
        ssrOutputDirectory: (_d = config.ssrOutputDirectory) !== null && _d !== void 0 ? _d : "bootstrap/ssr",
        refresh: (_e = config.refresh) !== null && _e !== void 0 ? _e : false,
        hotFile: (_f = config.hotFile) !== null && _f !== void 0 ? _f : path_1.default.join((_g = config.publicDirectory) !== null && _g !== void 0 ? _g : "static", "hot"),
    };
}
/**
 * Resolve the Vite base option from the configuration.
 */
function resolveBase(config, assetUrl) {
    return (assetUrl + (!assetUrl.endsWith("/") ? "/" : "") + config.buildDirectory + "/");
}
/**
 * Resolve the Vite input path from the configuration.
 */
function resolveInput(config, ssr) {
    if (ssr) {
        return config.ssr;
    }
    return config.input;
}
/**
 * Resolve the Vite outDir path from the configuration.
 */
function resolveOutDir(config, ssr) {
    if (ssr) {
        return config.ssrOutputDirectory;
    }
    return path_1.default.join(config.publicDirectory, config.buildDirectory);
}
function resolveFullReloadConfig({ refresh: config, }) {
    if (typeof config === "boolean") {
        return [];
    }
    if (typeof config === "string") {
        config = [{ paths: [config] }];
    }
    if (!Array.isArray(config)) {
        config = [config];
    }
    if (config.some((c) => typeof c === "string")) {
        config = [{ paths: config }];
    }
    return config.flatMap((c) => {
        const plugin = (0, vite_plugin_full_reload_1.default)(c.paths, c.config);
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /** @ts-ignore */
        plugin.__gutenberg_plugin_config = c;
        return plugin;
    });
}
/**
 * Resolve the dev server URL from the server address and configuration.
 */
function resolveDevServerUrl(address, config) {
    var _a;
    const configHmrProtocol = typeof config.server.hmr === "object"
        ? config.server.hmr.protocol
        : null;
    const clientProtocol = configHmrProtocol
        ? configHmrProtocol === "wss"
            ? "https"
            : "http"
        : null;
    const serverProtocol = config.server.https ? "https" : "http";
    const protocol = clientProtocol !== null && clientProtocol !== void 0 ? clientProtocol : serverProtocol;
    const configHmrHost = typeof config.server.hmr === "object" ? config.server.hmr.host : null;
    const configHost = typeof config.server.host === "string" ? config.server.host : null;
    const serverAddress = isIpv6(address)
        ? `[${address.address}]`
        : address.address;
    const host = (_a = configHmrHost !== null && configHmrHost !== void 0 ? configHmrHost : configHost) !== null && _a !== void 0 ? _a : serverAddress;
    const configHmrClientPort = typeof config.server.hmr === "object"
        ? config.server.hmr.clientPort
        : null;
    const port = configHmrClientPort !== null && configHmrClientPort !== void 0 ? configHmrClientPort : address.port;
    return `${protocol}://${host}:${port}`;
}
function isIpv6(address) {
    return (address.family === "IPv6" ||
        // In node >=18.0 <18.4 this was an integer value. This was changed in a minor version.
        // See: https://github.com/asolopovas/vite-gutenberg/issues/103
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        address.family === 6);
}
/**
 * Add the Inertia helpers to the list of SSR dependencies that aren't externalized.
 *
 * @see https://vitejs.dev/guide/ssr.html#ssr-externals
 */
function noExternalInertiaHelpers(config) {
    var _a;
    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    /* @ts-ignore */
    const userNoExternal = (_a = config.ssr) === null || _a === void 0 ? void 0 : _a.noExternal;
    const pluginNoExternal = ["gutenberg-vite-plugin"];
    if (userNoExternal === true) {
        return true;
    }
    if (typeof userNoExternal === "undefined") {
        return pluginNoExternal;
    }
    return [
        ...(Array.isArray(userNoExternal) ? userNoExternal : [userNoExternal]),
        ...pluginNoExternal,
    ];
}
