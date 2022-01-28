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
		"description": "Get an animated status, without abusing the discord api or getting banned.",
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
	let usrstatusCSS;
	//default settings
	const defaultSettings = {
		radio: 0,
	}
	return class USRStatus extends Plugin {
		async onStart() {
			//load default settings
			this.settings = this.loadSettings(defaultSettings);

			//This is my test file... later this will be fetched from my github
			// let usrstatusJSON = await new Promise((resolve, reject) => {
			// 	require("fs").readFile(require("path").join(BdApi.Plugins.folder, "usrstatus_test.json"), 'utf8', (err, data) => {
			// 		if (err) {
			// 			rejcet(err)
			// 		}
			// 		else {
			// 			resolve(JSON.parse(data))
			// 		}
			// 	})
			// })

			// BdApi.injectCSS(config.info.name, this.generateAnimationCss(usrstatusJSON))

			BdApi.injectCSS(config.info.name, `@import url("https://cdn.jsdelivr.net/gh/TheGreenPig/BetterDiscordPlugins/UserStatus/dist/userstatus_internal.css")`)

			//add the data-user-id calss to the status (member list)
			const MemberListItem = await ReactComponents.getComponentByName("MemberListItem");
			Patcher.after(MemberListItem.component.prototype, "render", (_, [props], ret) => {
				let id = ret.props.children.props.user.id;
					ret.props.subText.props.className += ` status${id}`;
			})

			const UserPopout = WebpackModules.getByProps("UserPopoutCustomStatus");
			//The id has to passed to the custom status first
			Patcher.after(UserPopout, "UserPopoutProfileText", (_, [props], ret) => {
				props.customStatus.props.id = props.user.id;
			})
			//add the class
			Patcher.after(UserPopout, "UserPopoutCustomStatus", (_, [props], ret) => {
				ret.props.className += ` status${props.id}`; 
			})

			//need to patch BdApi.findModule(m => m.default.displayName === "UserProfileModalHeader")???
			/*
			Places I still need to patch:
				The friends list
				The ProfileModal
			
			Maybe there is a way to patch the Status component instead so I don't need to have a ton of seperate patchers?
			*/

		}
		/*This method is a little complicated and not very intuitive. Essentially it turnes the json file into a usable css file by 
		calculating the keyframes percentages and bringing everything into correct css syntax. The internal css file only uses the .status classes,
		the other one (the bdfdb version) only the attribute selectors. Does this help with performance? I don't know... let's hope so... 
		In practice I will precomute this and host it on github so the user doesn't have to compute it unnecessarily, so this method
		is really just for me. An example output for a user would be:
		
		Removes the old status
		.status123456789, .[data-user-id="123456789"] .activity-2EQDZv>*,[data-user-id="123456789"] .customStatus-3XAoF9>*,[data-user-id="123456789"] .customStatus-kFfkj5>* {
			display: none!important;
		}
		Adds the new status
		.status123456789, .[data-user-id="123456789"] .activity-2EQDZv::before,[data-user-id="123456789"] .customStatus-3XAoF9::before,[data-user-id="123456789"] .customStatus-kFfkj5::before {
			content: "thumbnail status";
			animation: frames123456789 2s linear infinite;
		}
		Add the keyframes
		@keyframes frames123456789 {
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
				let classes = ["activity-2EQDZv", "customStatus-3XAoF9", "customStatus-kFfkj5"];

				classes = classes.map(e => `[data-user-id="${entry[0]}"] .${e}`);
				css += `.status${entry[0]}>*, ${classes.map(e => e + ">*").join(",")} {display: none!important;}.status${entry[0]}::before, ${classes.map(e => e + "::before").join(",")} {content:"${entry[1].thumb}";animation:frames${entry[0]} ${entry[1].sum}s linear infinite} @keyframes frames${entry[0]}{${cssKeyframes}}`
			});
			//console.log(css);
			return css;
		}

		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));


//[data-user-id="123456789"] .activity-2EQDZv::before,[data-user-id="123456789"] .customStatus-3XAoF9::before,[data-user-id="123456789"] .customStatus-kFfkj5::before

