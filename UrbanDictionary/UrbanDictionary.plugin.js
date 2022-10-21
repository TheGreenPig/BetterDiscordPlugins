/**
 * @name UrbanDictionary
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UrbanDictionary.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UrbanDictionary.plugin.js
 * @version 1.2.0
 */
const config = {
	info: {
		name: "UrbanDictionary",
		authors: [
			{
				name: "AGreenPig",
				discord_id: "427179231164760066",
				github_username: "TheGreenPig",
			},
		],
		version: "1.2.0",
		description:
			"Display word definitions  by Urban Dictionary. Select a word, right click and press Urban Dictionary to see its definition!",
		github_raw:
			"https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UrbanDictionary.plugin.js",
	},
	changelog: [
		{
			title: "Fixed",
			type: "fixed",
			items: ["Plugin works again (Context menu Patching fix)"],
		},
	],
};

class Dummy {
	constructor() {
		this._config = config;
	}
	start() {}
	stop() {}
}

if (!global.ZeresPluginLibrary) {
	BdApi.showConfirmationModal(
		"Library Missing",
		`The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`,
		{
			confirmText: "Download Now",
			cancelText: "Cancel",
			onConfirm: () => {
				require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
					if (err) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
					if (resp.statusCode === 302) {
						require("request").get(resp.headers.location, async (error, response, content) => {
							if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
							await new Promise((r) =>
								require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r)
							);
						});
					} else {
						await new Promise((r) =>
							require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r)
						);
					}
				});
			},
		}
	);
}

module.exports = !global.ZeresPluginLibrary
	? Dummy
	: (([Plugin, Library]) => {
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
	`;
			const {
				React,
				Settings,
				Logger,
				Webpack: { Filters, getBulk },
				ContextMenu,
			} = { ...Library, ...BdApi };
			const { SettingPanel, Slider, RadioGroup } = Settings;
			const Classes = {};
			Object.assign(
				Classes,
				...getBulk.apply(
					null,
					[
						Filters.byProps("menu", "styleFlexible"),
						Filters.byProps("item", "labelContainer"),
						Filters.byProps("layerContainer"),
						Filters.byProps("markdown", "paragraph"),
					].map((fn) => ({ filter: fn }))
				)
			);
			let profanityArray = [];
			const contextMenus = [];

			const profanityOptions = [
				{
					name: "None",
					desc: "No profanity filter.",
					value: 0,
				},
				{
					name: "Small",
					desc: "About 450 words from https://raw.githubusercontent.com/web-mech/badwords/master/lib/lang.json",
					value: 1,
				},
				{
					name: "Large",
					desc: "(Recommended) About 2800 words from https://raw.githubusercontent.com/zacanger/profane-words/master/words.json",
					value: 2,
				},
				{
					name: "External Api",
					desc: `Uses the https://www.purgomalum.com/ api. Probably the best filter, but is not local and rather slow. This filter is not local, I do not have any control over this Api, use it carefully.`,
					value: 3,
				},
			];

			const UrbanIcon = () =>
				React.createElement(
					"svg",
					{
						width: "18",
						height: "18",
						viewBox: "0 0 145.2 88.7",
					},
					React.createElement("path", {
						style: {
							fill: "currentColor",
						},
						d: "M77.4,57.2c.3-9.8,3-19.1,10.4-26.6,6.5-6.5,14.6-7.8,22.9-3.9,2,1,4.1,1.8,6.2,2.5,.8,.3,2.5,0,2.8-.5,.8-1.3,1.7-3.3,1.3-4.4-1.6-3.6-2-7.2-1.6-10.9,.3-2.7-1.4-4.1-4-4.4-3.6-.3-7.2-1-10.8-1.6-1.5-.2-1.9-1.2-1.7-2.7,.7-4.6,1.2-5,5.7-4.6,2.7,.2,5.4,.6,8.2,.8,.8,0,1.6-.5,2.3-.4,2.3,.1,4.8-.2,6.7,.8,1.9,1.1,2.7,3.4,2,6.1-.5,1.8,.1,3.9,0,5.8,0,3-.2,6.1-.2,9.1,0,2.4,.3,4.9,.3,7.3,0,1.9-.3,3.7-.4,5.6,0,.9,.1,1.9,.3,2.8,0,.3,.4,.6,.3,.9-.3,3.1-.8,6.2-.9,9.2,0,2.2,.6,4.4,1,6.6,.8,5.3,1.5,10.7,2.5,16,.2,1,.9,2.1,1.7,2.8,2.8,2.3,6,3.8,9.7,4.2,1.1,.1,2.8,1,2.9,1.7,.2,1.5,0,3.6-.8,4.5-3.5,3.4-7.8,4.3-12.6,3.3-1.3-.3-2.7,.2-4,.3-.7,0-1.6,0-2-.5-5.1-4.4-10.1-3.7-15.9-.8-10.9,5.5-18.6,.8-24.8-6.5-5.4-6.3-7.4-14-7.5-22.7Zm38,10.2c.4-1.1,.7-3.4,1.8-5.2,2.2-3.3,1.9-6.5,1-10.1-.6-2.4-.9-5.1-.5-7.5,.4-2.7-1.1-5.6-4-6.2-.5-.1-1.2-.3-1.5-.7-2.3-3.4-6-3.7-9.5-4.1-1.6-.1-3.7,.2-4.9,1.2-2.9,2.3-5.7,4.9-8,7.8-1.2,1.5-1.7,3.9-1.9,5.9-.2,2,1,4.3,.4,6.1-1.3,4.2-.5,7.7,2.2,10.9,2.9,3.5,6.1,6.8,9.2,10.2,.4,.5,1.4,1,1.9,.8,3.4-1.3,7.3-1.6,9.5-5.4,.8-1.3,2.4-2.1,4.3-3.7Z",
					}),
					React.createElement("path", {
						style: {
							fill: "currentColor",
						},
						d: "M66,73.1c2-1.9,3.5-1,5.1,0,2.9,1.8,5.8,3.5,8.8,5.2,1.2,.7,1.3,1.4,1.2,2.8-.4,3.5-2.3,4.8-5.5,5.9-9.1,3.1-17-.1-25-3.6-2.2-.9-3.9-1.2-6.1-.2-3.2,1.4-6.6,2.3-9.8,3.6-5.8,2.3-10.3-.2-14.6-3.6-.5-.4-.9-1-1.4-1.6-.7,.4-1.4,.7-2.2,1.2-1.3-1.6-2.1-3.3-2-5.6,.4-5.9,.7-11.8,.8-17.7,0-3.5-.6-7.1-.6-10.6,0-2,.4-4,.8-5.9,.5-3.1,0-6.1-1.4-9-.8-1.6-1.9-2.6-3.8-1.7-4,1.7-6.5-.9-8.9-3.3-.7-.7-1.4-2.6-1.1-3,1.2-1.3,2.8-2.9,4.5-3.2,4.6-.8,9.2-.3,13.7,1,4.8,1.4,6.2,1.7,5.5,8.2-.3,2.5-.8,4.9-1.2,7.4-.4,2.4-1.7,4.7,0,7.2,.4,.5-.1,1.8-.3,2.6-1.6,6.5,.3,12.9,1.2,19.3,.2,1.5,.3,3.8,1.3,4.3,2.4,1.3,5.3,2.5,8,2.5,5.9,0,11.2-2.3,16.1-5.4,.8-.5,1.6-1.6,1.7-2.5,1.2-5.7,2.4-11.4,3.3-17.1,.6-3.9,.7-7.9,1.2-11.9,0-.8,.7-1.6,1.2-2.3,1-1.5,1.1-2.6-.5-3.8-1.8-1.3-3.6-2.2-6-2-2.2,.2-4.3,0-6.5,0-1.7,0-2.6-.6-2.9-2.3-.3-1.6,0-2.6,1.7-3,.6-.1,1.1-.4,1.6-.8,2.8-1.7,5.5-1.8,8.5-.3,1.4,.7,3.7,1.1,4.9,.5,4-2.2,8.1,2.1,7.5,6.1-.6,3.9-1,7.9-1.1,11.9,0,1.8,.6,3.6,.7,5.4,0,1-.4,2.1-.7,3.2-.1,.5-.4,1.1-.4,1.6,.9,6.7,1.9,13.3,2.9,20.5Z",
					})
				);

			return class UrbanDictionary extends Plugin {
				async onStart() {
					this.settings = this.loadSettings({ profanity: true, showAmount: 4, filter: 2 });
					profanityArray = await this.updateProfanityArray(this.settings.filter);
					this.patchContextMenu();

					BdApi.injectCSS(config.info.name, customCSS);
				}
				patchContextMenu() {
					const menus = ["message", "textarea-context"];
					for (const menu of menus) {
						contextMenus.push(
							ContextMenu.patch(menu, (retVal, props) => {
								let selection = window.getSelection().toString().trim();
								if (selection === "") {
									return;
								}
								const newItem = ContextMenu.buildItem({
									label: "Urban Dictionary",
									id: "urban-dictionary",
									action: () => this.fetchSelectedWord(selection),
									icon: () => UrbanIcon(),
								});
								retVal.props.children.push(newItem);
							})
						);
					}
				}
				async fetchSelectedWord(selection) {
					let word = selection.charAt(0).toUpperCase() + selection.slice(1);

					Logger.log(`Fetching "${word}"...`);
					fetch(`https://api.urbandictionary.com/v0/define?term=${word.toLocaleLowerCase()}`)
						.then((data) => {
							return data.json();
						})
						.then((res) => {
							Logger.log(`Denifitions of "${word}" fetched.`);
							this.processDefinitions(word, res);
						});
				}
				async processDefinitions(word, res) {
					if (this.settings.filter !== 0) {
						let wordHasProfanity = await this.containsProfanity(word);
						if (wordHasProfanity) {
							BdApi.alert("That's a bad word!", "Turn off your profanity filter to view this words definition!");
							return;
						}
					}

					if (res?.list?.length === 0) {
						BdApi.alert(
							"No definiton found!",
							React.createElement(
								"div",
								{ class: `${Classes.markdown} ${Classes.paragraph}` },
								`Couldn't find `,
								React.createElement("span", { style: { fontWeight: "bold" } }, `"${word}"`),
								` on Urban dictionary.`
							)
						); //
						return;
					}

					let definitionElement = [];
					res.list.sort(function (a, b) {
						return b.thumbs_up - a.thumbs_up;
					});
					for (let i = 0; i < res.list.length && i < this.settings.showAmount; i++) {
						let definitionBlob = res.list[i];

						let definition = definitionBlob.definition.replace(/[\[\]]/g, "");
						let example = definitionBlob.example.replace(/[\[\]]/g, "");
						let likes = definitionBlob.thumbs_up.toString();
						let dislikes = definitionBlob.thumbs_down.toString();
						let author = definitionBlob.author;
						let date = new Date(definitionBlob.written_on).toLocaleString();
						if (this.settings.filter !== 0) {
							definition = await this.filterText(definition);
							example = await this.filterText(example);
						}

						definitionElement.push(
							React.createElement(
								"div",
								{ class: "UrbanD-Definition" },
								React.createElement("div", { class: "UrbanD-Title" }, "Definition:"),
								React.createElement("div", { class: "UrbanD-Text" }, definition),
								React.createElement("div", { class: "UrbanD-Title" }, "Example:"),
								React.createElement("div", { class: "UrbanD-Text" }, example),
								React.createElement(
									"div",
									{ class: "UrbanD-Info" },
									"Likes: ",
									React.createElement("span", { class: "UrbanD-Likes" }, likes),
									", Dislikes: ",
									React.createElement("span", { class: "UrbanD-Likes" }, dislikes),
									", written by ",
									React.createElement("span", { class: "UrbanD-Author" }, author)
								),
								React.createElement("div", { class: "UrbanD-Date" }, date)
							)
						);
					}

					BdApi.alert(
						"",
						React.createElement(
							"div",
							{ class: "UrbanD-Wrapper" },
							React.createElement(
								"a",
								{ href: "https://www.urbandictionary.com/", target: "_blank" },
								React.createElement("img", {
									class: "UrbanD-Image",
									src: "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/UrbanDictionary/UD_logo.svg",
									width: "100",
								})
							),
							React.createElement(
								"a",
								{ href: `https://www.urbandictionary.com/define.php?term=${word}`, target: "_blank" },
								React.createElement("div", { class: "UrbanD-Word" }, word)
							),
							definitionElement
						)
					);
				}
				async containsProfanity(text) {
					if (this.settings.filter === 3) {
						return await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${text}`)
							.then((data) => {
								return data.json();
							})
							.then((res) => {
								return res;
							});
					}

					text = text.toLowerCase();
					let wordArray = text.match(/\w+/gi);
					let hasProfanity = false;
					wordArray.forEach((word) => {
						if (profanityArray.includes(word)) {
							hasProfanity = true;
						}
					});
					return hasProfanity;
				}
				async filterText(text) {
					if (this.settings.filter === 3) {
						return await fetch(`https://www.purgomalum.com/service/plain?text=${text}`)
							.then((data) => {
								return data.text();
							})
							.then((res) => {
								return res;
							});
					}
					let wordArray = text.match(/\w+/gi);
					let newText = text;
					wordArray.forEach((word) => {
						if (profanityArray.includes(word.toLowerCase())) {
							newText = newText.replace(word, "*".repeat(word.length));
						}
					});
					return newText;
				}
				async updateProfanityArray(option) {
					let url;
					switch (option) {
						case 3:
						case 0:
							profanityArray = [];
							return;
						case 1:
							url = "https://raw.githubusercontent.com/web-mech/badwords/master/lib/lang.json";
							break;
						case 2:
							url = "https://raw.githubusercontent.com/zacanger/profane-words/master/words.json";
							break;
					}
					fetch(url)
						.then((data) => {
							return data.json();
						})
						.then((res) => {
							profanityArray = res.words ? res.words : res;
						});
				}
				getSettingsPanel() {
					return SettingPanel.build(
						() => this.saveSettings(this.settings),
						new RadioGroup(
							"Filter",
							`Choose if you want to turn on a profanity filter. The pop-up might take longer until it's displayed. Not all filters are perfect, you might still see text that is NSFW.`,
							this.settings.filter || 0,
							profanityOptions,
							(i) => {
								this.settings.filter = i;
								profanityArray = this.updateProfanityArray(i);
							}
						),
						new Slider(
							"Amount of definitions",
							"Defines how many definitions of the word you want to get displayed. More definitions will take longer to load (especially with the Profanity Filter turned on).",
							1,
							10,
							this.settings.showAmount,
							(i) => {
								this.settings.showAmount = i;
							},
							{ markers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], stickToMarkers: true }
						)
					);
				}
				onStop() {
					BdApi.clearCSS(config.info.name);
					for (const cancel of contextMenus) cancel();
				}
			};
	  })(global.ZeresPluginLibrary.buildPlugin(config));
