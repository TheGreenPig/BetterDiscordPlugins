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
		}],
		"version": "1.0.0",
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
		}
	`
	const defaultSettings = {
		messageReplaceText: "<Message>",
		previewMessageLength: 40,
	};

	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;

	//Modules
	const MessageContent = WebpackModules.getModule(m => m.type?.displayName === "MessageContent");
	const GetMessageModule = ZLibrary.DiscordModules.MessageStore;
	const TooltipWrapper = ZLibrary.WebpackModules.getByPrototypes("renderTooltip");
	const UserMentionModule =  WebpackModules.getByDisplayName("UserMention");
 
	//what the message should be replaced with, since the discord urls are long and useless...
	return class BetterMessageLinks extends Plugin {
		async onStart() {
			//inject css
			BdApi.injectCSS(config.info.name, customCSS)
			this.settings = this.loadSettings(defaultSettings);

			//add a MessageContent patcher
			Patcher.after(config.info.name, MessageContent, "type", (_, [props], ret) => {
				if (ret?.props?.children[0].length > 0) {
					ret.props.children[0].forEach((child, i) => {
						if (/https:\/\/(ptb.|canary.)?discord.com\/channels\/\d+\/\d{18}\/\d{18}/gi.test(child.props?.href)) {
							//a discord link was found!
							let newLink = ret.props.children[0][i];
							//messagePreview is the element that gets put into the tooltip
							let messagePreview = this.getMessagePreview(child);
							let messageReplace = React.createElement("span", {}, this.settings.messageReplaceText);
							//Make the tooltip
							newLink.props.children[0] = messagePreview ? React.createElement(TooltipWrapper, {
								position: TooltipWrapper.Positions.TOP,
								color: TooltipWrapper.Colors.PRIMARY,
								tooltipClassName: "betterMessageLinks-Tooltip",
								text: messagePreview,
								children: (tipProps) => {
									return React.createElement("span", Object.assign({
										children: [
											messageReplace
										]
									}, tipProps))
								}
							}) : messageReplace; //dont make tooltip if can't get preview

							//replace the old link child with the new one
							ret.props.children[0][i] = newLink;
						}
					});
				}
			})
		}
		getMessagePreview(child) {
			//Ideally, i would replace this hand-made preview with the same way
			//replies get made, so with the icon, name, messagePreview format...
			let numberMatches = child.props.href.match(/\d+/g);
			let messageId = numberMatches[2];
			let channelId = numberMatches[1];
			let guildId = numberMatches[0];

			//get the message, problem: can't get message when it isn't in MessageStore (other guild, too far up etc.)
			let message = GetMessageModule.getMessage(channelId, messageId);
			let messageContent = message?.content;
			let author = message?.author;
			if (!message?.content) { return undefined }

			//replace end with ... if message is long
			if (messageContent.length > this.settings.previewMessageLength) {
				messageContent = messageContent.substring(0, this.settings.previewMessageLength) + "...";
			}
			let mention = React.createElement(UserMentionModule, {className: "mention", userId: author.id});
			
			//maybe I need this later?
			let icon = React.createElement("img", {src: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.webp?size=22`})
			
			//give back the preview
			return React.createElement("span", {}, mention, React.createElement("span", {}, " "+messageContent));
		}
		getSettingsPanel() {
			//build the settings pannel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new Textbox("Message Replace", "Replace all Discord message links with the following text.", this.settings.messageReplaceText, (i) => {
					this.settings.messageReplaceText = i;
				}),
				//This setting will hopeully not be necessary as soon as I use the built-in Reply element instead...
				new Slider("Preview character amount", "Defines how many characters the preview should have.", 1, 100, this.settings.previewMessageLength, (i) => {
					this.settings.previewMessageLength = Math.round(i);
				}, { markers: [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], stickToMarkers: false, renderValue: (value) => Math.round(value) +" characters" }),
			)

		}
		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}
})(global.ZeresPluginLibrary.buildPlugin(config));
