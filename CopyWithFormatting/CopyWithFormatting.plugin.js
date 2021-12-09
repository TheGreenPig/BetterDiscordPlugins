/**
 * @name CopyWithFormatting
 * @author AGreenPig
 * @version 0.0.2
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/CopyWithFormatting/CopyWithFormatting.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/CopyWithFormatting/CopyWithFormatting.plugin.js
 */

const { appendFile } = require("fs");


module.exports = (() => {
	const config = {
		"info": {
			"name": "CopyWithFormatting",
			"authors": [{
				"name": "AGreenPig",
				"discord_id": "427179231164760066",
				"github_username": "TheGreenPig"
			}],
			"version": "0.0.2",
			"description": "Right click, or shift-hover over a message to copy the message with correct discord formatting.",
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
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for **${config.info.name}** is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
			});
		}
		start() { }
		stop() { }
	}: (([Plugin, Api]) => {
		const plugin = (Plugin, Library) => {
			const {
				Logger
			} = { ...Api, ...BdApi };
			return class CopyWithFormatting extends Plugin {
				start() {
					const MenuItem = BdApi.findModuleByProps("MenuItem");
					const MessageContextMenu = BdApi.findModule((m) => m?.default?.displayName === "MessageContextMenu");
					const MiniPopover = BdApi.findModule((m) => m?.default?.displayName === "MiniPopover");
					const TooltipWrapper = BdApi.findModuleByPrototypes("renderTooltip");
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
					BdApi.Patcher.after("MessageContextMenuPatch", MiniPopover, "default", (that, args, value) => {
						const [props] = args;
						const popover = props.children[1].props;
						if (!popover.expanded) return;
						let colorText = window.getComputedStyle(document.querySelector(".icon-3Gkjwa"), null).getPropertyValue('color').replace(/\s/g, "");
						let colorArray = colorText.match(/(\d+),(\d+),(\d+),?(\d+\.\d+)?/);
						let hex = componentToHex(parseInt(colorArray[1])) + componentToHex(parseInt(colorArray[2])) + componentToHex(parseInt(colorArray[3]));
						let alpha = 1;
						function componentToHex(c) {
							var hex = c.toString(16);
							return hex.length == 1 ? "0" + hex : hex;
						}
						if (typeof colorArray[4] != 'undefined') {
							alpha = colorArray[4];
						}
						const InfoButton = BdApi.React.createElement(TooltipWrapper, {
							position: TooltipWrapper.Positions.TOP,
							color: TooltipWrapper.Colors.PRIMARY,
							text: "Copy message with formatting",
							children: (tipProps) => {
								return BdApi.React.createElement("div", Object.assign({
									children: [
										BdApi.React.createElement("button", {
											style: {
												padding: "4px",
												marginLeft: "4px",
												opacity: alpha,
												background: "none",
											},
											children: [
												BdApi.React.createElement("img", {
													src: `https://img.icons8.com/material-outlined/24/${hex}/copy.png`,
												})
											],
											onClick: () => {
												DiscordNative.clipboard.copy(popover.message.content)
												BdApi.showToast("Copied message!", { type: "success" });
											}
										})
									]
								}, tipProps))
							}
						});

						value.props.children.push(InfoButton);
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
