/**
 * @name UrbanDictionary
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UrbanDictionary.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UrbanDictionary.plugin.js
 */
const config = {
	"info": {
		"name": "UrbanDictionary",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "Turn off every Theme and Plugin with a shortcut.",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UrbanDictionary.plugin.js"
	},
}
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

	const { Toasts, WebpackModules, DCM, Patcher, React } = { ...Library, ...BdApi };
	const item = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")
	return class UrbanDictionary extends Plugin {
		async onStart() {
			Patcher.after("UrbanDictionary", item, "default", (_, args, component) => {
				let props = args[0]
				let message = props.message
				let selection = window.getSelection().toString().trim();
				if (selection === "") { return; }
				let word = selection.charAt(0).toUpperCase() + selection.slice(1);
				if (message.content) {
					let item = DCM.buildMenuItem({
						label: "Urban Dictionary",
						type: "text",
						action: () => {
							fetch(`https://api.urbandictionary.com/v0/define?term=${word.toLocaleLowerCase()}`)
								.then(data => { return data.json() })
								.then(res => {
									if(res?.list?.length===0) { console.log(`%c"${word}" was not found in Urban Dictionary!`, `color:red;`);return;}
									let definition = res.list[0].definition.replace(/[\[\]]/g, "");
									let example = res.list[0].example.replace(/[\[\]]/g, "");
									let likes =  res.list[0].thumbs_up.toString();
									let author = res.list[0].author;
									let date = res.list[0].written_on;

									console.log(`%c${word}%c \n\n%cDefinition:%c\n${definition}\n\n%cExample:%c\n${example}\n\nLikes: ${likes}, by %c${author}%c\n${date}`, `font-size: 1.2em; font-weight: bold; text-decoration: underline`, ``, `font-weight: bold; color:red;`, ``, `font-weight: bold;color:red;`, ``, `color: green;`, ``)
								})
						}
					})
					component.props.children.push(item)
				}

			})

		}
		onStop() {
			Patcher.unpatchAll("UrbanDictionary");
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));