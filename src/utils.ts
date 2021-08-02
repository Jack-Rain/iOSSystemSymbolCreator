import fs from "fs";
import Axios from "axios";
import DownloadPath from "path";
import { spawn, SpawnOptionsWithoutStdio } from "child_process";
export namespace Utils {
    export function getAssetsDir() {
        return `${__dirname}/../assets`;
    }
    export async function downloadFile(
        url: string,
        filepath: string,
        name: string
    ) {
        if (!fs.existsSync(filepath)) {
            await fs.promises.mkdir(filepath);
        }
        const mypath = DownloadPath.resolve(filepath, name);
        const writer = fs.createWriteStream(mypath);
        const response = await Axios({
            url,
            method: "GET",
            responseType: "stream",
            onDownloadProgress: (progressEvent) => {
                let complete =
                    (((progressEvent.loaded / progressEvent.total) * 100) | 0) + "%";
                console.log("下载 " + complete);
            },
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    }

    export async function exec(
        command: string,
        args?: ReadonlyArray<string>,
        options?: SpawnOptionsWithoutStdio
    ) {
        const now = new Date().getTime();
        return new Promise((resolve, reject) => {
            const cmd = spawn(command, args, options);
            cmd.stdout.on("data", (data) => {
                console.log(data.toString());
            });

            cmd.stderr.on("data", (data) => {
                console.error(data.toString());
            });

            cmd.on("close", (code) => {
                resolve(code);
            });
            cmd.on("error", (err) => {
                reject(err);
            });
        });
    }
}