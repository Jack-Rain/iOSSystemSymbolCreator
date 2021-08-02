import axios from 'axios'
import fs from "fs"
import path from "path"
import { Utils } from './utils'
import "colors"
export namespace SymbolCreator {
    export async function createSymbol(version: string, outPutPath: string) {
        let prefix = version.split(".")[0];
        let url = `https://www.theiphonewiki.com/wiki/Firmware/iPhone/${prefix}.x`;
        const res = await axios.get(url);
        const reg = /.+href="(.+\.ipsw)".+/g;
        let ret;
        let downLoadUrl = "";
        while ((ret = reg.exec(res.data))) {
            if (ret[1].indexOf(version) !== -1) {
                downLoadUrl = ret[1];
                break;
            }
        }
        console.log("固件下载连接", downLoadUrl);
        if (downLoadUrl.length === 0) {
            console.log(`iOS系统符号表${version}未找到相应固件下载连接`.red);
            process.exit(1);
        }
        let ipswPath = `${outPutPath}/${version}_ipsw`;
        if (fs.existsSync(ipswPath)) {
            await Utils.exec("rm", ["-rf", ipswPath]);
        }
        try {
            console.log(`开始下载${version}版本固件`);
            await Utils.downloadFile(downLoadUrl, ipswPath, "ipsw.zip");
            //解压
            await Utils.exec("unzip", [`${ipswPath}/ipsw.zip`, "-d", `${ipswPath}`]);
            //获取所需dmg文件路径
            const files = await fs.promises.readdir(ipswPath);
            let biggestDmg = "";
            let biggestSize = 0;
            for (let file of files) {
                if (file.endsWith(".dmg")) {
                    let dmgPath = path.join(ipswPath, file);
                    const stats = await fs.promises.lstat(dmgPath);
                    if (stats.size > biggestSize) {
                        biggestDmg = dmgPath;
                        biggestSize = stats.size;
                    }
                }
            }
            //准备文件夹
            let dmgAmountPath = `${ipswPath}/dmg`;
            let symbolFolderPath = `${ipswPath}/${version}`;
            let symbolPath = `${ipswPath}/${version}/Symbols`;
            await fs.promises.mkdir(dmgAmountPath);
            await fs.promises.mkdir(symbolFolderPath);
            await fs.promises.mkdir(symbolPath);
            //挂载dmg文件到指定路径
            await Utils.exec("hdiutil", ["attach", "-mountpoint", dmgAmountPath, biggestDmg]);
            const excutePath = path.resolve(
                Utils.getAssetsDir(),
                "dsc_extractor"
            );
            let dyldPath = `${dmgAmountPath}/System/Library/Caches/com.apple.dyld`
            const dyldFiles = await fs.promises.readdir(dyldPath);
            for (let dyld of dyldFiles) {
                let dyldFilePath = path.join(dyldPath, dyld);
                await Utils.exec(excutePath, [dyldFilePath, symbolPath]);
            }
            await Utils.exec("mv", [symbolFolderPath, outPutPath]);
            await Utils.exec("hdiutil", ["detach", dmgAmountPath]);
            await Utils.exec("rm", ["-rf", ipswPath]);
            console.log("生成符号表成功".green)
            process.exit(0);
        } catch (error) {
            console.log(`iOS系统符号表${version}生成失败:${error}`.red);
            process.exit(1);
        }
    }
}