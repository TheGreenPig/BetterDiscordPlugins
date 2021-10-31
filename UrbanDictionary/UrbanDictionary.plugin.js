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
		"description": "Display word definitons by Urban Dictionary. Select a word, right click and press Urban Dictionary to see its definition!",
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
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider } = Settings;

	const MessageContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")
	const SlateTextAreaContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "SlateTextAreaContextMenu")

	return class UrbanDictionary extends Plugin {
		async onStart() {
			this.settings = this.loadSettings({ profanity: true, showAmount: 4 });

			BdApi.injectCSS("UrbanDictionary", customCSS)


			Patcher.after("UrbanDictionary", MessageContextMenu, "default", (_, __, ret) => {
				ret.props.children.push(this.getContextMenuItem())
			})


			Patcher.after("UrbanDictionary", SlateTextAreaContextMenu, "default", (_, __, ret) => {
				ret.props.children.push(this.getContextMenuItem())
			})

		}
		getContextMenuItem() {
			let selection = window.getSelection().toString().trim();
			if (selection === "") { return; }
			let word = selection.charAt(0).toUpperCase() + selection.slice(1);

			let ContextMenuItem = DCM.buildMenuItem({
				label: "Urban Dictionary",
				type: "text",
				action: () => {
					fetch(`https://api.urbandictionary.com/v0/define?term=${word.toLocaleLowerCase()}`)
						.then(data => { return data.json() })
						.then(res => {
							this.processDefinitions(word, res);
						})
				}
			})
			return ContextMenuItem;

		}
		async processDefinitions(word, res) {
			if (this.settings.profanity) {
				let wordHasProfanity = await this.containsProfanity(word);
				if (wordHasProfanity) {
					BdApi.alert("That's a bad word!", "Turn off your profanity filter to view this words definition!");
					return;
				}
			}

			if (res?.list?.length === 0) {
				BdApi.alert("No definiton found!", React.createElement("div", { class: "markdown-11q6EU paragraph-3Ejjt0" }, `Couldn't find `, React.createElement("span", { style: { fontWeight: "bold" } }, `"${word}"`), ` on Urban dictionary.`));//
				return;
			}

			let definitionElement = [];
			res.list.sort(function (a, b) {
				return b.thumbs_up - a.thumbs_up;
			})
			for (let i = 0; i < res.list.length && i < this.settings.showAmount; i++) {
				let definitionBlob = res.list[i];

				let definition = definitionBlob.definition.replace(/[\[\]]/g, "");
				let example = definitionBlob.example.replace(/[\[\]]/g, "");
				let likes = definitionBlob.thumbs_up.toString();
				let dislikes = definitionBlob.thumbs_down.toString();
				let author = definitionBlob.author;
				let date = new Date(definitionBlob.written_on).toLocaleString();
				if (this.settings.profanity) {
					definition = await this.filterText(definition);
					example = await this.filterText(example);
				}

				definitionElement.push(React.createElement("div", { class: "UrbanD-Definition" },
					React.createElement("div", { class: "UrbanD-Title" }, "Definition:"),
					React.createElement("div", { class: "UrbanD-Text" }, definition),
					React.createElement("div", { class: "UrbanD-Title" }, "Example:"),
					React.createElement("div", { class: "UrbanD-Text" }, example),
					React.createElement("div", { class: "UrbanD-Info" },
						"Likes: ", React.createElement("span", { class: "UrbanD-Likes" }, likes),
						", Dislikes: ", React.createElement("span", { class: "UrbanD-Likes" }, dislikes),
						", written by ", React.createElement("span", { class: "UrbanD-Author" }, author)),
					React.createElement("div", { class: "UrbanD-Date" }, date),
				))
			}

			BdApi.alert("",
				React.createElement("div", { class: "UrbanD-Wrapper" },
					React.createElement("a", { href: "https://www.urbandictionary.com/", target: "_blank" }, React.createElement("img", { class: "UrbanD-Image", src: "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UD_logo.svg", width: "100" }),),
					React.createElement("a", { href: `https://www.urbandictionary.com/define.php?term=${word}`, target: "_blank" }, React.createElement("div", { class: "UrbanD-Word" }, word)),
					definitionElement
				)
			)
		}
		async containsProfanity(text) {
			return fetch(`https://www.purgomalum.com/service/containsprofanity?text=${text}`)
				.then(data => {
					return data.json()
				})
				.then(res => {
					return res;
				})

		}
		async filterText(text) {
			return fetch(`https://www.purgomalum.com/service/plain?text=${text}`)
				.then(data => {
					return data.text()
				})
				.then(res => {
					return res;
				})

		}
		getSettingsPanel() {
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new Switch("Profanity Filter", "Censor definitions that contain profanity. This filter will not perfect, you might still encounter definitions or examples that are NSWF. The filer used is `https://www.purgomalum.com/`.", this.settings.profanity, (i) => {
					this.settings.profanity = i;
				}),
				new Slider("Amount of definitions", "Defines how many definitions of the word you want to get displayed. More definitions will take longer to load (especially with the Profanity Filter turned on).", 1, 10, this.settings.showAmount, (i) => {
					this.settings.showAmount = i;
				}, { markers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], stickToMarkers: true })
			)

		}
		onStop() {
			BdApi.clearCSS("UrbanDictionary")
			Patcher.unpatchAll("UrbanDictionary");
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
