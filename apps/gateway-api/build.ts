const entrypoint = "./src/index.ts";
const outDir = "../desktop/src-tauri/sidecars";
const binaryName = "gateway-api";

interface BuildTarget {
  bunTarget: Bun.Build.CompileTarget;
  tauriTriple: string;
  windows: boolean;
}

const targets: BuildTarget[] = [
  // Linux
  {
    bunTarget: "bun-linux-arm64",
    tauriTriple: "aarch64-unknown-linux-gnu",
    windows: false,
  },
  // macOS
  {
    bunTarget: "bun-darwin-arm64",
    tauriTriple: "aarch64-apple-darwin",
    windows: false,
  },
];

for await (const target of targets) {
  console.log(`Building for ${target.tauriTriple}...`);
  await Bun.build({
    entrypoints: [entrypoint],
    outdir: outDir,
    compile: {
      outfile: target.windows
        ? `${binaryName}-${target.tauriTriple}.exe`
        : `${binaryName}-${target.tauriTriple}`,
      target: target.bunTarget,
    },
    minify: {
      whitespace: true,
      syntax: true,
      identifiers: true,
    },
  });

  if (target.bunTarget.includes("darwin")) {
    const binaryPath = `${outDir}/${binaryName}-${target.tauriTriple}`;
    console.log(`Code signing ${binaryPath}...`);
    const removeSig = Bun.spawnSync([
      "codesign",
      "--remove-signature",
      binaryPath,
    ]);
    if (removeSig.exitCode !== 0) {
      console.error(
        "Failed to remove signature:",
        removeSig.stderr?.toString()
      );
    }

    const sign = Bun.spawnSync(["codesign", "-s", "-", binaryPath]);
    if (sign.exitCode !== 0) {
      console.error("Failed to sign:", sign.stderr?.toString());
    }
  }
}
