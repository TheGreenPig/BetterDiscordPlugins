/**
 * @name ClassModule
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/ClassModule/ClassModule.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/ClassModule/ClassModule.plugin.js
 * @invite JsqBVSCugb
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
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox, SettingField, SettingGroup } = Settings;

	//Modules
	const MessageContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu");
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");

	return class ClassModule extends Plugin {
		async onStart() {

		}
		getSettingsPanel() {
			let classInfoDiv = document.createElement("div");
			classInfoDiv.classList = "plugin-input-container";
			classInfoDiv.style.userSelect = "text";

			let classInfoTitle = document.createElement("h5");
			classInfoTitle.textContent = "Results:";
			classInfoTitle.classList = DiscordClassModules.Titles.h5
			classInfoDiv.appendChild(classInfoTitle);

			let classInfoResults = document.createElement("div");
			classInfoDiv.appendChild(classInfoResults);

			//build the settings pannel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new Textbox("Class converter", "", "", (i) => {
					let found = this.searchClass(i);
					classInfoResults.textContent = "";

					if (found && i !== "") {
						for (const groupResult in found) {
							let resultGroupNode = document.createElement("div");
							let resultGroupTitle = document.createElement("label");
							resultGroupTitle.classList = DiscordClassModules.Dividers.title;
							resultGroupTitle.textContent = groupResult;
							let resultList = document.createElement("ul");
							resultList.classList = "colorStandard-21JIj7 size14-3fJ-ot description-30xx7u formText-2ngGjI modeDefault-2fEh7a"
							resultList.style.listStyleType = "disc"
							resultList.style.paddingLeft = "30px"


							for (const results in found[groupResult]) {
								let result = document.createElement("li");
								result.style.marginBottom = "10px"
								let resultText = document.createElement("span");
								resultText.textContent = `${results}: ${found[groupResult][results]}`;
								let copyButton = document.createElement("button");
								copyButton.textContent = "Copy";

								Object.assign(copyButton.style, {
									backgroundColor: "var(--brand-experiment)",
									color: "var(--text-normal)",
									padding: "0.3em",
									fontSize: "0.9em",
									borderRadius: "5px",
									marginLeft: "15px",
								})

								result.appendChild(resultText);
								result.appendChild(copyButton);

								resultList.appendChild(result);
							}

							resultGroupNode.appendChild(resultGroupTitle);
							resultGroupNode.appendChild(resultList);
							classInfoResults.appendChild(resultGroupNode);
						}
					}

				}),
				classInfoDiv
			)

		}
		searchClass(toSearch) {
			toSearch = toSearch.toLowerCase();
			let r = Object.assign({}, DiscordClassModules);
			console.log(r);

			for (const group in DiscordClassModules) {
				for (const key in DiscordClassModules[group]) {
					let value = DiscordClassModules[group][key].toLowerCase();
					if (!value.includes(toSearch) || !key.toLowerCase().includes(toSearch)) {
						console.log(r[group][key]);
					}
				}
			}
			return r;
		}

		observer(changes) {
			let element = changes.target;
			switch (element?.tagName) {
				case "BD-THEMES":
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
			let importMatches = style.match(/\/\*\s*DiscordClassModules\s*\*\/\s*\n@import url\(.+\);\s*/g);
			return new Promise((resolve, reject) => {
				if (importMatches) {
					let imports = importMatches[0];
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
