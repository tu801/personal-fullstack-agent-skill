from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


ROOT_FILES = [
    ".editorconfig",
    ".gitignore",
    ".github/workflows/.gitkeep",
    "infra/terraform/modules/.gitkeep",
    "infra/terraform/envs/dev/.gitkeep",
    "infra/terraform/envs/staging/.gitkeep",
    "infra/terraform/envs/prod/.gitkeep",
    "packages/contracts/.gitkeep",
    "packages/config/.gitkeep",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scaffold a polyglot repository with backend and frontend templates."
    )
    parser.add_argument("--root", required=True, help="Target directory to create or extend.")
    parser.add_argument(
        "--backend",
        nargs="*",
        choices=["php", "python", "typescript"],
        default=[],
        help="Backend stacks to scaffold.",
    )
    parser.add_argument(
        "--frontend",
        nargs="*",
        choices=["nextjs", "nuxt"],
        default=[],
        help="Frontend stacks to scaffold.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files if they are already present.",
    )
    return parser.parse_args()


def copy_template_tree(source: Path, destination: Path, name: str, force: bool) -> None:
    for item in source.rglob("*"):
        relative = item.relative_to(source)
        target = destination / relative
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue

        if target.exists() and not force:
            raise FileExistsError(f"Refusing to overwrite existing file: {target}")

        target.parent.mkdir(parents=True, exist_ok=True)
        text = item.read_text(encoding="utf-8")
        target.write_text(text.replace("__NAME__", name), encoding="utf-8")


def copy_root_templates(source: Path, destination: Path, force: bool) -> None:
    for relative in ROOT_FILES:
        template_path = source / relative
        target_path = destination / relative
        target_path.parent.mkdir(parents=True, exist_ok=True)
        if target_path.exists() and not force:
            continue
        shutil.copyfile(template_path, target_path)


def main() -> int:
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    assets_dir = script_dir.parent / "assets" / "templates"
    root_dir = Path(args.root).resolve()
    root_dir.mkdir(parents=True, exist_ok=True)

    copy_root_templates(assets_dir / "root", root_dir, args.force)

    manifest = {
        "services": [],
        "apps": [],
    }

    for stack in args.backend:
        name = f"service-{stack}"
        destination = root_dir / "services" / name
        copy_template_tree(assets_dir / "backend" / stack, destination, name, args.force)
        manifest["services"].append({"name": name, "stack": stack})

    for stack in args.frontend:
        name = f"app-{stack}"
        destination = root_dir / "apps" / name
        copy_template_tree(assets_dir / "frontend" / stack, destination, name, args.force)
        manifest["apps"].append({"name": name, "stack": stack})

    manifest_path = root_dir / "stack-manifest.json"
    if manifest_path.exists() and not args.force:
        raise FileExistsError(f"Refusing to overwrite existing file: {manifest_path}")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Scaffolded repository at {root_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
