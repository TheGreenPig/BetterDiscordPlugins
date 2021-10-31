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
		"version": "1.0.1",
		"description": "Display word definitons by Urban Dictionary.",
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
	const customCSS = `
	.UrbanD-Word {
		clear: left;
		color: var(--header-primary);
		font-size: 1.3em;
		text-align: center;
		font-weight: bold;
		text-decoration: underline;
	}
	.UrbanD-Title {
		font-weight: 600;
		color: var(--text-normal);
		font-size: 1.1em;
	}
	.UrbanD-Text {
		color: var(--text-normal);
		padding-bottom: 15px;
	}
	.UrbanD-Image {
		float: left;
		margin-bottom: 30;
	}
	.UrbanD-Info {
		color: var(--text-normal);
		font-size: 0.9em;
		padding-top: 15px;
	}
	.UrbanD-Likes {
		font-weight: bold;
	}
	.UrbanD-Author {
		font-weight: bold;
	}
	.UrbanD-Date {
		color: var(--text-muted);
		font-size: 0.8em;
	}
	.UrbanD-Wrapper {
		-webkit-user-select: text;
	}
	.UrbanD-Definition {
		background-color: var(--background-secondary);
		border-radius: 15px;
		padding: 10px;
		margin-top: 20px;
	}
	`
	const { Toasts, WebpackModules, DCM, Patcher, React } = { ...Library, ...BdApi };
	const item = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")
	return class UrbanDictionary extends Plugin {
		async onStart() {
			BdApi.injectCSS("UrbanDictionary", customCSS)
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
									if(res?.list?.length===0) { BdApi.alert("No definiton found!", `Couldn't find "${word}" on Urban dictionary.`);return;}

									let definitionElement = [];
									res.list.sort(function(a, b) { 
										return b.thumbs_up-a.thumbs_up;
									})
									for(let i=0; i<res.list.length;i++) {
										let definitionBlob = res.list[i];

										let definition = definitionBlob.definition.replace(/[\[\]]/g, "");
										let example = definitionBlob.example.replace(/[\[\]]/g, "");
										let likes =  definitionBlob.thumbs_up.toString();
										let dislikes =  definitionBlob.thumbs_down.toString();
										let author = definitionBlob.author;
										let date = new Date(definitionBlob.written_on).toLocaleString();

										definitionElement.push(React.createElement("div", {class: "UrbanD-Definition"},  
											React.createElement("div", {class: "UrbanD-Title"}, "Definition:"),
											React.createElement("div", {class: "UrbanD-Text"}, definition),
											React.createElement("div", {class: "UrbanD-Title"}, "Example:"),
											React.createElement("div", {class: "UrbanD-Text"}, example),
											React.createElement("div", {class: "UrbanD-Info"}, 
												"Likes: ", React.createElement("span", {class: "UrbanD-Likes"}, likes), 
												", Dislikes: ",React.createElement("span", {class: "UrbanD-Likes"}, dislikes),
												", written by ", React.createElement("span", {class: "UrbanD-Author"}, author)),
											React.createElement("div", {class: "UrbanD-Date"}, date),
										))
									}

									BdApi.alert("", 
										React.createElement("div", {class: "UrbanD-Wrapper"}, 
											React.createElement("a", {href: "https://www.urbandictionary.com/", target: "_blank"}, React.createElement("img", {class: "UrbanD-Image", src: "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UD_logo.svg", width:"100"}), ),
											React.createElement("a", {href: `https://www.urbandictionary.com/define.php?term=${word}`, target: "_blank"}, React.createElement("div", {class: "UrbanD-Word"}, word)),
											definitionElement
										)
									)
								})
						}
					})
					component.props.children.push(item)
				}

			})

		}
		onStop() {
			BdApi.clearCSS("UrbanDictionary")
			Patcher.unpatchAll("UrbanDictionary");
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
