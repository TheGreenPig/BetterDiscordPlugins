/**
 * @name CopyWithFormatting
 * @author AGreenPig
 * @version 0.0.1
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/CopyWithFormatting/CopyWithFormatting.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/FileViewer/FileViewer.plugin.js
 */


module.exports = (() => {
	const config = {
		"info": {
			"name": "CopyWithFormatting",
			"authors": [{
				"name": "AGreenPig",
				"discord_id": "427179231164760066",
				"github_username": "TheGreenPig"
			}],
			"version": "0.0.1",
			"description": "Right click to copy the message with correct discord formatting.",
			"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/CopyWithFormatting/CopyWithFormatting.plugin.js"
		},
	}
	return !global.ZeresPluginLibrary ? class {
		constructor() { this._config = config; }
		getName() { return config.info.name; }
		getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
		getDescription() { return config.info.description; }
		getVersion() { return config.info.version; }
		load() {
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
			});
		}
		start() { }
		stop() { }
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Library) => {
			const {
				Logger
			} = { ...Api, ...BdApi };
			return class CopyWithFormatting extends Plugin {
				start() {
					const MenuItem = BdApi.findModuleByProps("MenuItem");
					const MessageContextMenu = BdApi.findModule((m) => m?.default?.displayName === "MessageContextMenu");
					//Credit to p0rtL#6592 for the snippet
					BdApi.Patcher.after("MessageContextMenuPatch", MessageContextMenu, "default", (that, args, value) => {
						const [props] = args;
						let message = props.message
						value.props.children.push(BdApi.React.createElement(MenuItem.MenuItem, {
							label: "Copy message with formatting",
							id: "MessageContextMenuPatch",
							action: () => {
								DiscordNative.clipboard.copy(message.content);
								BdApi.showToast("Copied message!", { type: "success" });
							}
						}))
					});
				}
				stop() {
					BdApi.Patcher.unpatchAll("MessageContextMenuPatch");
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
