/**
 * @name BetterMessageLinks
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js
 */
const config = {
	"info": {
		"name": "BetterMessageLinks",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "Instead of just showing the long and useless discord message link, make it smaller and add a preview.",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js"
	},
}

/* ----Useful links----
 * 
 * BetterDiscord BdApi documentation:
 *   https://github.com/BetterDiscord/BetterDiscord/wiki/Creating-Plugins
 * 
 * Zere's Plugin Library documentation:
 * 	 https://rauenzi.github.io/BDPluginLibrary/docs/
*/
module.exports = !global.ZeresPluginLibrary ? class {
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
} : (([Plugin, Library]) => {
	//Custom css
	const customCSS = `

	`

	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

	//Modules
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");
	const GetMessageModule = ZLibrary.DiscordModules.MessageStore;

	return class BetterMessageLinks extends Plugin {
		async onStart() {
			//inject css
			BdApi.injectCSS(config.info.name, customCSS)

			//add a MessageContent patcher
			Patcher.after(config.info.name, MessageContent, "type", (_, [props], ret) => {
				if (ret?.props?.children[0].length > 0) { 
					ret.props.children[0].forEach((child, i) => {
						if (/https:\/\/(ptb.|canary.)?discord.com\/channels\/\d+\/\d{18}\/\d{18}/gi.test(child.props?.href)) {
							let newLink = ret.props.children[0][i];
							newLink.props.children[0] = "<Message>";
							newLink.props.onMouseEnter = () => {
								console.log("hi")
								this.addPopout(child)
							};
							ret.props.children[0][i] = newLink;
						}
					});
				}
			})
		}
		addPopout(child) {
			let numberMatches = child.props.href.match(/\d{18}/g);
			let messageId = numberMatches.pop();
			let channelId = numberMatches.pop();
			let guildId = numberMatches.pop();
		}
		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));