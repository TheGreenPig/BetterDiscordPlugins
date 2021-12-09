/**
 * @name UrlShortener
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrlShortener/UrlShortener.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/UrlShortener/UrlShortener.plugin.js
 */
const config = {
	"info": {
		"name": "UrlShortener",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "A simple plugin that lets you right click links and generate Shortened Urls from tinyurl.com!",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrlShortener/UrlShortener.plugin.js"
	},
}
module.exports = !global.ZeresPluginLibrary ? class {
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
} : (([Plugin, Library]) => {
	const { WebpackModules, DCM, Patcher, } = { ...Library, ...BdApi };

	const MessageContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")
	const SlateTextAreaContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "SlateTextAreaContextMenu")
	return class UrlShortener extends Plugin {
		async onStart() {
			Patcher.after(config.info.name, MessageContextMenu, "default", (_, __, ret) => {
				let url = __[0]?.target?.href;
				if(url) {
					ret.props.children.push(this.getContextMenuItem(url))
				}
			})
			
			Patcher.after(config.info.name, SlateTextAreaContextMenu, "default", (_, __, ret) => {
				let url = __[0]?.target?.textContent;
				if(url && /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(url)) {
					ret.props.children.push(this.getContextMenuItem(url))
				}
			})
		}
		getContextMenuItem(url) {
			let ContextMenuItem = DCM.buildMenuItem({
				label: "Shorten Url",
				type: "text",
				action: () => {
					fetch(`https://tinyurl.com/api-create.php?url=${url}`)
						.then(data => { return data.text() })
						.then(res => {
							BdApi.alert("Shortened Url:", res)
						})
				}
			})
			return ContextMenuItem;
		}
		onStop() {
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));

//Thank you CT-1409 with your Hastebin plugin! You were my inspiration <3