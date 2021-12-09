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
		"version": "1.2.4",
		"description": "Instead of just showing the long and useless discord message link, make it smaller and add a preview.",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js"
	},
	"changelog": [
		{
			"title": "Added:",
			"type": "Added",
			"items": [
				"Bot tag",
				"Icon for embed",
			]
		},
	],
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
	  	max-height: 450px;;
	  	overflow: hidden;
	}
	.betterMessageLinks > em {
		font-style: italic;
	}
	.betterMessageLinks > strong {
		font-weight: bold;
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
	`
	const defaultSettings = {
		messageReplaceText: "<Message>",
		attachmentReplaceText: "<Attachment>",
		showAuthorIcon: true,
		showGuildIcon: true,
		advancedTitle: `Author: $authorName, Guild: $guildName, Channel: $channelName, Id: $messageId at $timestamp`,
	};
	const validTitleValues = ["authorName", "guildName", "guildId", "channelName", "channelId", "messageId", "timestamp", "nsfw"]

	//Settings and imports
	const { Toasts, WebpackModules, Patcher, React, Settings, DiscordModules } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

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
	let displayCharacters = 500;

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

		const run = async (channelId, messageId) => {
			try {
				await pending
			} finally {
				return getMsg(channelId, messageId)
			}
		}

		return (channelId, messageId) => (pending = run(channelId, messageId))
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

				let message = await getMsgWithQueue(channelId, messageId);
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

			if (this.props.attachmentLink && this.props.settings.attachmentReplaceText !== "") {
				messageReplace.props.children[0] = this.props.settings.attachmentReplaceText;
			}
			else if (this.props.settings.messageReplaceText !== "") {
				messageReplace.props.children[0] = this.props.settings.messageReplaceText;
			}


			if (!this.state) {
				return this.wrapInTooltip("Loading...", messageReplace, "yellow")
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
				// message.content = message.content.length > displayCharacters ? message.content.substring(0, displayCharacters) + "..." : message.content;
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
				guildName = message.guild.name;
				guildId = message.guild.id;
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

			let authorIcon = this.props.settings.showAuthorIcon ? React.createElement("img", { src: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.webp`, class: "replyAvatar-1K9Wmr betterMessageLinks AlignMiddle Icon" }) : null;
			let guildIcon = null;
			if (this.props.settings.showGuildIcon && message.guild?.icon && message.guild.id !== ZLibrary.DiscordModules.SelectedGuildStore.getGuildId()) {
				guildIcon = React.createElement("img", { src: `https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.webp`, class: "replyAvatar-1K9Wmr betterMessageLinks AlignMiddle Icon" })
			}

			let attachmentIcon = null;
			let attachment = null;
			if (message.attachments.length > 0 || message.embeds.length > 0) {
				attachmentIcon = React.createElement(ImagePlaceHolder, { width: "20px", height: "20px", class: "betterMessageLinks AlignMiddle" })
				attachment = message.attachments.length > 0 ? React.createElement("img", { class: "betterMessageLinks AlignMiddle Image", src: message.attachments[0].url }) : null;
			}

			let messagePreview = React.createElement("div", {
				class: "betterMessageLinks AlignMiddle",
				children: [
					guildIcon,
					authorIcon,
					botIcon,
					mention,
					attachmentIcon,
					React.createElement("br", {}),
					messageContent,
					attachment !== null ? React.createElement("br", {}) : null,
					attachment,
				]
			});

			let newLink = this.wrapInTooltip(messagePreview, messageReplace, TooltipWrapper.Colors.PRIMARY);

			// newLink.props.forceOpen = true;

			console.log(newLink)
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
						if (/https:\/\/(ptb.|canary.)?discord.com\/channels\/(\d+|@me)\/\d+\/\d+/gi.test(child.props?.href)) {
							ret.props.children[0][i] = React.createElement(BetterLink, { original: child, settings: this.settings });
						} else if (/https:\/\/(media|cdn).discordapp.(com|net)\/attachments\/\d+\/\d+\/.+/gi.test(child.props?.href)) {
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

			//build the settings panel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new Textbox("Message Replace", "Replace all Discord message links with the following text. Leave empty to not change the Discord Link at all.", this.settings.messageReplaceText, (i) => {
					this.settings.messageReplaceText = i;
				}),
				new Textbox("Attachment Replace", "Replace all Discord Attachment links with the following text. Leave empty to not change the Discord Link at all.", this.settings.attachmentReplaceText, (i) => {
					this.settings.attachmentReplaceText = i;
				}),
				new Switch("Show Author icon", "Display the icon of the Message Author.", this.settings.showAuthorIcon, (i) => {
					this.settings.showAuthorIcon = i;
				}),
				new Switch("Show Guild icon", "Display the guild icon of the message next to the author icon if you aren't in the same guild as the linked message.", this.settings.showGuildIcon, (i) => {
					this.settings.showGuildIcon = i;
				}),
				new Textbox("Advanced link title", React.createElement("div", {}, "Changes the title of the link. Use $value to display specific values. Valid values: ", unorderedList), this.settings.advancedTitle, (i) => {
					this.settings.advancedTitle = i;
				}),
			)

		}


		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
