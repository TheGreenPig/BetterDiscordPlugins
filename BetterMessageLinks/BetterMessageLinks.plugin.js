/**
 * @name BetterMessageLinks
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js
 */
 const config = {
	"info": {
		"name": "BetterMessageLinks",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}, {
			"name": "Strencher",
			"discord_id": "415849376598982656",
			"github_username": "Strencher",
			"twitter_username": "Strencher3"
		},
		{
			"name": "Juby210",
			"discord_id": "324622488644616195",
			"github_username": "Juby210"
		}],
		"version": "1.3.1",
		"description": "Instead of just showing the long and useless discord message link, make it smaller and add a preview.",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js",
		"changelog": [
			{
				title: "Added",
				type: "added",
				items: [
					"Be able to turn off the replacement of message or attachment links (for compatibility with HideEmbedLink for example)",
				]
			},
			{
				title: "Fixed",
				type: "fixed",
				items: [
					"Fixed the css slightly to wrap codeblocks and display quotes correctly (Thanks fabJunior)",
				]
			},
		]
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


// This plugin was only made possible by the generous help of Strencher and the MessageLinkEmbed plugin by him and Juby210! They definitely deserve all the credit

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
	const customCSS = `
	.betterMessageLinks.Tooltip {
		max-width: 280px; 
	  	max-height: 450px;
		overflow:auto;  
		-webkit-user-select: text;
	}
	.betterMessageLinks.Tooltip::-webkit-scrollbar {
		display:none;
	}
	.betterMessageLinks em {
		font-style: italic;
	}
	.betterMessageLinks strong {
		font-weight: bold;
	}
	.betterMessageLinks code {
		white-space: pre-wrap;
	}
	.betterMessageLinks blockquote  {
		max-width: calc(100% - 4px);
	}
	.betterMessageLinks.Image {
		border-radius: 10px;
		max-width: 255px;
		padding-top: 5px;
	}
	.betterMessageLinks.Author{
		font-weight: bold;
		padding-right: 5px;
	}
	.betterMessageLinks.AlignMiddle{
		vertical-align: middle;
	}
	.betterMessageLinks.Icon{
		width: 25px;
		height: 25px;
	}
	.betterMessageLinks.BotTag{
		padding-right: 5px;
	}
	.betterMessageLinks.List{
		padding-left: 20px;
		-webkit-user-select: text;
		padding-top: 3px;
	}
	.betterMessageLinks.ListElement{
		font-weight: bold;
	}
	.betterMessageLinks.ListElement.Symbol{
		font-size: 1.1em;
		padding-right: 3px;
	}
	.betterMessageLinks.AlignMiddle.Loading.Line{
		transition: stroke-dashoffset 1s ease;
	}
	.betterMessageLinks.AlignMiddle.Loading.Contour{
		opacity: 0.4;
	}
	.betterMessageLinks.AlignMiddle.Loading.Container{
		transform: rotate(-90deg);
	}
	`
	const defaultSettings = {
		ignoreMessage: false,
		ignoreAttachment: false,
		messageReplaceText: "<Message>",
		attachmentReplaceText: "<Attachment>",
		showAuthorIcon: true,
		showGuildIcon: true,
		progressBar: true,
		advancedTitle: `Author: $authorName, Guild: $guildName, Channel: $channelName, Id: $messageId at $timestamp`,
	};
	const validTitleValues = ["authorName", "guildName", "guildId", "channelName", "channelId", "messageId", "timestamp", "nsfw"]

	//Settings and imports
	const { Toasts, WebpackModules, Patcher, React, Settings, DiscordModules, ReactTools } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox, SettingGroup } = Settings;

	//Modules
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");
	const GetMessageModule = DiscordModules.MessageStore;
	const GetGuildModule = DiscordModules.GuildStore;
	const GetChannelModule = DiscordModules.ChannelStore;
	const TooltipWrapper = WebpackModules.getByPrototypes("renderTooltip");
	const User = WebpackModules.find(m => m.prototype && m.prototype.tag);
	const Timestamp = WebpackModules.find(m => m.prototype && m.prototype.toDate && m.prototype.month)
	const { stringify } = WebpackModules.getByProps('stringify', 'parse', 'encode');
	const ImagePlaceHolder = WebpackModules.findByDisplayName("ImagePlaceholder");
	const BotTag = WebpackModules.findByDisplayName("BotTag");
	const RenderMessageMarkupToASTModule = WebpackModules.getByProps("renderMessageMarkupToAST");
	let cache = {};
	let lastFetch = 0;
	let linkQueue = [];

	async function getMsg(channelId, messageId) {
		let message = GetMessageModule.getMessage(channelId, messageId) || cache[messageId]

		if (!message) {
			if (lastFetch > Date.now() - 2500) await new Promise(r => setTimeout(r, 2500))
			const data = await DiscordModules.APIModule.get({
				url: DiscordModules.DiscordConstants.Endpoints.MESSAGES(channelId),
				query: stringify({
					limit: 1,
					around: messageId
				}),
				retries: 2
			}).catch((error) => {
				return error;
			})
			lastFetch = Date.now()
			if (data.ok) {
				message = data.body[0]

				if (!message) return
				message.author = new User(message.author)
				message.timestamp = new Timestamp(message.timestamp)
			} else {
				cache[messageId] = data;
				return data;
			}

		}
		cache[messageId] = message
		return message;
	}
	const getMsgWithQueue = (() => {
		let pending = Promise.resolve()

		const run = async (channelId, messageId, component) => {
			try {
				await pending
			} finally {
				linkQueue.shift()
				linkQueue.forEach(c => {
					c.setState({ queue: linkQueue })
				})
				return getMsg(channelId, messageId)
			}
		}

		return (channelId, messageId, component) => (pending = run(channelId, messageId, component))
	})()

	class BetterLink extends React.Component {
		constructor(props) {
			super(props)
			this.state = null;
		}
		async componentDidMount() {
			if (!this.state) {
				let numberMatches = this.props.original.props.href.split("/").filter((e) => /^\d+$/.test(e));
				let messageId = numberMatches[numberMatches.length - 1];
				let channelId = numberMatches[numberMatches.length - 2];
				let guildId = numberMatches.length > 2 ? numberMatches[numberMatches.length - 3] : undefined;

				linkQueue.push(this)
				this.setState({ originalIndex: linkQueue.length })
				let message = await getMsgWithQueue(channelId, messageId, this);
				if (!message) return
				message.guild = guildId ? GetGuildModule.getGuild(guildId) : "@me";
				this.setState(message);
			}
		}
		wrapInTooltip(tooltipText, child, color) {
			return React.createElement(TooltipWrapper, {
				color: color,
				tooltipClassName: "betterMessageLinks AlignMiddle Tooltip",
				text: tooltipText,
				disableTooltipPointerEvents: false,
				children: (tipProps) => {
					return React.createElement("span", Object.assign({
						children: [
							child
						],
					}, tipProps))
				}
			})
		}
		render() {
			let messageReplace = this.props.original;
			messageReplace.props.class = `betterMessageLinks Link`

			if (this.props.attachmentLink && this.props.settings.attachmentReplaceText !== "") {
				messageReplace.props.children[0] = this.props.settings.attachmentReplaceText;
			}
			else if (!this.props.attachmentLink && this.props.settings.messageReplaceText !== "") {
				messageReplace.props.children[0] = this.props.settings.messageReplaceText;
			}
			if (!this.state) {
				return this.wrapInTooltip("Loading...", messageReplace, "yellow")
			}

			if (this.state.queue && !this.state.id) {
				let loadedPercent = Math.max(Math.min(Math.round(((this.state.originalIndex - this.state.queue.indexOf(this)) / this.state.originalIndex) * 100), 100), 0);
				if (loadedPercent === 100 && this.props.attachmentLink) return this.wrapInTooltip(this.props.original.props.href.split("/").slice(-1), messageReplace, TooltipWrapper.Colors.PRIMARY);

				const LoadingCircle = (percentage) => {
					const r = 20;
					const circ = 2 * Math.PI * r;
					const strokePct = ((100 - percentage) * circ) / 100;

					return React.createElement("div", {},
						React.createElement("span", { class: "betterMessageLinks AlignMiddle Loading Text" }, `Loading ${loadedPercent}% `),
						React.createElement("svg", { class: "betterMessageLinks AlignMiddle Loading Container", width: 25, viewBox: "0 0 50 50" },
							React.createElement("linearGradient", {
								id: "betterMessageLinksGradient",
								x1: "0%",
								y1: "0%",
								x2: "0%",
								y2: "100%",
							}, React.createElement("stop", {
								offset: "0%",
								stopColor: "#2F997F",
							}), React.createElement("stop", {
								offset: "100%",
								stopColor: "#026C99",
							})),
							React.createElement("circle", {
								class: "betterMessageLinks AlignMiddle Loading Contour",
								r: r,
								cx: 25,
								cy: 25,
								fill: "transparent",
								stroke: "#656566",
								strokeWidth: "5px",
							}),
							React.createElement("circle", {
								class: "betterMessageLinks AlignMiddle Loading Line",
								r: r,
								cx: 25,
								cy: 25,
								fill: "transparent",
								stroke: "url(#betterMessageLinksGradient)",
								strokeWidth: "5px",
								strokeDasharray: circ,
								strokeDashoffset: strokePct,
								strokeLinecap: "round",
							}),
						)
					)

				};
				let loadingBar = this.props.settings.progressBar ? LoadingCircle(loadedPercent) : React.createElement("span", { class: "betterMessageLinks AlignMiddle Loading Text" }, `Loading ${loadedPercent}% `);

				return this.wrapInTooltip(loadingBar, messageReplace, "yellow")
			}
			else if (this.state.ok === false) {
				if (this.props.attachmentLink) {
					//if it's an attachment, display the file name instead of an error 
					let fileName = this.props.original.props.href.split("/").slice(-1);

					return this.wrapInTooltip(fileName, messageReplace, TooltipWrapper.Colors.PRIMARY);
				}
				if (this.state.body?.message) {
					return this.wrapInTooltip(this.state.body?.message, messageReplace, "red")
				}
				return messageReplace;
			}

			let message = this.state;
			let channel = GetChannelModule.getChannel(message.channel_id);
			if (!channel) return messageReplace;

			let messageContent = "";
			if (this.props.attachmentLink) {
				message.content = this.props.original.props.href.split("/").slice(-1);

				messageContent = React.createElement("span", {
					class: "betterMessageLinks AlignMiddle",
					children: message.content
				});
			} else {
				let formattedMessageArray = RenderMessageMarkupToASTModule.default(Object.assign({}, message), { renderMediaEmbeds: true, formatInline: false, isInteracting: true }).content;

				formattedMessageArray = this.processNewLines(formattedMessageArray);

				messageContent = React.createElement("span", {
					class: "betterMessageLinks AlignMiddle",
					children: formattedMessageArray
				});
			}

			let author = message?.author;
			let authorName = author.username;
			let authorId = author.id;
			let guildName, guildId = "";
			let channelName = "";
			let channelId = channel.id;
			let messageId = message.id;
			let timestamp = new Date(message.timestamp).toLocaleString();
			let nsfw = channel.nsfw;

			if (channel.type === DiscordModules.DiscordConstants.ChannelTypes.DM) {
				guildName = "DM";
				guildId = "@me";
				channelName = channel.rawRecipients[0].username;
			}
			else if (channel.type === DiscordModules.DiscordConstants.ChannelTypes.GROUP_DM) {
				guildName = "DMs"
				guildId = "@me";
				channelName = channel.rawRecipients.map((e) => e.username).slice(0, 3).join("-");
			}
			else {
				if (message.guild) {
					guildName = message.guild.name;
					guildId = message.guild.id;
				}
				channelName = "#" + channel.name;
			}

			if (this.props.settings.advancedTitle !== "") {
				let title = this.props.settings.advancedTitle;
				validTitleValues.forEach((value) => {
					title = title.replace("$" + value, eval(value))
				})
				if (title.includes("$")) title = "Invalid variables set! Make sure you don't use $ unless it's a valid variable."
				messageReplace.props.title = title;
			}


			let mention = React.createElement("span", { className: "betterMessageLinks Author AlignMiddle" }, author.username + ":");
			let botIcon = this.props.settings.showAuthorIcon && author.bot ? React.createElement("span", { class: "betterMessageLinks AlignMiddle BotTag" }, React.createElement(BotTag, {})) : null;

			let authorIcon = this.props.settings.showAuthorIcon ? React.createElement("img", { src: author.getAvatarURL(), class: "replyAvatar-1K9Wmr betterMessageLinks AlignMiddle Icon" }) : null;
			let guildIcon = null;
			if (this.props.settings.showGuildIcon && message.guild?.icon && message.guild.id !== ZLibrary.DiscordModules.SelectedGuildStore.getGuildId()) {
				guildIcon = React.createElement("img", { src: `https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.webp`, class: "replyAvatar-1K9Wmr betterMessageLinks AlignMiddle Icon" })
			}

			let attachmentIcon = null;
			let attachment = null;
			if (message.attachments.length > 0 || message.embeds.length > 0) {
				attachmentIcon = React.createElement(ImagePlaceHolder, { width: "20px", height: "20px", class: "betterMessageLinks AlignMiddle" })

				let isVideo = false;
				let url = "";

				if (message.attachments[0]?.content_type?.startsWith("video") || message.embeds[0]?.video) {
					isVideo = true;
				}

				if (message.attachments?.length > 0) {
					url = message.attachments[0].url
				}
				else if (message.embeds?.length > 0) {
					if (message.embeds[0]?.video) {
						url = message.embeds[0].video.url
					}
					else if (message.embeds[0]?.image) {
						url = message.embeds[0]?.image.proxyURL;
					}
				}
				if (url) attachment = isVideo ?
					React.createElement("video",
						{
							class: "betterMessageLinks AlignMiddle Image",
							src: url,
							loop: true, autoPlay: true, muted: true
						})
					: React.createElement("img",
						{
							class: "betterMessageLinks AlignMiddle Image",
							src: url,
						})
			}

			let messagePreview = React.createElement("div", {
				class: "betterMessageLinks AlignMiddle Container",
				children: [
					guildIcon,
					authorIcon,
					botIcon,
					mention,
					attachmentIcon,
					React.createElement("br", {}),
					messageContent,
					attachment,
				]
			});

			let newLink = this.wrapInTooltip(messagePreview, messageReplace, TooltipWrapper.Colors.PRIMARY);

			return newLink
		}

		processNewLines(array) {
			let processedArray = [];
			array.forEach((messageElement) => {
				if (!messageElement.type && messageElement.includes("\n")) {
					processedArray.push(messageElement.split("\n").map(e => React.createElement("div", {}, e)));
				}
				else {
					processedArray.push(messageElement)
				}
			})
			if (processedArray.length === 0) return array;
			return processedArray;
		}
	}
	return class BetterMessageLinks extends Plugin {
		async onStart() {
			//inject css
			BdApi.injectCSS(config.info.name, customCSS)
			this.settings = this.loadSettings(defaultSettings);
			//add a MessageContent patcher
			Patcher.after(config.info.name, MessageContent, "type", (_, [props], ret) => {
				if (ret?.props?.children[0].length > 0) {
					ret.props.children[0].forEach((child, i) => {
						if (/https:\/\/(ptb.|canary.)?discord.com\/channels\/(\d+|@me)\/\d+\/\d+/gi.test(child.props?.href) && !this.settings.ignoreMessage) {
							ret.props.children[0][i] = React.createElement(BetterLink, { original: child, settings: this.settings });
						} else if (/https:\/\/(media|cdn).discordapp.(com|net)\/attachments\/\d+\/\d+\/.+/gi.test(child.props?.href) && !this.settings.ignoreAttachment) {
							ret.props.children[0][i] = React.createElement(BetterLink, { original: child, settings: this.settings, attachmentLink: true });
						}
					});
				}
			})
		}
		getSettingsPanel() {
			let listArray = [];
			validTitleValues.forEach((value) => {
				listArray.push(React.createElement("li", { class: "betterMessageLinks ListElement" },
					React.createElement("span", { class: "betterMessageLinks ListElement Symbol" }, "$"),
					value));
			})
			let unorderedList = React.createElement("ul", {
				children: listArray,
				class: "betterMessageLinks List"
			});

			let messageReplaceGroup = new SettingGroup("Message Replace").append(
				new Textbox("", "Replace all Discord message links with the following text. Leave empty to not change the Discord Link at all.", this.settings.messageReplaceText, (i) => {
					this.settings.messageReplaceText = i;
				}, { placeholder: "<Message>" }),
			)

			let attachmentReplaceGroup = new SettingGroup("Attachment Replace").append(
				new Textbox("", "Replace all Discord Attachment links with the following text. Leave empty to not change the Discord Link at all.", this.settings.attachmentReplaceText, (i) => {
					this.settings.attachmentReplaceText = i;
				}, { placeholder: "<Attachment>" }),
			)

			let appearanceSettingsGroup = new SettingGroup("Appearance").append(
				new Switch("Show Author icon", "Display the icon of the Message Author.", this.settings.showAuthorIcon, (i) => {
					this.settings.showAuthorIcon = i;
				}),
				new Switch("Show Guild icon", "Display the guild icon of the message next to the author icon if you aren't in the same guild as the linked message.", this.settings.showGuildIcon, (i) => {
					this.settings.showGuildIcon = i;
				}),
				new Switch("Show progress bar", "Display a circular progress bar when loading a message.", this.settings.progressBar, (i) => {
					this.settings.progressBar = i;
				}),
				new Textbox("Advanced link title", React.createElement("div", {}, "Changes the title of the link. Use $value to display specific values. Valid values: ", unorderedList), this.settings.advancedTitle, (i) => {
					this.settings.advancedTitle = i;
				}),
			)


			messageReplaceGroup.group.className += " betterMessageLinks Settings Message";
			attachmentReplaceGroup.group.className += " betterMessageLinks Settings Attachment";
			appearanceSettingsGroup.group.className += " betterMessageLinks Settings Appearance";

			this.updateSettingsCSS()
			//build the settings panel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new Switch("Ignore message links", "Message links will not get replaced or have a preview.", this.settings.ignoreMessage, (i) => {
					this.settings.ignoreMessage = i;
					this.updateSettingsCSS()
				}),
				new Switch("Ignore attachment links", "Attachment links will not get replaced or have a preview. (Recommended when using HideEmbedLink for example)", this.settings.ignoreAttachment, (i) => {
					this.settings.ignoreAttachment = i;
					this.updateSettingsCSS()
				}),
				messageReplaceGroup,
				attachmentReplaceGroup,
				appearanceSettingsGroup,
			)

		}
		updateSettingsCSS() {
			let suffix = "";
			if (this.settings.ignoreMessage && this.settings.ignoreAttachment) {
				suffix = `.betterMessageLinks.Settings {display:none;}`;
			}
			else if (this.settings.ignoreMessage) {
				suffix = `.betterMessageLinks.Settings.Message {display:none;}`;
			}
			else if (this.settings.ignoreAttachment) {
				suffix = `.betterMessageLinks.Settings.Attachment {display:none;}`;
			}

			BdApi.injectCSS(config.info.name, customCSS + suffix)
		}


		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
