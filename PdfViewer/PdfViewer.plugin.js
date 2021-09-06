/**
 * @name FileViewer
 * @author AGreenPig
 * @version 0.0.4
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
			"version": "0.0.4",
			"description": "View Pdf and other files directly in Discord.",
			"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/FileViewer/FileViewer.plugin.js"
		},
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
				Tooltip
			} = { ...Api, ...BdApi };

			let fileCSS = [
				`.hideFile {`,
				`	display: none;`,
				`}`,
			].join("\n")
			return class FileViwer extends Plugin {
				start() {
					BdApi.injectCSS("fileCSS", fileCSS);
				}
				stop() {
					BdApi.clearCSS("fileCSS");
				}
				addFileButton(attachment) {
					let fileButton = document.createElement("a");
					fileButton.className = "anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB downloadWrapper-vhAtLx"
					fileButton.innerHTML = `<svg class="downloadButton-23tKQp" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
											<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z">
											</path>
											</svg>`;

					let tooltip;
					fileButton.addEventListener("click", () => {
						if (attachment.getAttribute("displayingfile") === "true") {
							//hide file
							tooltip = new Tooltip(fileButton, "Click to view file.");
							attachment.setAttribute("displayingFile", "false");

							attachment.querySelector(".fileEmbed").classList.add("hideFile");
							attachment.querySelector(".fileInfo").classList.add("hideFile");
						} else {
							//show file 
							tooltip = new Tooltip(fileButton, "Click to hide file.");
							attachment.setAttribute("displayingFile", "true");

							attachment.querySelector(".fileEmbed").classList.remove("hideFile");
							attachment.querySelector(".fileInfo").classList.remove("hideFile");
						}

					});


					fileButton.addEventListener('hover', () => {
						tooltip.showAbove();
					});
					let attachmentWrapper = attachment.querySelector(".attachment-33OFj0");
					attachmentWrapper.appendChild(fileButton);

					attachment.classList.add("displayFileButton");
				}
				showFile(attachment, url) {

					let googleUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${url}`
					let embed = document.createElement("embed");
					embed.className = `imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedMedia-1guQoW embedImage-2W1cML fileEmbed hideFile`;
					embed.setAttribute("src", googleUrl);
					embed.setAttribute("frameborder", `0`);
					embed.setAttribute("width", "500rem")
					embed.setAttribute("height", "600rem")
					attachment.setAttribute("displayingFile", "false")

					let infoText = document.createElement("div"); 
					infoText.className = `colorStandard-2KCXvj size14-e6ZScH description-3_Ncsb formText-3fs7AJ modeDefault-3a2Ph1 fileInfo hideFile`;
					infoText.innerHTML = `If nothing is getting displayed, click 
										<a class="anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB" title="${googleUrl}" rel="noreferrer noopener" target="_blank" role="button" tabindex="0" href="${googleUrl}">here</a> or wait a little.`
					attachment.appendChild(infoText);
					attachment.appendChild(embed);

				}
				observer() {
					let allAttachments = document.querySelectorAll(".messageAttachment-1aDidq");
					if (allAttachments.length > 0) {
						for (let attachment of allAttachments) {
							let url = attachment.querySelector("div > a")?.getAttribute("href");
							if (url && /\.(pdf|doc|docx|xlsx|pptx)$/g.test(url)) {
								if (!attachment.classList.contains("displayFileButton")) {
									this.showFile(attachment, url)
									this.addFileButton(attachment);
								}
							}
						}

					}
				}

			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
