/**
 * @name EmbedAddons
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/EmbedAddons/EmbedAddons.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/blob/main/EmbedAddons/EmbedAddons.plugin.js
 */
const config = {
	info: {
		name: "EmbedAddons",
		authors: [
			{
				name: "AGreenPig",
				discord_id: "427179231164760066",
				github_username: "TheGreenPig",
			},
		],
		version: "1.0.1",
		description:
			"Easily download BetterDiscord addons and see info about it in chat.",
		github_raw:
			"https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/EmbedAddons/EmbedAddons.plugin.js",
	},
};
const request = require("request");
const fs = require("fs");
/* ----Useful links----
 *
 * BetterDiscord BdApi documentation:
 *   https://github.com/BetterDiscord/BetterDiscord/wiki/Creating-Plugins
 *
 * Zere's Plugin Library documentation:
 * 	 https://rauenzi.github.io/BDPluginLibrary/docs/
 */

module.exports = !global.ZeresPluginLibrary
	? class {
			constructor() {
				this._config = config;
			}
			getName() {
				return config.info.name;
			}
			getAuthor() {
				return config.info.authors.map((a) => a.name).join(", ");
			}
			getDescription() {
				return config.info.description;
			}
			getVersion() {
				return config.info.version;
			}
			load() {
				BdApi.showConfirmationModal(
					"Library Missing",
					`The library plugin needed for **${config.info.name}** is missing. Please click Download Now to install it.`,
					{
						confirmText: "Download Now",
						cancelText: "Cancel",
						onConfirm: () => {
							request.get(
								"https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
								async (error, response, body) => {
									if (error)
										return require("electron").shell.openExternal(
											"https://betterdiscord.app/Download?id=9"
										);
									await new Promise((r) =>
										require("fs").writeFile(
											require("path").join(
												BdApi.Plugins.folder,
												"0PluginLibrary.plugin.js"
											),
											body,
											r
										)
									);
								}
							);
						},
					}
				);
			}
			start() {}
			stop() {}
	  }
	: (([Plugin, Library]) => {
			//Custom css
			const customCSS = `
	.EmbedAddons.Container {
		margin-top: 10px;
		margin-bottom: 10px;
		height: fit-content;
	}
	.EmbedAddons.ThumbnailContainer.Thumbnail {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 5px;
	}
	.EmbedAddons.ThumbnailContainer {
		height: 200px;
	}
	.EmbedAddons.Header {
		padding-bottom: 10px;
		display: flex;
		justify-content: center;
	}
	.EmbedAddons.Info {
		padding: 10px;
	}
	.EmbedAddons.Title {
		color: var(--text-normal);
		font-weight: bold;
	}
	.EmbedAddons.Title:hover {
		text-decoration: none;
	}
	.EmbedAddons.Author {
		display: flex;
	}
	.EmbedAddons.Button {
		transform: translateY(0);
		transition: transform .5s cubic-bezier(0.25, 0.1, 0, 2.29);
	  }
	  .EmbedAddons.Button:active {
		transform: translateY(5px);
	  }

	`;

			//Settings and imports
			const {
				Toasts,
				WebpackModules,
				DCM,
				Patcher,
				React,
				Settings,
				Utilities,
				DiscordModules,
			} = { ...BdApi, ...Library };
			const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

			const releaseChannelRadio = [
				{
					name: "Compact",
					desc: "Only display the download button.",
					value: 0,
				},
				{
					name: "Normal",
					desc: "Display the addon thumbnail, icon and all other information.",
					value: 1,
				},
				{
					name: "None",
					desc: "Do not display any addon data in the release channel.",
					value: 2,
				},
			];

			//default settings
			const defaultSettings = {
				autoEnable: true,
				releaseChannel: 1,
			};
			//Modules
			const Message = WebpackModules.getByProps(
				"default",
				"ThreadStarterChatMessage",
				"getElementFromMessageId"
			);
			const MessageContent = WebpackModules.getModule(
				(m) => m.type?.displayName === "MessageContent"
			);
			let addons;
			let embedCache = {};

			class AddonInfoComponent extends React.Component {
				constructor(props) {
					super(props);
					const type =
						this.props.type.charAt(0).toUpperCase() +
						this.props.type.slice(1) +
						"s";
					this.state = {
						downloadedAddon: BdApi[type]
							.getAll()
							.some(
								(e) =>
									e?.name.toLowerCase().trim() ===
									this.props.name.toLowerCase().trim()
							),
					};
				}
				renderHeader() {
					return React.createElement(
						"div",
						{ className: "EmbedAddons Header" },

						React.createElement(
							"div",
							{ className: "EmbedAddons Author" },
							React.createElement(
								"a",
								{
									className: "title-3UXrP6 EmbedAddons Title",
									href: `https://betterdiscord.app/${this.props.type}?id=${this.props.id}`,
									title: `https://betterdiscord.app/${this.props.type}?id=${this.props.id}`,
									target: `_blank`,
								},

								this.props.name + " "
							),
							`by `,
							React.createElement(
								"a",
								{
									href: `https://github.com/${this.props.author.github_name}`,
									title: `https://github.com/${this.props.author.github_name}`,
									target: `_blank`,
								},
								this.props.author.display_name
							)
						)
					);
				}
				renderImage() {
					return React.createElement(
						"div",
						{ className: "EmbedAddons ThumbnailContainer" },
						React.createElement(
							"a",
							{
								href: `https://betterdiscord.app/${this.props.type}?id=${this.props.id}`,
								title: `https://betterdiscord.app/${this.props.type}?id=${this.props.id}`,
								target: `_blank`,
							},

							React.createElement("img", {
								src: `https://betterdiscord.app${this.props.thumbnail_url}`,
								onError: ({ currentTarget }) => {
									currentTarget.onerror = null;
									currentTarget.src =
										"https://betterdiscord.app/resources/ui/content_thumbnail.svg";
								},
								className: "EmbedAddons ThumbnailContainer Thumbnail",
							})
						)
					);
				}
				renderInfo() {
					return React.createElement(
						"div",
						{ className: "EmbedAddons Info" },
						React.createElement("b", {}, "Description: "),
						this.props.description,
						React.createElement("br"),
						React.createElement("b", {}, "Downloads: "),
						`${this.props.downloads}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1."),
						React.createElement("br"),
						React.createElement("b", {}, "Likes: "),
						`${this.props.likes}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1."),
						React.createElement("br"),
						React.createElement("b", {}, "Tags: "),
						this.props.tags.join(", "),
						React.createElement("br")
					);
				}
				renderDownload() {
					const { compactMode } = this.props;
					const ButtonLooksModule = DiscordModules.ButtonData;
					return React.createElement(
						ButtonLooksModule.default,
						{
							className: "EmbedAddons Button",
							color: this.state.downloadedAddon
								? ButtonLooksModule.ButtonColors.RED
								: ButtonLooksModule.ButtonColors.BRAND,

							onClick: () =>
								this.state.downloadedAddon
									? this.uninstallAddon()
									: this.installAddon(),
						},
						`${this.state.downloadedAddon ? "Uninstall" : "Download"} ${
							compactMode
								? this.props.name
								: this.props.type.charAt(0).toUpperCase() +
								  this.props.type.slice(1)
						}`
					);
				}
				installAddon() {
					request.get(
						`https://betterdiscord.app/Download?id=${this.props.id}`,
						async (error, response, body) => {
							if (error)
								return require("electron").shell.openExternal(
									"https://betterdiscord.app/Download?id=${this.props.id}"
								);
							const type =
								this.props.type.charAt(0).toUpperCase() +
								this.props.type.slice(1) +
								"s";
							const fileName = this.props.latest_source_url.split("/").pop();

							await new Promise((r) =>
								require("fs").writeFile(
									require("path").join(BdApi[type].folder, fileName),
									body,
									r
								)
							);
							BdApi.showToast(`Downloaded ${this.props.name}!`, {
								type: "success",
							});
							this.setState({ downloadedAddon: true });
							if (this.props.settings.autoEnable) {
								const name = body.match(/@name .+/g)[0].replace("@name ", "");

								//do three enabling attempts
								for (let i = 0; i < 3; i++) {
									setTimeout(() => {
										if (BdApi[type].get(name)) {
											BdApi[type].enable(name);
											return;
										}
									}, 500);
								}
							}
						}
					);
				}
				uninstallAddon() {
					try {
						const addonName = this.props.latest_source_url.split("/").pop();
						const path =
							this.props.type === "theme"
								? require("path").join(BdApi.Themes.folder, addonName)
								: require("path").join(BdApi.Plugins.folder, addonName);
						fs.unlinkSync(path);
						BdApi.showToast(`Uninstalled ${this.props.name}!`, {
							type: "success",
						});
						this.setState({ downloadedAddon: false });
					} catch (err) {
						BdApi.showToast(`Error uninstalling ${this.props.name}!`, {
							type: "error",
						});
						console.log(err);
					}
				}
				render() {
					const { compactMode } = this.props;

					return compactMode
						? React.createElement(
								"div",
								{ className: `wrapper-3-JZ_Z EmbedAddons Container` },
								this.renderDownload()
						  )
						: React.createElement(
								"div",
								{ className: `wrapper-3-JZ_Z EmbedAddons Container` },
								this.renderHeader(),
								this.renderImage(),
								this.renderInfo(),
								this.renderDownload()
						  );
				}
			}
			return class EmbedAddons extends Plugin {
				async onStart() {
					//load default settings
					this.settings = this.loadSettings(defaultSettings);

					//inject css
					BdApi.injectCSS(config.info.name, customCSS);

					addons = await this.getAddonCache();
					//add a MessageContent patcher
					Patcher.after(MessageContent, "type", (_, [props], ret) => {
						let removeEmbeds = true;
						let isEmbed = false;
						let addonsInMessage = props.message.content.match(
							/betterdiscord.app\/(Download\?id=\d+|(plugin|theme)\/.+)/gi
						);
						if (
							(props.message.embeds.length > 0 || props.message.addonLink) &&
							this.settings.releaseChannel !== 2
						) {
							let embedMatches = props.message.addonLink
								? props.message.addonLink
								: props.message.embeds[0]?.author?.url?.match(
										/betterdiscord\.app\/(plugin|theme|Download)\?id=\d+/gi
								  );
							if (embedMatches) {
								props.message.addonLink = embedMatches;
								removeEmbeds = this.settings.releaseChannel === 1;
								isEmbed = true;
								addonsInMessage = embedMatches;
							}
						}
						if (addonsInMessage) {
							let addonData = addonsInMessage.map((e) =>
								this.getAddonData(e.split("/"))
							);
							addonData = addonData.filter((e) => e);
							//remove the default embed
							if (!embedCache[props.message.id]) {
								embedCache[props.message.id] = props.message.embeds;
							}

							removeEmbeds && embedCache[props.message.id] && addonData.length>0
								? (props.message.embeds = [])
								: (props.message.embeds = embedCache[props.message.id]);

							addonData.forEach((addon) => {
								let addonComponent = React.createElement(
									AddonInfoComponent,
									Object.assign(
										{
											compactMode:
												this.settings.releaseChannel === 0 && isEmbed,
											settings: this.settings,
											key: addon.id,
										},
										addon
									)
								);
								ret.props.children[0].push(addonComponent);
							});
						}
					});
				}
				getAddonData(addonInfo) {
					addonInfo.shift();
					if (/(Download|theme|plugin)\?id=\d+/.test(addonInfo[0])) {
						const addonId = addonInfo[0].match(/\d+/)[0];
						return addons.find((e) => e.id === parseInt(addonId));
					}
					return addons.find(
						(e) => e.type === addonInfo[0] && e.name === decodeURI(addonInfo[1])
					);
				}
				getAddonCache() {
					return new Promise((resolve, reject) => {
						request(
							`https://api.betterdiscord.app/v1/store/addons`,
							(error, res, body) => {
								if (error) {
									reject("Failed to Fetch the Addon cache: " + error);
								}

								if (!error && res.statusCode == 200) {
									resolve(JSON.parse(body));
								}
							}
						);
					});
				}
				getSettingsPanel() {
					//build the settings pannel
					return SettingPanel.build(
						() => this.saveSettings(this.settings),
						new Switch(
							"Auto Enable",
							"Automatically enable the addon after installation (Might fail).",
							this.settings.autoEnable,
							(i) => {
								this.settings.autoEnable = i;
							}
						),
						new RadioGroup(
							"Show in Addon release channel",
							`Decide if the Addon data should be shown in the plugin/theme-release channel on the BetterDiscord support server or not.`,
							this.settings.releaseChannel || 0,
							releaseChannelRadio,
							(i) => {
								this.settings.releaseChannel = i;
							}
						)
					);
				}
				onStop() {
					BdApi.clearCSS(config.info.name);
					Patcher.unpatchAll(config.info.name);
				}
			};
	  })(global.ZeresPluginLibrary.buildPlugin(config));
