/**
 * @name SyncData
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/SyncData/SyncData.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/SyncData/SyncData.plugin.js
 */
const config = {
	"info": {
		"name": "SyncData",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "Sync your settings, plugins and themes!",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/SyncData/SyncData.plugin.js"
	},
}
const request = require('request');
const fs = require("fs");
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
	//Custom css
	const customCSS = `
	`

	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings, Logger } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;
	//default settings
	const defaultSettings = {

	}
	let officalAddonsCache = []
	return class SyncData extends Plugin {
		async onStart() {
			//load default settings
			this.settings = this.loadSettings(defaultSettings);
			//inject css
			BdApi.injectCSS(config.info.name, customCSS)

			officalAddonsCache = await this.getAddonsCache();
			this.generateData()
		}

		async generateData() {
			let pluginArray = BdApi.Plugins.getAll();
			let themeArray = BdApi.Themes.getAll();

			let data = { plugins: [], themes: [] };

			pluginArray.forEach((e, i) => {
				let addonId = officalAddonsCache[e.name];
				let pluginObject = {};
				addonId ? pluginObject.bd = addonId : pluginObject.url = e.updateUrl
				pluginObject.on = BdApi.Plugins.isEnabled(e.name);
				try {
					let data = fs.readFileSync(`${BdApi.Plugins.folder}\\${e.filename.split(".")[0]}.config.json`, "utf8")
					pluginObject.settings = JSON.parse(data)
				} catch (error) {
					console.log(error)
				}
				data.plugins[i] = pluginObject;
			})
			themeArray.forEach((e, i) => {
				let addonId = officalAddonsCache[e.name];
				let themeObject = {};
				addonId ? themeObject.bd = addonId : themeObject.css = e.css
				themeObject.on = BdApi.Themes.isEnabled(e.name);
				data.themes[i] = themeObject
			})
			let settings = {};

			BdApi.settings.forEach((collection) => {
				settings[collection.name] = {};
				collection.settings.forEach((category) => {
					settings[collection.name][category.name] = {};
					category.settings.forEach((id) => {
						settings[collection.name][category.name][id.name] = id.value;
					})
				})
			})
			data.settings = settings


			console.log(JSON.stringify(data));
		}
		async getAddonsCache() {
			let url = "https://api.betterdiscord.app/v1/store/addons"
			return new Promise(function (resolve, reject) {
				request(url, { json: true }, (error, res, body) => {
					if (error) {
						reject(error)
					}
					if (!error && res.statusCode == 200) {
						let dict = {};
						body.forEach(e => { dict[e.name] = e.id });
						resolve(dict);
					}
				});
			});
		}

		getSettingsPanel() {
			//build the settings pannel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new RadioGroup('Radio', `Pick one`, this.settings.radio || 0, radioOptions, (i) => {
					this.settings.radio = i;
				}),
				new Switch("Switch", "Switch me", this.settings.toggle, (i) => {
					this.settings.toggle = i;
				}),
				new Textbox("Textbox", "Put text here", this.settings.text, (i) => {
					this.settings.text = i;
				}),
				new Slider("Slider", "Slide Me", 1, 10, this.settings.slider, (i) => {
					this.settings.slider = i;
				}, { markers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], stickToMarkers: true }),
			)

		}
		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));