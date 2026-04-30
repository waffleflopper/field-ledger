import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = process.cwd();

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectSourceFiles(path);
    }

    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}

const sourceFiles = collectSourceFiles(join(workspaceRoot, "src")).filter(
  (path) => {
    const normalizedPath = relative(workspaceRoot, path).split(sep).join("/");

    return !normalizedPath.startsWith("src/modules/provider-boundaries/auth/");
  },
);
const authBoundaryFiles = collectSourceFiles(
  join(workspaceRoot, "src/modules/provider-boundaries/auth"),
);

function readWorkspaceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("auth provider boundary", () => {
  it("keeps Better Auth imports inside the app-owned auth boundary", () => {
    const leakingFiles = sourceFiles.filter((path) =>
      /["']better-auth(?:["'/])/.test(readWorkspaceFile(path)),
    );

    expect(leakingFiles.map((path) => relative(workspaceRoot, path))).toEqual(
      [],
    );
  });

  it("does not keep Supabase Auth helper usage in the auth boundary", () => {
    const supabaseAuthUsage = authBoundaryFiles.filter((path) => {
      const contents = readWorkspaceFile(path);

      return contents.includes("@supabase/") || contents.includes("Supabase");
    });

    expect(
      supabaseAuthUsage.map((path) => relative(workspaceRoot, path)),
    ).toEqual([]);
  });
});
