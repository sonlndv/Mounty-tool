# Mounty Zen

Optional writing behaviour for [Mounty](https://github.com/sonlndv/Mounty) and its supported Omarchy alias: Zen commands, typewriter cursor centering and saved writing preferences.

## One principle: behaviour, not a second theme

**Mounty provides the appearance. Mounty Zen adds functionality a CSS theme alone cannot provide.** Mounty must remain useful without this plugin, and neither theme installs it automatically.

Zen owns commands/toggles, conditional presentation, preference persistence and editor-cursor behaviour. Static width/title styling can be expressed in CSS; the interactive controls and saved choices for it belong here. Supporting plugin CSS serves those behaviours rather than replacing Mounty's palette or typography.

## Writing tools

![The retained synthetic native writing-tools menu.](docs/images/mounty-writing-tools.png)

![Synthetic writing content with the visible Exit Zen control.](docs/images/mounty-zen.png)

Use the pen ribbon or **Mounty Zen: Open writing tools**. The menu provides Zen, optional typewriter editing, Outline and Backlinks. No pane opens automatically; unavailable core commands stay disabled. Enable Obsidian's own Outline/Backlinks core plugins yourself if wanted.

- **Zen starts OFF**, with a visible Exit Zen button. It does not save a new layout or hijack Escape from native menus, dialogs, IME or Vim.
- **Typewriter starts OFF.** When selected, it centers a focused, unselected cursor during Zen source editing after input/keyboard movement, not on an idle loop. Selection, composition, menus and manual scrolling have guards.
- **Saved preferences:** Markdown width starts standard; hiding the filename title starts OFF. Native text size and non-Markdown views remain separate.
- **Follow Omarchy colours starts OFF.** For recognized Mounty/Omarchy CSS it protects the fixed palette. ON permits the next normal desktop Omarchy application through a separately reviewed hook; it does not run shell, install a hook, switch OS theme or guarantee phone sync.

The captures show real retained synthetic Obsidian desktop behaviour. They do not claim fresh native/mobile tests of this repository publication.

## Install Mounty Zen 0.4.1

Source: https://github.com/sonlndv/Mounty-Zen . Release files: https://github.com/sonlndv/Mounty-Zen/releases/tag/0.4.1 .

The community plugin submission is **planned, not submitted or approved**. Manual installation is available; community installation/update is conditional on actual directory publication.

Put `main.js`, `styles.css` and `manifest.json` directly under `<vault>/.obsidian/plugins/omarchy-writing/`, then explicitly enable **Mounty Zen** in Community plugins. For an existing Omarchy Writing/Mounty Writing companion, disable it first, replace those three runtime files in the SAME folder, **preserve `data.json`**, and re-enable it.

The display name is **Mounty Zen**; the technical ID/folder intentionally remains **omarchy-writing** to preserve preferences and hotkeys. The GitHub repository name does not require an ID change. Do not create a second `mounty-zen` plugin, enable both names, or edit a manifest to fake registration. See the [migration guide](docs/MIGRATING-TO-MOUNTY.md).

Assignable command IDs remain:

- `omarchy-writing:open-writing-tools`
- `omarchy-writing:toggle-zen`
- `omarchy-writing:toggle-typewriter`

No default hotkeys are assigned. A file download or release upload is not activation; explicitly enable and verify the plugin in the intended vault.

## Privacy, limits and removal

The runtime works offline without an account, network, telemetry, shell execution, external libraries or a dependency installer. Obsidian provides its SDK. It stores only its own explicit preference changes; note content, Graph Groups, other plugin settings, hotkeys and layout are not rewritten. Unload removes owned presentation/listeners/menu/button/padding and restores owned body state.

Behaviour targets the main window. Retained native QA used Obsidian 1.14.5; `minAppVersion: 1.5.0` is inherited metadata, not newly certified. Physical phone/IME/mobile keyboard, detached editors and remote sync remain unverified.

Disable before removing/restoring the owned runtime; retain `data.json` if returning. Restore only your backed-up files, never notes/Groups/layout or other settings. Older hook/plugin combinations may not enforce opt-in; review them before allowing desktop writes.

## Source and licence

`main.js` is directly loadable, unobfuscated CommonJS source with `styles.css`; no transpiler/build or dependency installation is required. Runtime bytes match the reviewed companion in the [original maintained source](https://github.com/sonlndv/obsidian-omarchy-theme).

Original author: Le Son. [MIT LICENSE](LICENSE). Release tag **0.4.1** matches the root plugin manifest; its raw assets are `main.js`, `manifest.json` and `styles.css`. Owner Obsidian/GitHub account linking is needed for submission, not for plugin use. See [listing copy and submission steps](docs/COMMUNITY-LISTINGS.md); GitHub publication is not official approval.
