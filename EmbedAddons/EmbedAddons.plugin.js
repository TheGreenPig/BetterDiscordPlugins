/**
 * @name EmbedAddons
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/EmbedAddons/EmbedAddons.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/blob/main/EmbedAddons/EmbedAddons.plugin.js
 * @version 1.0.3
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
		version: "1.0.3",
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
			//Settings and imports
			const {
				WebpackModules,
				Patcher,
				React,
				Settings,
				DiscordModules,
			} = { ...BdApi, ...Library };
			//Custom css
			const customCSS = `
			.EmbedAddons.Container {
				margin-top: 10px;
				margin-bottom: 10px;
			}
			.EmbedAddons.Card {
				min-height: 350px;
				max-width: 400px;
				height: fit-content;
			}
			.EmbedAddons.Description {
				margin: 10px;
			}
			.EmbedAddons.Button {
				margin: 10px 0;
				transform: translateY(0);
				transition: transform .5s cubic-bezier(0.25, 0.1, 0, 2.29);
			}
			.EmbedAddons.Button:active {
				transform: translateY(5px);
			}
			`;
			const { SettingPanel, Switch, RadioGroup } = Settings;

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
			const MessageContent = WebpackModules.getModule(
				(m) => m.type?.displayName === "MessageContent"
			);
			const GuildDiscoveryClasses = WebpackModules.getModule(
				(m) => m.cardPlaceholder && m.actionButtons
			);
			const DownloadIcon = WebpackModules.findByDisplayName("Download");
			const HeartIcon = WebpackModules.findByDisplayName("Heart");
			const Mask = WebpackModules.getModule((m) => m.displayName === "Mask");
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
				renderCardHeader() {
					const {
						cardHeader,
						splash,
						splashImage,
						guildIcon,
						iconMask,
						avatar,
					} = GuildDiscoveryClasses;

					function Avatar({ githubName }) {
						return React.createElement(
							"div",
							{ className: guildIcon },
							React.createElement(Mask, {
								children: React.createElement(
									"div",
									{ className: iconMask },
									React.createElement(
										Mask,
										{
											height: 40,
											width: 40,
											mask: Mask.Masks.SQUIRCLE,
										},
										React.createElement(
											"a",
											{
												href: `https://github.com/${githubName}`,
												title: `https://github.com/${githubName}`,
												target: "_blank",
											},
											React.createElement("img", {
												className: avatar+" EmbedAddons Avatar",
												src: `https://github.com/${githubName}.png`,
											})
										)
									)
								),
								height: 48,
								width: 48,
								mask: Mask.Masks.SQUIRCLE,
							})
						);
					}
					return React.createElement(
						"div",
						{ className: cardHeader, style: { height: "200px", marginBottom: "16px" } },
						React.createElement(
							"div",
							{ className: splash },
							React.createElement("img", {
								src: `https://betterdiscord.app${this.props.thumbnail_url}`,
								onError: ({ currentTarget }) => {
									currentTarget.onerror = null;
									currentTarget.style.objectFit = "contain";
									currentTarget.src = "https://betterdiscord.app/resources/ui/content_thumbnail.svg";
								},
								className: splashImage,
								style: { height: "200px" },
							})
						),
						React.createElement(Avatar, {
							githubName: this.props.author.github_name
						})
					);
				}
				renderCardInfo() {
					const {
						guildInfo,
						title,
						guildName,
						memberInfo,
						memberCount,
						description,
					} = GuildDiscoveryClasses;

					return React.createElement(
						"div",
						{
							className: guildInfo,
						},
						React.createElement(
							"div",
							{
								className: title,
							},
							React.createElement(
								"h4",
								{
									className: guildName,
								},
								this.props.name
							)
						),
						React.createElement(
							"div",
							{
								className: description,
								style: { margin: "4px 0 0 0" }
							},
							this.props.description
						),
						this.renderDownload(),
						React.createElement(
							"div",
							{
								className: memberInfo,
							},
							React.createElement(
								"div",
								{
									className: memberCount,
								},
								React.createElement(DownloadIcon, {
									className: " EmbedAddons DownloadButton",
								}),
								React.createElement(
									"div",
									{
										className: "colorHeaderSecondary-g5teka size12-oc4dx4",
									},
									`${this.props.downloads
										.toString()
										.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")} Downloads`
								)
							),
							React.createElement(
								"div",
								{
									className: memberCount,
								},
								React.createElement(HeartIcon, {
									className: "EmbedAddons LikeButton",
								}),
								React.createElement(
									"div",
									{
										className: "colorHeaderSecondary-g5teka size12-oc4dx4",
									},
									`${this.props.likes
										.toString()
										.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")} Likes`
								)
							)
						)
					);
				}
				render() {
					const { compactMode } = this.props;

					const { loaded, card } = GuildDiscoveryClasses;

					return compactMode
						? this.renderDownload()
						: React.createElement(
								"div",
								{ className: loaded + " EmbedAddons Container" },
								React.createElement(
									"div",
									{
										className: card + " EmbedAddons Card",
									},
									this.renderCardHeader(),
									this.renderCardInfo()
								)
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

							removeEmbeds &&
							embedCache[props.message.id] &&
							addonData.length > 0
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
