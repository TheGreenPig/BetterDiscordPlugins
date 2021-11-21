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
		"version": "1.2.0",
		"description": "Instead of just showing the long and useless discord message link, make it smaller and add a preview.",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/BetterMessageLinks/BetterMessageLinks.plugin.js"
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


// This plugin was only made possible by the generous help of Strencher and the MEssageLinkEmbed plugin by him and Juby210! They definitely deserve all the credit

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
	//Custom css
	const customCSS = `
		.betterMessageLinks-Tooltip {
			white-space: nowrap;
			max-width: fit-content;
			vertical-align: middle;
		}
		.betterMessageLinks.Author{
			font-weight: bold;
			padding-right: 5px;
			vertical-align: middle;
		}
		.betterMessageLinks.AlignMiddle{
			vertical-align: middle;
		}
		.betterMessageLinks.Icon{
			width: 25px;
			height: 25px;
		}
	`
	const defaultSettings = {
		messageReplaceText: "<Message>",
		showAuthorIcon: true,
		showGuildIcon: true,
	};

	//Settings and imports
	const { Toasts, WebpackModules, Patcher, React, Settings, DiscordModules } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

	//Modules
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");
	const GetMessageModule = ZLibrary.DiscordModules.MessageStore;
	const GetGuildModule = ZLibrary.DiscordModules.GuildStore;
	const TooltipWrapper = ZLibrary.WebpackModules.getByPrototypes("renderTooltip");
	const User = WebpackModules.find(m => m.prototype && m.prototype.tag);
	const Timestamp = WebpackModules.find(m => m.prototype && m.prototype.toDate && m.prototype.month)
	const { stringify } = WebpackModules.getByProps('stringify', 'parse', 'encode');
	let cache = {};
	let lastFetch = 0;
	let displayCharacters = 40;

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
				let numberMatches = this.props.original.props.href.match(/\d+/g);
				let messageId = numberMatches[numberMatches.length - 1];
				let channelId = numberMatches[numberMatches.length - 2];
				let guildId = numberMatches.length > 2 ? numberMatches[numberMatches.length - 3] : undefined;

				let message = await getMsgWithQueue(channelId, messageId);
				message.guild = guildId ? GetGuildModule.getGuild(guildId) : "@me";
				this.setState(message);
			}
		}
		wrapInTooltip(tooltipText, child, color) {
			return React.createElement(TooltipWrapper, {
				position: TooltipWrapper.Positions.TOP,
				color: color,
				tooltipClassName: "betterMessageLinks-Tooltip",
				text: tooltipText,
				children: (tipProps) => {
					return React.createElement("span", Object.assign({
						children: [
							child
						]
					}, tipProps))
				}
			})
		}
		render() {
			let messageReplace = this.props.original;
			if (this.props.replace !== "") {
				messageReplace.props.children[0] = this.props.settings.messageReplaceText;
			}
			
			if (!this.state) {
				return this.wrapInTooltip("Loading...", messageReplace, "yellow")
			}
			
			if (this.state.ok === false) {
				if (this.state.body?.message) {
					return this.wrapInTooltip(this.state.body?.message, messageReplace, "red")
				}
				return messageReplace;
			}
			
			let message = this.state;
			let messageContent = React.createElement("span", { class: "betterMessageLinks AlignMiddle" }, message.content.length > displayCharacters ? message.content.substring(0, displayCharacters) + "..." : message.content);
			let author = message?.author;
			
			messageReplace.props.title = `Author: ${author.username}, ${message.guild?.name ? "Guild: "+message.guild?.name+", " : ""}ChannelId: ${message.channel_id}, Id: ${message.id}`

			let mention = React.createElement("span", { className: "betterMessageLinks Author" }, author.username + ":");

			let authorIcon = this.props.settings.showAuthorIcon ? React.createElement("img", { src: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.webp`, class: "replyAvatar-1K9Wmr betterMessageLinks AlignMiddle Icon" }) : null;
			let guildIcon = null;
			if (this.props.settings.showGuildIcon && message.guild?.icon && message.guild.id !== ZLibrary.DiscordModules.SelectedGuildStore.getGuildId()) {
				guildIcon = React.createElement("img", { src: `https://cdn.discordapp.com/icons/${message.guild.id}/${message.guild.icon}.webp`, class: "replyAvatar-1K9Wmr betterMessageLinks AlignMiddle Icon" })
			}

			let attachmentIcon = null;
			if (message.attachments.length > 0) {
				attachmentIcon = React.createElement(BdApi.findModuleByDisplayName("ImagePlaceholder"), { width: "20px", height: "20px", class: "betterMessageLinks AlignMiddle" })
			}

			let messagePreview = React.createElement("div", {
				class: "betterMessageLinks AlignMiddle",
				children: [
					guildIcon,
					authorIcon,
					mention,
					attachmentIcon,
					messageContent,
				]
			});

			let newLink = this.wrapInTooltip(messagePreview, messageReplace, TooltipWrapper.Colors.PRIMARY);

			return newLink
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
						}
					});
				}
			})
		}

		getSettingsPanel() {
			//build the settings panel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new Textbox("Message Replace", "Replace all Discord message links with the following text. Leave empty to not change the Discord Link at all.", this.settings.messageReplaceText, (i) => {
					this.settings.messageReplaceText = i;
				}),
				new Switch("Show Author icon", "Display the icon of the Message Author.", this.settings.showAuthorIcon, (i) => {
					this.settings.showAuthorIcon = i;
				}),
				new Switch("Show Guild icon", "Display the guild icon of the message next to the author icon if you aren't in the same guild as the linked message.", this.settings.showGuildIcon, (i) => {
					this.settings.showGuildIcon = i;
				}),
			)

		}


		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
