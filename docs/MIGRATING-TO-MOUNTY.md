# Mounty-tool: update without losing existing settings

Mounty and Omarchy remain supported equal CSS theme routes at matching releases.
Neither requires this optional plugin, and installing a theme does not install
additional tools. Current plugin source is https://github.com/sonlndv/Mounty-tool ;
versioned runtime files use its own Releases page. Official directory
submission remains maintainer-owned/pending; no approved listing URL is claimed.

## Retain the same plugin folder and ID

Historical display names were Omarchy Writing, Mounty Writing and Mounty Zen.
The current name is **Mounty-tool**, version **0.5.0**. ID/folder remains
**omarchy-writing**. Disable the old manual companion, replace main.js/styles.css/
manifest.json in `.obsidian/plugins/omarchy-writing/`, retain **data.json**, then
explicitly re-enable Mounty-tool. Do not create another ID, enable two copies,
edit manifests to simulate listing migration, or discard preferences/hotkeys.

Release target after publication:
https://github.com/sonlndv/Mounty-tool/releases/tag/0.5.0 . Verify actual availability,
owner/source and technical ID before relying on any official install route.
A staged file, tag or source README is not live activation.

## Graph categories are opt-in manual assignments

There is no tag-to-property migration or bulk edit. New categories use the single
`mounty-graph` property only when you explicitly Assign/Clear one pinned Markdown
note. Existing active/reference tags, notes and native Groups are left untouched
until your deliberate actions. Removing/editing a category saves preferences
only; unmatched note properties remain. Explicit Graph preview/Apply prepends
owned category rules, preserving old rules and non-group options. Explicit undo
removes only exact unedited owned snapshots. Colour/scheme changes need Apply again.

The prior “never writes notes or Groups” statement applies only to historical
0.4.1. Version0.5.0 now writes the selected property via public processFrontMatter
and native Graph colour groups through validated non-public 1.14.5 interop,
only after explicit confirmation. It does not rewrite bodies, scan content,
change filters/physics/zoom/layout, classify notes automatically or enable plugins.

## Writing / hook compatibility and limits

The four old writing keys/defaults, body markers and command IDs remain. Zen
starts off; typewriter/follow remain off by default, standard width and filename
presentation are retained. Old saved true/standard/false/false values are kept.
Follow-colours still uses the separately reviewed exact-vault desktop wrapper;
without --policy-vault its legacy bulk behavior can select Omarchy again. That
is an equal supported theme. Do not run/change hooks as part of this plugin update.
The plugin does not run shell, switch OS theme or guarantee remote sync.

Graph interop requires an attached native GLOBAL Graph with supported methods;
local Graph and unsupported/old shapes refuse writes. Minimum1.5.0 is inherited
metadata; new Graph interop is not certified across old versions or mobile.
Synthetic main-window native1.14.5 note/Graph checks are separate from physical-device certification.

## Rollback

Preview removal of exact unedited owned Graph rules if wanted before disabling.
Disable and restore backed-up runtime in the same folder, keeping data.json.
Existing property assignments persist until you manually change/clear them.
Edited/foreign rules stay. An older plugin cannot manage new Graph ownership;
use native Graph UI deliberately. Never reset notes, Groups, layout, hotkeys or
other settings. Installation and rollback remain deliberate actions in the intended vault.
