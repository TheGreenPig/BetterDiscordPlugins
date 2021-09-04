/**
 * @name PdfViewer
 * @author AGreenPig
 * @version 0.0.1
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
			"version": "0.0.1",
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
			return class PdfViwer extends Plugin {
				onStart() {
				}
				onStop() {
				}
				observer() {
					let allAttachments = document.querySelectorAll(".messageAttachment-1aDidq");

					let allLinks = document.querySelectorAll(".anchor-3Z-8Bb.anchorUnderlineOnHover-2ESHQB");
					if(allAttachments.length>0) {
						for(let attachment of allAttachments) {
							let url = attachment.querySelector("div > a")?.getAttribute("href");
							if(url && url.endsWith(".pdf")) {
								attachment.outerHTML = `<embed class=" imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedMedia-1guQoW embedImage-2W1cML" src="https://drive.google.com/viewerng/
								viewer?embedded=true&url=${url}" type="application/pdf" width="500rem" height="600rem">`;
							}
						}
					}
					if(allLinks.length>0) {
						for(let link of allLinks) {
							let url = link.getAttribute("href");
							if(url && url.endsWith(".pdf")) {
								link.outerHTML = `<embed class=" imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedMedia-1guQoW embedImage-2W1cML" src="https://drive.google.com/viewerng/
								viewer?embedded=true&url=${url}" type="application/pdf" width="500rem" height="600rem">`;
							}
						}
					}
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
