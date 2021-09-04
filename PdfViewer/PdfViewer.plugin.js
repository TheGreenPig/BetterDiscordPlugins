/**
 * @name PdfViewer
 * @author AGreenPig
 * @version 0.0.2
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
			"version": "0.0.2",
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
			return class PdfViwer extends Plugin {


				addPdfButton(element) {

					let pdfButton = document.createElement("a");

					pdfButton.className = "anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB downloadWrapper-vhAtLx"

					pdfButton.innerHTML = `<svg class="downloadButton-23tKQp" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
											<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z">
											</path>
											</svg>`;

					let tooltip = new Tooltip(pdfButton, "Click to view pdf.");
					pdfButton.addEventListener("click", () => {
						if (element.classList.contains("showPdf")) {
							BdApi.injectCSS("pdfViewer", `.pdfDisplay {display:none;}`);
							BdApi.clearCSS("pdfMessageWrapper")
							tooltip = new Tooltip(pdfButton, "Click to show pdf.")
							element.classList.remove("showPdf");
						} else {
							BdApi.clearCSS("pdfViewer")
							BdApi.injectCSS("pdfMessageWrapper", ".showPdf {width: 150%;}")
							tooltip = new Tooltip(pdfButton, "Click to hide pdf.")
							element.classList.add("showPdf");
						}

					});


					pdfButton.addEventListener('hover', () => {
						tooltip.showAbove();
					});
					if (element.nodeName === "DIV") {
						let attachmentWrapper = element.querySelector(".attachment-33OFj0");
						attachmentWrapper.appendChild(pdfButton);
					}
					else {
						element.appendChild(pdfButton);
					}
					element.classList.add("displayPdfButton");
				}
				showPdf(element, url) {
					if (element.querySelector(".pdfDisplay")) {
						return;
					}
					let embed = document.createElement("embed");
					embed.className = `imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedMedia-1guQoW embedImage-2W1cML pdfDisplay`;
					embed.setAttribute("src", `https://drive.google.com/viewerng/viewer?embedded=true&url=${url}`);
					embed.setAttribute("type", "application/pdf")
					embed.setAttribute("width", "50%")
					embed.setAttribute("height", "600rem")
					BdApi.injectCSS("pdfViewer", `.pdfDisplay {display:none;}`);

					element.appendChild(embed);
				}
				observer() {
					let allAttachments = document.querySelectorAll(".messageAttachment-1aDidq");
					if (allAttachments.length > 0) {
						for (let attachment of allAttachments) {
							let url = attachment.querySelector("div > a")?.getAttribute("href");
							if (url && url.endsWith(".pdf")) {
								if (!attachment.classList.contains("displayPdfButton")) {
									this.addPdfButton(attachment);
									this.showPdf(attachment, url)
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
