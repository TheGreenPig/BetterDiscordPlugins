/**
 * @name ClassModule
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/ClassModule/ClassModule.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/ClassModule/ClassModule.plugin.js
 */
const config = {
	"info": {
		"name": "ClassModule",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "A description",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/ClassModule/ClassModule.plugin.js"
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
	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings, DiscordClassModules } = { ...BdApi, ...Library };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

	//Modules
	const MessageContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu");
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");

	return class ClassModule extends Plugin {
		async onStart() {

		}

		onStop() {

		}
		observer(changes) {
			let element = changes.target;
			switch (element?.tagName) {
				case "BD-THEMES":

					Array.from(element.children).forEach(style => {
						this.assignStyle(style);
					});
					break;
				case "BD-STYLES":
					Array.from(element.children).forEach(style => {
						this.assignStyle(style);
					});
					break;
				case "STYLE":
					if (element.id === "customcss") {
						this.assignStyle(element);
					}
					break;
			}
		}
		async assignStyle(styleNode) {
			styleNode.textContent = await this.processStyle(styleNode.textContent);
		}
		async processStyle(style) {
			style = await this.processImports(style);

			if (!style.includes("DiscordClassModules")) return style;
			let usedClasses = style.match(/DiscordClassModules(\.\w+)+/g)
			usedClasses.forEach(classModule => {
				let selectors = classModule.split(".");
				//remove "DiscordClassModules"
				let layer = DiscordClassModules[selectors[1]];
				selectors.splice(0, 2)
				while (typeof layer !== "string" && layer[selectors[0]]) {
					layer = layer[selectors[0]];
					selectors.shift();
				}
				if (typeof layer === "string") {
					let suffix = selectors.join(".");
					if (suffix !== "") suffix = "." + suffix;
					style = style.replace(classModule.replace(suffix, ""), layer);
				} else {
					console.error(`The DiscordClassModule "${classModule}" is not valid.`);
				}
			});
			return style;
		}
		async processImports(style) {
			return new Promise((resolve, reject) => {
				let imports = style.match(/\/\*\s*DiscordClassModules\s*\*\/\s*\n@import url\(.+\);\s*/g)[0]
				if (imports) {
					let url = imports.split("\n")[1].match(/https:\/\/.+\.css/g)[0]
					fetch(url)
						.then(data => { return data.text() })
						.then(res => {
							resolve(style.replace(imports.split("\n")[1], res))
						}).catch(error => {
							reject(error);
						})
					
				} else {
					resolve(style);
				}
			})
		}


	}
})(global.ZeresPluginLibrary.buildPlugin(config));