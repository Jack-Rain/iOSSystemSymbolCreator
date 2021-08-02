#!/usr/bin/env node
import commander from "commander";
import { SymbolCreator } from './symbolCreator'
commander
.command("createSymbol")
.description("生成符号表名命令")
.requiredOption("--symbolVersion <symbolVersion>", "符号表版本, 格式为:14.4_B65")
.requiredOption("--outputPath <outputPath>", `符号表输出路径`)
.action(async (option) => {
  SymbolCreator.createSymbol(option.symbolVersion, option.outputPath);
});

commander.version("1.0.0").parse(process.argv);