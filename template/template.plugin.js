/**
 * @name template
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/template/template.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/template/template.plugin.js
 * @invite JsqBVSCugb
 */
const config = {
	"info": {
		"name": "template",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "A description",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/template/template.plugin.js"
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
	.aRedChild {
		color: red;
	}
	.messageClass {
		background-color: white;
		border-radius: 2px;
	}
	`

	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

	//Modules
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");
	//A radio setting
	const radioOptions = [
		{
			name: 'Option 1',
			desc: 'Description 1',
			value: 0
		},
		{
			name: 'Option 2',
			desc: 'Description 2',
			value: 1
		},
	]

	//default settings
	const defaultSettings = {
		radio: 0,
		toggle: true,
		text: "Hello",
		slider: 1,
	}
	return class template extends Plugin {
		async onStart() {
			//load default settings
			this.settings = this.loadSettings(defaultSettings);
			//inject css
			BdApi.injectCSS(config.info.name, customCSS)

			//add a MessageContent patcher
			Patcher.after(config.info.name, MessageContent, "type", (_, [props], ret) => {
				ret.props.children[0].push(React.createElement("div", {
					className: "aRedChild",
					onClick: () => { console.log(`Message with id "${props.message.id}" was clicked!`) }
				}, "A child was added to this message!")
				)
			})
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
