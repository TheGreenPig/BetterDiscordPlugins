/**
 * @name HideEverything
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/HideEverything/HideEverything.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/HideEverything/HideEverything.plugin.js
 */
module.exports = (() => {
	const config = {
		"info": {
			"name": "HideEverything",
			"authors": [{
				"name": "AGreenPig",
				"discord_id": "427179231164760066",
				"github_username": "TheGreenPig"
			}],
			"version": "1.0.0",
			"description": "Turn off every Theme and Plugin with a shortcut.",
			"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/HideEverything/HideEverything.plugin.js"
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
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Library) => {
			const {
				Themes,
				Plugins,
				Settings,
				React,
				Logger
			} = { ...Api, ...BdApi };
			const { SettingPanel, Keybind, Textbox } = Settings;

			const FormItem = BdApi.findModuleByProps("FormItem").FormItem;
			const KeybindRecorder = BdApi.findModuleByDisplayName("KeybindRecorder");

			let pressing = [];
			let showToasts;
			return class HideEverything extends Plugin {
				start() {
					let hidingEverything = false;
					document.onkeydown = (evt) => {
						if (!pressing.includes(evt.keyCode)) {
							pressing.push(evt.keyCode)

							if (this.filterKeybind(this.settings.shortcut).every(e => pressing.includes(e))) {
								if (hidingEverything) {
									Logger.log("Hide everything!")
									let skipPluginArray = [];

									this.turnOffToasts()
									Plugins.getAll().forEach(plugin => {
										if (!Plugins.isEnabled(plugin.id)) {
											skipPluginArray.push(plugin.id)
										}
										if (plugin.id !== config.info.name) {
											Plugins.disable(plugin.id);
										}
									});
									let skipThemeArray = [];
									Themes.getAll().forEach(theme => {
										if (!Themes.isEnabled(theme.id)) {
											skipThemeArray.push(theme.id)
										}
										Themes.disable(theme.id);
									});
									this.turnOnToasts();

									//make get customcss at fixed position, otherwhise search...
									let usingCustomCss = BdApi.isSettingEnabled("settings", "customcss", "customcss");
									BdApi.saveData(config.info.name, "SkipCustomCss", !usingCustomCss);
									BdApi.disableSetting("settings", "customcss", "customcss")

									BdApi.saveData(config.info.name, "SkipPlugins", skipPluginArray)
									BdApi.saveData(config.info.name, "SkipThemes", skipThemeArray)

									hidingEverything = false;
								} else {
									Logger.log("Reveal everything!")
									let skipPluginArray = BdApi.loadData(config.info.name, "SkipPlugins")
									let skipThemeArray = BdApi.loadData(config.info.name, "SkipThemes")
									let skipCustomCss = BdApi.loadData(config.info.name, "SkipCustomCss")

									this.turnOffToasts();
									Plugins.getAll().forEach(plugin => {
										if (!skipPluginArray.includes(plugin.id)) {
											Plugins.enable(plugin.id)
										}
									});
									Themes.getAll().forEach(theme => {
										if (!skipThemeArray.includes(theme.id)) {
											Themes.enable(theme.id)
										}
									});
									if(!skipCustomCss) {
										BdApi.enableSetting("settings", "customcss", "customcss")
									}
									this.turnOnToasts()
									hidingEverything = true;
								}
							}
						}
					}
					document.onkeyup = (evt) => {
						pressing.splice(pressing.indexOf(evt.keyCode), 1);
					};
					this.settings = this.loadSettings({ shortcut: [[0, 162], [0, 68]] })
					this.saveSettings(this.settings);
				}
				getSettingsPanel() {
					return React.createElement(FormItem, {
						title: "Keybind to hide everything:"
					},
						//Containing a keybind recorder.
						BdApi.React.createElement(KeybindRecorder, {
							defaultValue: this.settings.shortcut,
							onChange: (e) => {
								//Set the keybind and save it.
								this.settings.shortcut = e;
								this.saveSettings(this.settings)
							}
						}))

				}
				turnOffToasts() {
					Logger.log("Turning off Toasts");
					//Set default
					showToasts = BdApi.isSettingEnabled("settings", "general", "showToasts");
					//For BDFDB
					BdApi.injectCSS(config.info.name + "-NoToasts", `.${BDFDB.disCN.toasts} {display:none;}`)
					if (showToasts) {
						BdApi.disableSetting("settings", "general", "showToasts");
					}
				}
				turnOnToasts() {
					Logger.log("Turning on Toasts");

					//For BDFDB
					BdApi.clearCSS(config.info.name + "-NoToasts")
					if (showToasts) {
						BdApi.enableSetting("settings", "general", "showToasts");
					}
				}

				//I stole this directly from https://github.com/Farcrada/DiscordPlugins/blob/master/Hide-Channels/HideChannels.plugin.js 
				//Thanks a lot Farcrada!
				/**
				 * Filters a keybind to work with the `EventListener`s.
				 * @param {(Array.<number>|Array.<Array.<number>>)} keybind Keybind to filter.
				 * @returns {(Array.<number>|Array.<Array.<number>>)} The filtered keybind.
				 */
				filterKeybind(keybind) {
					return keybind.map(keyCode => {
						//Multiple keys
						if (Array.isArray(keyCode[0]))
							for (let i = 0; i < keyCode.length; i++)
								keyCode[i] = fixCode(keyCode[i])
						//Single keys
						else
							keyCode = fixCode(keyCode);
						//Return our fixed keycode.
						return keyCode;

						function fixCode(code) {
							code = code[1];
							switch (code) {
								case 20:                    //Tab: 20 -> 9
									return 9;
								//Fallthrough since it's the same
								case 160:                   //Shift: 160 -> 16 
								case 161:                   //R Shift: 161 -> 16
									return 16;
								//Again
								case 162:                   //Control: 162 -> 17
								case 163:                   //R Control: 163 -> 17
									return 17;
								//And again.
								case 164:                   //Alt: 164 -> 18
								case 165:                   //R Alt: 165 ->  18
									return 18;
								default: return code;       //Other keys? return them;
							}
						}
					});
				}
				stop() {
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
