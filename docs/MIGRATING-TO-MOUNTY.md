# Optional migration to Mounty / Mounty Zen

**Staying on Omarchy is fully supported.** At a matching release, Omarchy and
Mounty have byte-identical CSS and the same appearance/capabilities. There is no
feature, colour or writing-tools requirement to switch names. The existing
repository and community Omarchy updater remain supported, not frozen redirects.

## Theme: keep Omarchy or add Mounty alongside

Keep/select Omarchy in Appearance and update it through its existing community
entry when the desired version is available. Root manifest name Omarchy matches
the Omarchy folder. Optional manual Mounty packages carry name Mounty and a
matching Mounty folder; do not rename folders/manifests to fake migration.

For the optional manual route, extract the reviewed Mounty package into
`<vault>/.obsidian/themes/Mounty/` alongside the retained Omarchy folder. Select
Mounty in Settings → Appearance's theme dropdown, confirm the same look and keep
the old folder/release as fallback. No note, preference, Graph Groups or layout
rewrite is required. Changing the selection yourself is the only intended
presentation choice; this guide executes no migration or install.

**Community Mounty installation is conditional:** the new listing is planned,
not submitted or approved. Only after actual approval/publication, verify its
name/version in the directory before using Manage themes to install it. Product
source and manual releases are at https://github.com/sonlndv/Mounty and
https://github.com/sonlndv/Mounty-Zen . These are not directory approval links.

## Plugin: Mounty Zen, the same ID and preferences

The optional plugin product/display name is Mounty Zen. Keep the stable folder
and ID `omarchy-writing`, existing `data.json`, settings keys and hotkeys.

1. Disable the existing manual Omarchy Writing / Mounty Writing / Mounty Zen
   companion before replacing its files.
2. Replace `main.js`, `styles.css`, `manifest.json` (and documentation) in the
   SAME `.obsidian/plugins/omarchy-writing/` folder using the reviewed package.
   Preserve `data.json`; do not create a `mounty-zen` folder or another ID.
3. Re-enable Mounty Zen explicitly and verify its available version. A source
   archive, uploaded release or staged file is not activation.

A future official-plugin upgrade route is available only after actual directory
availability; verify it uses **omarchy-writing**, the intended version and the
correct owner/source before relying on it. Do not enable both names as separate
plugins, edit a manifest to simulate registration, or discard existing settings.
The theme never auto-installs the optional plugin. Zen starts off; command IDs
remain `omarchy-writing:toggle-zen`, `omarchy-writing:toggle-typewriter` and
`omarchy-writing:open-writing-tools`, with the same pen ribbon and no prebound
hotkeys. Enable native Outline/Backlinks yourself if wanted.

## Desktop Omarchy hook: review before a name switch

A legacy hook may write/select Omarchy again. That remains a supported equal
look, but may override an optional manual name selection. The approved wrapper
source stays at `hooks/50-obsidian-theme` in the maintained original repository;
it invokes the existing `code/obsidian-omarchy-theme/bin/build.py` source path.

If deliberately deploying that reviewed wrapper, use an exact registered
`--policy-vault` path together with `--live --install`, with backups outside the
executable hook directory. Only that named vault is opt-in. Missing/false/invalid
`followOmarchyColors` denies its writes; ON follows the next normal desktop
Omarchy application and preserves a selected literal Mounty/Omarchy destination.
Other registered vaults keep legacy behavior. **Without --policy-vault, bulk
writes/selecting Omarchy remain.** Do not market this as a one-vault preview.

The plugin does not execute shell, install hooks, switch OS theme or guarantee
remote phone sync. `.disabled` / chmod are not hook toggles for a runner that
executes regular files except `*.sample`. Stop on concurrent edits: path checks
are not an atomic transaction. Deploy through your normal reviewed Omarchy
maintenance process; this guide does not run an installer.

## Limits and rollback

Keep owned runtime/theme/hook backups and the current settings bytes. To roll
back, disable the plugin, restore only its backed-up runtime in the same folder,
retain `data.json`, and select the retained Omarchy release/folder. Restore the
reviewed owned hook backup through its normal maintainer. Verify old combinations
before desktop writes: older code may not enforce the preference. Never reset
notes, Groups, layout, other plugins or hotkeys.

Main-window behavior is the target. Retained native QA used Obsidian 1.14.5;
physical phone, detached-window, mobile IME and remote sync are not certified.
The plugin's declared minimum 1.5.0 is inherited, not freshly tested. Account
linking, listing submission/approval and actual activation remain separate gates.
