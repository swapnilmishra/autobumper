#!/usr/bin/env node
// TODO: Modularize and handle various cases of Promise rejections
// FIXME: Tests please
const path = require("path"),
  fs = require("fs"),
  readPkg = require("read-pkg"),
  writePkg = require("write-pkg"),
  shell = require("shelljs");

const packageReadPromises = [],
  packagePaths = [],
  packageWritePromises = [];

let packagePath;

module.exports = autobumper;

const argv = require("yargs").argv;

if (argv.dir) {
  const { dir } = argv;
  autobumper({ dir });
}

function autobumper({ dir }) {
  if (!dir) {
    console.error(
      "No directory specified. Please specify a directory to scan for packages"
    );
    return;
  }
  console.log(` Reading files from ${dir}`);
  fs.readdir(path.resolve(dir), function(err, pkgs) {
    pkgs.forEach(function(pkg) {
      packagePath = path.resolve(path.resolve(dir), pkg);
      packageReadPromises.push(readPkg(packagePath));
      packagePaths.push(packagePath);
    });
    resolvePackagePromise();
  });
}

// FIXME: Problem with Promise.all is all the other promises gets rejected. Don't want that.
// TODO: Ignore dotfiles
function resolvePackagePromise() {
  Promise.all(packageReadPromises).then(consumePackageJSON);
}

function consumePackageJSON(packages) {
  for (let i = 0; i < packages.length; i++) {
    bumpVersion(i, packages[i]);
  }
}

function bumpVersion(idx, pkg) {
  setGitRevision(packagePaths[idx], pkg);
}

function setGitRevision(pkgDir, pContent) {
  // FIXME: This might not be the best way to get the SHA of commit as I hadnrolled it ¯\_(ツ)_/¯.
  // console.log(`Executing git log -n 1 ${pkgDir}`);
  shell.exec(`git log -n 1 ${pkgDir}`, { silent: true }, function(
    err,
    stdout,
    stderr
  ) {
    const commitMsg = stdout.match(/^commit (\w+)\n/);
    if (commitMsg.length == 0) return;
    const sha = commitMsg[commitMsg.length - 1];
    if (pContent.autobumperSha && pContent.autobumperSha !== sha) {
      console.log(
        `Bumping the patch version of ${pContent.name} hoooo haaa !!`
      );
      shell.exec(`cd ${pkgDir} && npm version patch`);
      writePkg.sync(pkgDir, Object.assign(pContent, { autobumperSha: sha }));
    } else if (typeof pContent.autobumperSha === "undefined") {
      console.log("SHA not present in the package. Adding it !!");
      writePkg.sync(pkgDir, Object.assign(pContent, { autobumperSha: sha }));
    } else {
      console.log(
        `No changes found for ${pContent.name}. Nothing to do here ¯\\_(ツ)_//¯`
      );
    }
  });
}
