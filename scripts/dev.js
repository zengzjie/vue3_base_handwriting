import * as esbuild from 'esbuild';
import minimist from 'minimist';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// 获取命令行参数
// node scripts/dev.js reactivity a a a  -f esm
const args = minimist(process.argv.slice(2));
const format = args.f || 'iife';
const target = args._[0] || 'reactivity';

const __dirname = dirname(fileURLToPath(import.meta.url)); // __dirname

const pkg = resolve(__dirname, `../packages/${target}/package.json`);


esbuild.context({
    entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true, // 将所有的文件打包在一起
    sourcemap: true,
    format,
    globalName: pkg.buildOptions?.name,
    platform: format === 'cjs' ? 'node' : 'browser'

    // ESM-BROWSER 就是希望都打包在一起
    // ESM-BUNDLER external
}).then(async ctx => {
    ctx.watch();
    const { host, port } = await ctx.serve({
        servedir: resolve(__dirname, `../packages/${target}/dist`),
        port: 8080,
        host: '127.0.0.1',
    });
    console.log(`Serve is listening on http://${host}:${port}`);
}); // 使用上下文开启监听

// 生产rollup