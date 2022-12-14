import { Plugin, UserConfig, ConfigEnv } from "vite";
import { Config as FullReloadConfig } from "vite-plugin-full-reload";
interface PluginConfig {
    /**
     * The path or paths of the entry points to compile.
     */
    input: string | string[];
    /**
     * gutenberg's public directory.
     *
     * @default 'assets'
     */
    publicDirectory?: string;
    /**
     * The public subdirectory where compiled assets should be written.
     *
     * @default 'static'
     */
    buildDirectory?: string;
    /**
     * The path to the "hot" file.
     *
     * @default `${publicDirectory}/hot`
     */
    hotFile?: string;
    /**
     * The path of the SSR entry point.
     */
    ssr?: string | string[];
    /**
     * The directory where the SSR bundle should be written.
     *
     * @default 'bootstrap/ssr'
     */
    ssrOutputDirectory?: string;
    /**
     * Configuration for performing full page refresh on blade (or other) file changes.
     *
     * {@link https://github.com/ElMassimo/vite-plugin-full-reload}
     * @default false
     */
    refresh?: boolean | string | string[] | RefreshConfig | RefreshConfig[];
}
interface RefreshConfig {
    paths: string[];
    config?: FullReloadConfig;
}
interface gutenbergPlugin extends Plugin {
    config: (config: UserConfig, env: ConfigEnv) => UserConfig;
}
export declare const refreshPaths: string[];
/**
 * gutenberg plugin for Vite.
 *
 * @param config - A config object or relative path(s) of the scripts to be compiled.
 */
export default function gutenberg(config: string | string[] | PluginConfig): [gutenbergPlugin, ...Plugin[]];
export {};
