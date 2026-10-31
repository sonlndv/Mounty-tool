# Community listings and source preparation

## Status and owner actions

The current community alias **Omarchy** remains a supported equal installation
route: matching Omarchy/Mounty releases use byte-identical CSS. **Mounty** (new
theme) and **Mounty Zen** (new plugin) listings are planned, not submitted or
approved. The maintainer submits and manages the entries through the community
directory. Source archives do not create public repositories or directory entries.
README changes do not change owner-edited directory fields.

## Product repositories and responsibility

- **Mounty theme:** https://github.com/sonlndv/Mounty . CSS appearance, fonts, colour, spacing, formatting and graph styling; it works without plugins.
- **Mounty Zen plugin:** https://github.com/sonlndv/Mounty-Zen . Optional commands, toggles, saved preferences and cursor-centering behaviour a CSS theme alone cannot provide. Plugin styles support those behaviours; they are not a replacement theme.
- **Omarchy:** the existing supported community alias, with byte-identical theme CSS at matching releases. Moving to the Mounty name remains optional.

Use the corresponding product repository for each official submission, not the original generator/Omarchy root. The GitHub repositories are separate from the still-pending Obsidian directory entries.

Runtime vs submission: Mounty Zen works offline with no runtime account, network,
shell, telemetry or dependency installer. Submission requires the owner's
Obsidian account and GitHub linking; the plugin does not request those grants.

## Copyable listing text

### Mounty

Short description:

> Write and connect ideas with calm dark/light colours, readable fonts and a small, meaningful graph palette.

Long description:

> Mounty keeps Obsidian's familiar layout with Geist prose, Space Mono headings
> and code, and selected peach, lilac, mint and cyan emphasis. Both light and dark
> palettes include embedded licensed Latin/Vietnamese fonts for offline use.
> Native graph colours distinguish ordinary notes and object states; optional
> manual Groups can follow a small workflow-based system. The theme never creates
> taxonomy or changes note data, Groups or graph physics. The supported Omarchy
> community alias offers the same appearance and capabilities at matching releases.
> Optional Mounty Zen adds writing controls separately; no plugin is required for
> the theme. Main-window desktop QA does not certify physical mobile/IME or sync.

### Mounty Zen

Short description (also the plugin manifest description; ASCII, <=250 chars):

> Focus on writing with optional Zen, typewriter scrolling, and Markdown width controls. Works offline without network, shell commands, telemetry, or dependency installers.

Long description:

> Mounty Zen is an optional writing companion for Mounty and Omarchy equally.
> Use the pen ribbon or assignable commands for Zen, optional typewriter editing,
> Outline and Backlinks. Zen starts off and has a visible Exit Zen control; width
> and filename-title preferences are conservative. It preserves native text size
> and stores only its own explicit preference changes. No note rewriting, automatic
> pane opening, default hotkeys, telemetry, network, shell or dependency installers.
> Follow Omarchy colours is optional and off by default; a separately reviewed
> scoped desktop hook is required for the next normal live theme application.
> Stable ID omarchy-writing preserves existing manual settings/hotkeys. Behavior
> targets the main window; phone, detached-editor, physical IME and sync operation
> are not certified. Declared minimum 1.5.0 is inherited; retained native QA is 1.14.5.

### Omarchy (existing supported alias)

Short description:

> Enjoy Mounty's calm writing colours, readable fonts and meaningful graph palette through the supported Omarchy theme name.

Long description:

> Omarchy remains a supported equal route to the Mounty theme. At matching releases
> both have byte-identical CSS and the same dark/light appearance, embedded fonts,
> native layout, emphasis and graph roles. Existing Omarchy users do not need to
> migrate for the design or optional writing controls. Keep using the current
> community updater, or optionally select a separately installed Mounty package.
> Mounty Zen is optional and never installed by a theme update. New Mounty and
> Mounty Zen listings remain subject to separate owner submission and review.

### Existing GitHub About copy

> Mounty and Omarchy: the same colourful Obsidian writing theme, with dark/light palettes, embedded fonts and optional Mounty Zen controls.

The GitHub About and directory descriptions are separate editable fields.
Use the copy above where appropriate; a README update alone does not update them.

## Exact products and release surfaces

| Route | Root manifest | Version | Assets / identity |
| --- | --- | --- | --- |
| Existing Omarchy updater | name Omarchy | 1.7.1 | Root manifest.json + theme.css; folder Omarchy |
| Manual/new Mounty theme | name Mounty | 1.7.1 | Mounty folder for manual install; standalone submission repository ROOT below |
| Optional Mounty Zen | name Mounty Zen, id omarchy-writing | 0.4.1 | main.js + manifest.json + styles.css; stable folder/id omarchy-writing |

The plugin description above is <=250 ASCII characters and ends with a period.
`minAppVersion: 1.5.0` stays inherited declared metadata, not fresh minimum-version
certification. Theme minimum metadata remains 1.0.0. Neither display naming nor
a source ZIP registers a product. Do not submit the maintained Omarchy monorepo
root as both new products: each needs its own correct root identity.

## Prepare independent publicly readable source, then releases

In the maintained original public repository
https://github.com/sonlndv/obsidian-omarchy-theme, the generators live in `bin/`
(`build.py`, `package_theme.py`, `package_companion.py`, `package_submissions.py`).
No source path/repository rename is required for existing users or hooks.

1. Review the source and verify unchanged CSS/runtime plus the regression tests.
   Build root CSS/metadata, manual packages and the two source exports:

   ```sh
   python3 -B bin/build.py
   python3 -B bin/package_theme.py
   python3 -B bin/package_companion.py
   python3 -B bin/package_submissions.py
   ```

2. Exporter output is **two different uploadable source ZIPs**, not installers:
   `Mounty-1.7.1-submission-source.zip` and
   `Mounty-Zen-0.4.1-submission-source.zip`. Each extracts directly to its own
   repository ROOT without an enclosing folder. Source is directly loadable,
   unobfuscated CSS/CommonJS JS; no transpiler, build or external dependency is
   required in these exported source roots. Their READMEs contain attribution,
   install/privacy/limits/release instructions and only included local assets.
3. The separate product sources are at https://github.com/sonlndv/Mounty and
   https://github.com/sonlndv/Mounty-Zen . Verify their default branches and release
   assets before submitting. Keep original author attribution, MIT LICENSE and
   applicable font copyright/full OFL notices.
   Theme root includes manifest.json, README.md, LICENSE, screenshot.png and CSS;
   plugin root includes manifest.json, README.md, LICENSE and runtime JS/CSS.
4. After review, create each release tag **exactly its manifest version**: 1.7.1
   for Mounty, 0.4.1 for Mounty Zen. Upload theme manifest.json/theme.css to the
   theme release, and main.js/manifest.json/styles.css to the plugin release.
   Ensure each product's reviewed source and default-branch HEAD match what its
   directory submission will read. Do not reuse a plugin manifest at the theme
   root or the Omarchy manifest for the new Mounty repository.
5. Verify public source/assets, native behavior and actual directory availability
   before announcing community installation/update routes. A ZIP, tag or upload
   is not listing review acceptance or live activation.

Archives include only explicit public allowlists. No self-install/update scripts,
working-tree copies, .git, vaults, settings/data.json, private briefs, fixtures,
logs, third-party packages or credentials belong in either export.

## Official submission / owner-edit paths

Use the current official documentation when preparing or managing an entry:

- [Manifest reference](https://docs.obsidian.md/Reference/Manifest): theme names
  cannot change after submission; plugin display names can. Keep stable plugin
  ID omarchy-writing. Its availability must be checked again when submitting.
- [Submit a theme](https://docs.obsidian.md/themes/app-themes/submit-theme): root
  README/LICENSE/screenshot/manifest, screenshot path, Dark/Light; release tag
  equals manifest version with manifest.json and theme.css assets.
- [Submit a plugin](https://docs.obsidian.md/plugins/releasing/submit-plugin):
  separate root plugin source/README/LICENSE/manifest and version-tagged runtime
  assets main.js, manifest.json, styles.css. Public source must be readable.
- [Set up and claim](https://docs.obsidian.md/community-directory/set-up-and-claim):
  Sign into community.obsidian.md with your Obsidian account, connect the owning
  GitHub account, claim the existing entry as appropriate, then choose
  **Themes → New theme** or **Plugins → New plugin**. Review the account-linking
  grant before authorizing it.
- [Manage an entry](https://docs.obsidian.md/community-directory/manage-entry):
  **Your entries → Omarchy → Edit listing**, edit short/long descriptions and
  applicable fields, then Save. Source README edits do not establish this step.
- [Plugin submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins):
  description <=250 characters and period; declared minimum remains inherited.
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies):
  no telemetry, self/dependency installers or network theme assets. Preserve
  attribution/licenses in derivative source and await upstream review.
