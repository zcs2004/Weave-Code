# Upstream provenance and modifications

## Primary upstream

- Project: Phoenix
- Repository: <https://github.com/phcode-dev/phoenix>
- Upstream license: `AGPL-3.0-or-later`
- Upstream relationship: Phoenix is based on Adobe Brackets
- Exact upstream commit for the current embedded runtime: **not yet identified**

The exact commit must not be guessed. Before publishing a Weave Code binary or
claiming that the public repository is its corresponding source, identify and
record the precise Phoenix commit or release from which the embedded runtime was
produced.

## Weave Code modifications

The current Weave Code tree includes substantial HarmonyOS-specific and
product-specific changes, including:

- HarmonyOS HAP packaging and an ArkWeb application shell;
- native file, project, lifecycle, account, and Huawei IAP bridges;
- application branding, menus, dialogs, localization, and responsive UI changes;
- local preview and resource routing;
- VIP entitlement checks and Weave Code service integration;
- extension registry and distribution changes.

## Public source location

<https://github.com/zcs2004/Weave-Code>

For each release, this repository must contain the complete corresponding source
for that release, its build instructions, dependency locks, local patches, and a
record connecting the source revision to the distributed HAP hash.

## Release record to complete

```text
Weave Code release: 1.0.2
Phoenix upstream commit or tag: TODO
Weave Code source commit: TODO
Build instructions revision: TODO
Distributed HAP SHA-256: TODO
Third-party notice audit date: TODO
```
