/**
 * @name FileViewer
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/FileViewer/FileViewer.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/FileViewer/FileViewer.plugin.js
 */


module.exports = (() => {
	const config = {
		"info": {
			"name": "FileViewer",
			"authors": [{
				"name": "AGreenPig",
				"discord_id": "427179231164760066",
				"github_username": "TheGreenPig"
			}],
			"version": "1.0.0",
			"description": "View Pdf and other files directly in Discord.",
			"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/FileViewer/FileViewer.plugin.js"
		},
		changelog: [
			{
				title: "Fixed",
				type: "fixed",
				items: [
					"`Shift`+`Click` the Eye to open the file in your Browser.",
					"Different Icons for hide and show File.",
					"Made the code cleaner.",
				]
			},
		],
	}
	return !global.ZeresPluginLibrary ? class {
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
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Library) => {
			const {
				Patcher,
				React,
			} = { ...Api, ...BdApi };
			const Attachment = BdApi.findModule(m => m.default?.displayName === "Attachment");
			const TooltipContainer = BdApi.findModuleByProps('TooltipContainer').TooltipContainer;

			//Thanks Dastan21 for the icons <3
			const ShowIcon = React.createElement("path", { fill: "currentColor", d: "M113,37.66667c-75.33333,0 -103.58333,75.33333 -103.58333,75.33333c0,0 28.25,75.33333 103.58333,75.33333c75.33333,0 103.58333,-75.33333 103.58333,-75.33333c0,0 -28.25,-75.33333 -103.58333,-75.33333zM113,65.91667c25.99942,0 47.08333,21.08392 47.08333,47.08333c0,25.99942 -21.08392,47.08333 -47.08333,47.08333c-25.99942,0 -47.08333,-21.08392 -47.08333,-47.08333c0,-25.99942 21.08392,-47.08333 47.08333,-47.08333zM113,84.75c-15.60204,0 -28.25,12.64796 -28.25,28.25c0,15.60204 12.64796,28.25 28.25,28.25c15.60204,0 28.25,-12.64796 28.25,-28.25c0,-15.60204 -12.64796,-28.25 -28.25,-28.25z" });
			const HideIcon = React.createElement("path", { fill: "currentColor", d: "M37.57471,28.15804c-3.83186,0.00101 -7.28105,2.32361 -8.72295,5.87384c-1.4419,3.55022 -0.58897,7.62011 2.15703,10.29267l16.79183,16.79183c-18.19175,14.60996 -29.9888,32.52303 -35.82747,43.03711c-3.12633,5.63117 -3.02363,12.41043 0.03678,18.07927c10.87625,20.13283 42.14532,66.10058 100.99007,66.10058c19.54493,0 35.83986,-5.13463 49.36394,-12.65365l19.31152,19.31152c2.36186,2.46002 5.8691,3.45098 9.16909,2.5907c3.3,-0.86028 5.87708,-3.43736 6.73736,-6.73736c0.86028,-3.3 -0.13068,-6.80724 -2.5907,-9.16909l-150.66666,-150.66667c-1.77289,-1.82243 -4.20732,-2.8506 -6.74984,-2.85075zM113,37.66667c-11.413,0 -21.60375,1.88068 -30.91683,4.81869l24.11182,24.11182c2.23175,-0.32958 4.47909,-0.6805 6.80501,-0.6805c25.99942,0 47.08333,21.08392 47.08333,47.08333c0,2.32592 -0.35092,4.57326 -0.6805,6.80501l32.29623,32.29623c10.1135,-11.22467 17.51573,-22.61015 21.94157,-30.18115c3.3335,-5.68767 3.32011,-12.67425 0.16553,-18.4655c-11.00808,-20.27408 -42.2439,-65.78792 -100.80615,-65.78792zM73.77002,87.08577l13.77555,13.77556c-1.77707,3.67147 -2.79557,7.77466 -2.79557,12.13867c0,15.60342 12.64658,28.25 28.25,28.25c4.364,0 8.46719,-1.01851 12.13867,-2.79557l13.79395,13.79395c-9.356,6.20362 -21.03043,9.17606 -33.4733,7.24642c-19.75617,-3.06983 -35.88427,-19.19794 -38.9541,-38.9541c-1.92879,-12.43739 1.0665,-24.10096 7.26481,-33.45491z" });

			class FileViewerButton extends React.Component {
				state = { displayingFile: false}
				render() {
					let button = React.createElement(TooltipContainer, { text: this.state.displayingFile ? "Hide File" : "Show File" },
						React.createElement("svg", {
							class: "downloadButton-23tKQp", width: "24", height: "24", viewBox: "0 0 226 226", onClick: (e) => {
								let googleUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${this.props.url}`
								if(e.shiftKey) {window.open(googleUrl, '_blank').focus(); return;}

								this.setState({ displayingFile: !this.state.displayingFile, url: this.state.url });
								let attachmentElement = e.target.closest(`div[class^="messageAttachment"]`);
								if (!this.state.displayingFile) {
									let embed = document.createElement("embed");
									embed.innerHTML = `<embed class="FileViewerEmbed" src="${googleUrl}" width="500rem" height="600rem">`
									attachmentElement.appendChild(embed.firstChild);
								} else {
									let embed = attachmentElement.childNodes[1];
									embed.parentNode.removeChild(embed);
								}
							},
						}, this.state.displayingFile ? HideIcon : ShowIcon));
					return button;
				}
			}
			return class FileViwer extends Plugin {
				start() {
					Patcher.after("FileViewer", Attachment, "default", (_, __, ret) => {
						if (ret.props?.children?.length === 0) { return; }
						const fileUrl = ret.props.children[2]?.props?.href;
						let button = React.createElement(FileViewerButton, { displayingFile: false, url: fileUrl});

						if (!fileUrl || !/\.(pdf|doc|docx|xlsx|pptx)$/.test(fileUrl)) { return; }
						ret.props.children = [
							...ret.props.children,
							button
						]
					});
				}
				stop() {
					Patcher.unpatchAll("FileViewer");
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
