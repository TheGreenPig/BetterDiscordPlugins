/**
 * @name PdfViewer
 * @author AGreenPig
 * @version 0.0.3
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/PdfViewer/PdfViewer.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/PdfViewer/PdfViewer.plugin.js
 */


module.exports = (() => {
	const config = {
		"info": {
			"name": "PdfViewer",
			"authors": [{
				"name": "AGreenPig",
				"discord_id": "427179231164760066",
				"github_username": "TheGreenPig"
			}],
			"version": "0.0.3",
			"description": "View Pdf files directly in Discord.",
			"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/PdfViewer/PdfViewer.plugin.js"
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

			let pdfCSS = [
				`.hidePdf {`,
				`	display: none;`,
				`}`,
			].join("\n")
			return class PdfViwer extends Plugin {
				start() {
					BdApi.injectCSS("pdfCSS", pdfCSS);
				}
				stop() {
					BdApi.clearCSS("pdfCSS");
				}
				addPdfButton(attachment) {
					let pdfButton = document.createElement("a");
					pdfButton.className = "anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB downloadWrapper-vhAtLx"
					pdfButton.innerHTML = `<svg class="downloadButton-23tKQp" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
											<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z">
											</path>
											</svg>`;

					let tooltip;
					pdfButton.addEventListener("click", () => {
						if (attachment.getAttribute("displayingpdf") === "true") {
							//hide pdf
							console.log("hide pdf")
							tooltip = new Tooltip(pdfButton, "Click to view pdf.");
							attachment.setAttribute("displayingpdf", "false");

							attachment.querySelector(".pdfEmbed").classList.add("hidePdf");
							attachment.querySelector(".pdfInfo").classList.add("hidePdf");
						} else {
							//show pdf 
							console.log("show pdf")
							tooltip = new Tooltip(pdfButton, "Click to hide pdf.");
							attachment.setAttribute("displayingpdf", "true");

							attachment.querySelector(".pdfEmbed").classList.remove("hidePdf");
							attachment.querySelector(".pdfInfo").classList.remove("hidePdf");
						}

					});


					pdfButton.addEventListener('hover', () => {
						tooltip.showAbove();
					});
					let attachmentWrapper = attachment.querySelector(".attachment-33OFj0");
					attachmentWrapper.appendChild(pdfButton);

					attachment.classList.add("displayPdfButton");
				}
				showPdf(attachment, url) {

					let googleUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${url}`
					let embed = document.createElement("embed");
					embed.className = `imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedMedia-1guQoW embedImage-2W1cML pdfEmbed hidePdf`;
					embed.setAttribute("src", googleUrl);
					embed.setAttribute("frameborder", `0`);
					embed.setAttribute("type", "application/pdf")
					embed.setAttribute("width", "500rem")
					embed.setAttribute("height", "600rem")
					attachment.setAttribute("displayingpdf", "false")

					let infoText = document.createElement("div"); 
					infoText.className = `colorStandard-2KCXvj size14-e6ZScH description-3_Ncsb formText-3fs7AJ modeDefault-3a2Ph1 pdfInfo hidePdf`;
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
								if (!attachment.classList.contains("displayPdfButton")) {
									this.showPdf(attachment, url)
									this.addPdfButton(attachment);
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
