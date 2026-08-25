import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = join(repositoryRoot, "skills");

const skillDirectories = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const manifests = skillDirectories.map((directoryName) => {
  const skillPath = join(skillsRoot, directoryName, "SKILL.md");
  assert(existsSync(skillPath), `${directoryName} does not contain SKILL.md`);

  const markdown = readFileSync(skillPath, "utf8");
  const manifest = parseFrontmatter(markdown, skillPath);

  assert(
    manifest.name === directoryName,
    `${relative(repositoryRoot, skillPath)} declares name ${manifest.name}`,
  );
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name),
    `${manifest.name} is not a valid skill name`,
  );
  assert(
    manifest.description.length > 0 && manifest.description.length <= 1024,
    `${manifest.name} must have a description between 1 and 1024 characters`,
  );
  assert(
    markdown.includes("docs/manifest.json"),
    `${manifest.name} does not resolve installed documentation`,
  );
  assert(
    markdown.includes("commet doctor --output agent"),
    `${manifest.name} does not consume Node doctor diagnostics`,
  );
  assert(
    markdown.includes("sandbox") && markdown.includes("live"),
    `${manifest.name} does not guard sandbox and live effects`,
  );

  validateRelativeLinks(skillPath, markdown);

  return {
    name: manifest.name,
    description: manifest.description,
    path: relative(repositoryRoot, skillPath),
  };
});

const names = manifests.map((manifest) => manifest.name);
assert(
  new Set(names).size === names.length,
  "Skill names must be unique",
);

const readme = readFileSync(join(repositoryRoot, "README.md"), "utf8");
for (const name of names) {
  assert(
    readme.includes(`| \`${name}\` |`),
    `README.md does not list ${name}`,
  );
}

console.log(JSON.stringify({ skills: manifests }, null, 2));

function parseFrontmatter(markdown, skillPath) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert(match, `${relative(repositoryRoot, skillPath)} has no frontmatter`);

  const fields = {};
  for (const line of match[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    assert(
      separatorIndex > 0,
      `${relative(repositoryRoot, skillPath)} has invalid frontmatter`,
    );
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    assert(
      key === "name" || key === "description",
      `${relative(repositoryRoot, skillPath)} has unsupported ${key} metadata`,
    );
    assert(!(key in fields), `${skillPath} declares ${key} more than once`);
    fields[key] = value;
  }

  assert(typeof fields.name === "string", `${skillPath} has no name`);
  assert(
    typeof fields.description === "string",
    `${skillPath} has no description`,
  );

  return fields;
}

function validateRelativeLinks(skillPath, markdown) {
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#", 1)[0];
    if (
      target.length === 0 ||
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:")
    ) {
      continue;
    }

    const resolvedTarget = resolve(dirname(skillPath), decodeURIComponent(target));
    assert(
      existsSync(resolvedTarget),
      `${relative(repositoryRoot, skillPath)} links to missing ${target}`,
    );
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
