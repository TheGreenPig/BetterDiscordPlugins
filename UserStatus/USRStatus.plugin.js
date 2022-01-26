/**
 * @name USRStatus
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UserStatus/USRStatus.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/UserStatus/USRStatus.plugin.js
 */
const config = {
	"info": {
		"name": "USRStatus",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "A description",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UserStatus/USRStatus.plugin.js"
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
	//Custom css

	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings, ReactComponents } = { ...BdApi, ...Library };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;
	let usrstatusJSON;
	let css;
	//default settings
	const defaultSettings = {
		radio: 0,
	}
	return class USRStatus extends Plugin {
		async onStart() {
			//load default settings
			this.settings = this.loadSettings(defaultSettings);

			//This is my test file... later this will be fetched from my github
			usrstatusJSON = await new Promise((resolve, reject) => {
				require("fs").readFile(require("path").join(BdApi.Plugins.folder, "usrstatus_test.json"), 'utf8', (err, data) => {
					if (err) {
						rejcet(err)
					}
					else {
						resolve(JSON.parse(data))
					}
				})
			})
			//inject it 
			BdApi.injectCSS(config.info.name, this.generateAnimationCss(usrstatusJSON))

			//add the class to the status (only in the member list currently)
			const MemberListItem = await ReactComponents.getComponentByName("MemberListItem");
			Patcher.after(MemberListItem.component.prototype, "render", (_, [props], ret) => {
				let id = ret.props.children.props.user.id;
				if (usrstatusJSON[id]) {
					ret.props.subText.props.className += " status" + id;
				}
			})

		}
		/*This method is a little complicated and not very intuitive. Essentially it turnes the json file into a usable css file by 
		calculating the keyframes percentages and bringing everything into correct css syntax.
		In practice I will precomute this and host it on github so the user doesn't have to compute it unnecessarily, so this method
		is really just for me. An example output for a user would be:
		
		Removes the old status
		.status123456789 > * {
			display: none!important;
		}
		Adds the new status
		.status123456789::before {
			content: "thumbnail status";
			animation: a123456789 2s linear infinite;
		}
		Add the keyframes
		@keyframes a123456789 {
			0%{content: "First Frame"}
			25%{content: "Second Frame"}
			50%{content: "Third Frame"}
			75%{content: "Fourth Frame"}
			100%{content: "First Frame"}
		}
		*/
		generateAnimationCss(list) {
			let css = ""
			Object.entries(list).forEach(entry => {
				console.log(entry);
				let convertedInstructions = [];
				let frames = entry[1].frames
				convertedInstructions.push([0, Object.keys(frames[0])[0]]);

				let counter = 0;
				for (let i = 1; i < frames.length; i++) {
					convertedInstructions.push([Math.round((Object.values(frames[i - 1])[0] + counter) * 100 / entry[1].sum), Object.keys(frames[i])[0]])
					counter += Object.values(frames[i - 1])[0]
				}
				convertedInstructions.push([100, Object.keys(frames[0])[0]]);

				let cssKeyframes = ""
				convertedInstructions.forEach((e) => {
					cssKeyframes += `${e[0]}%{content:"${e[1]}"}`
				})

				css += `.status${entry[0]} > * {display: none!important;} .status${entry[0]}::before {content:"${entry[1].thumb}";animation:a${entry[0]} ${entry[1].sum}s linear infinite} @keyframes a${entry[0]}{${cssKeyframes}}`
			});
			console.log(css)
			return css;
		}

		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
