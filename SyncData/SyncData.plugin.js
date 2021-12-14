/**
 * @name SyncData
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/SyncData/SyncData.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/SyncData/SyncData.plugin.js
 */
 const config = {
	"info": {
		"name": "SyncData",
		"authors": [{
			"name": "AGreenPig",
			"discord_id": "427179231164760066",
			"github_username": "TheGreenPig"
		}],
		"version": "1.0.0",
		"description": "Sync your settings, plugins and themes!",
		"github_raw": "https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/SyncData/SyncData.plugin.js"
	},
}
const request = require('request');
const fs = require("fs");

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
	`

	//Settings and imports
	const { Toasts, WebpackModules, DCM, Patcher, React, Settings, Logger, DiscordModules } = { ...Library, ...BdApi };
	const { SettingPanel, Switch, Slider, RadioGroup, Textbox } = Settings;
	//default settings
	const defaultSettings = {

	}
	let officialAddonsCache = {}
	const userId = DiscordModules.UserStore.getCurrentUser().id;

	return class SyncData extends Plugin {
		async onStart() {
			//load default settings
			this.settings = this.loadSettings(defaultSettings);
			//inject css
			BdApi.injectCSS(config.info.name, customCSS)

			// let data = await this.pushChanges();
			let data = await this.pullChanges();
			console.log(data)
		}

		async pushChanges() {
			officialAddonsCache = await this.getAddonCache();
			let data = this.generateData()
			let compressed = LZString.compressToEncodedURIComponent(data);
		

			async function dpaste(content) {
				var response = await fetch("https://dpaste.com/api/", {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: "content=" + encodeURIComponent(content),
				});
				return response.text();
			}

			dpaste(compressed).then(paste_url => {
				let token =  paste_url.split("/").pop().trim();
				Logger.log("Uploaded new sync data at "+token);
				DiscordModules.UserNoteActions.updateNote(userId, `SyncData token: <${token}>`);
				Logger.log("Updated Notes!");
				return token;
			}).catch(error => {throw Error(error)});
		}

		pullChanges() {
			return new Promise((resolve, reject) => {
				let tokenMatches = DiscordModules.UserNoteStore.getNote(userId).note.match(/<[A-Z0-9]{9}>/g);
				let token = tokenMatches && tokenMatches.length > 0 ? tokenMatches[0].slice(1, -1) : reject("No token found in Notes!");
				fetch(`https://dpaste.com/${token}.txt`)
					.then(data => { return data.text() })
					.then(res => {
						resolve(LZString.decompressFromEncodedURIComponent(res))
					})
					.catch(error => {
						reject(error)
					})
			});
		}


		getAddonCache() {
			return new Promise((resolve, reject) => {
				request(`https://api.betterdiscord.app/v1/store/addons`, (error, res, body) => {
					if (error) {
						reject("Failed to Fetch the Addon cache: " + error)
					};

					if (!error && res.statusCode == 200) {
						let dict = {}
						JSON.parse(body).forEach(e => { dict[e.name] = e.id })
						resolve(dict)
					};
				});
			});
		}

		generateData() {
			let pluginArray = BdApi.Plugins.getAll();
			let themeArray = BdApi.Themes.getAll();

			let data = { plugins: [], themes: [] };

			pluginArray.forEach((e, i) => {
				let name = e.displayName ? e.displayName : e.name;
				let addonId = officialAddonsCache[name];
				let pluginObject = {};
				addonId ? pluginObject.bd = addonId : pluginObject.url = e.updateUrl
				pluginObject.enabled = BdApi.Plugins.isEnabled(name);
				try {
					let data = fs.readFileSync(`${BdApi.Plugins.folder}\\${e.filename.split(".")[0]}.config.json`, "utf8")
					pluginObject.settings = JSON.parse(data)
				} catch (error) {
					console.log(error)
				}
				data.plugins[i] = pluginObject;
			})
			themeArray.forEach((e, i) => {
				let name = e.displayName ? e.displayName : e.name;
				let addonId = officialAddonsCache[name];
				let themeObject = {};
				if (addonId) themeObject.bd = addonId
				themeObject.css = e.css
				themeObject.enabled = BdApi.Themes.isEnabled(name);
				data.themes[i] = themeObject
			})
			let settings = {};

			BdApi.settings.forEach((collection) => {
				settings[collection.name] = {};
				collection.settings.forEach((category) => {
					settings[collection.name][category.name] = {};
					category.settings.forEach((id) => {
						settings[collection.name][category.name][id.name] = id.value;
					})
				})
			})
			data.settings = settings

			return JSON.stringify(data)
		}

		getSettingsPanel() {
			//build the settings panel
			return SettingPanel.build(() => this.saveSettings(this.settings),
				new RadioGroup('Radio', `Pick one`, this.settings.radio || 0, radioOptions, (i) => {
					this.settings.radio = i;
				}),
				new Switch("Switch", "Switch me", this.settings.toggle, (i) => {
					this.settings.toggle = i;
				}),
				new Textbox("Textbox", "Put text here", this.settings.text, (i) => {
					this.settings.text = i;
				}),
				new Slider("Slider", "Slide Me", 1, 10, this.settings.slider, (i) => {
					this.settings.slider = i;
				}, { markers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], stickToMarkers: true }),
			)

		}
		onStop() {
			BdApi.clearCSS(config.info.name)
			Patcher.unpatchAll(config.info.name);
		}

	}

})(global.ZeresPluginLibrary.buildPlugin(config));

var LZString = function () { function o(o, r) { if (!t[o]) { t[o] = {}; for (var n = 0; n < o.length; n++)t[o][o.charAt(n)] = n } return t[o][r] } var r = String.fromCharCode, n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$", t = {}, i = { compressToBase64: function (o) { if (null == o) return ""; var r = i._compress(o, 6, function (o) { return n.charAt(o) }); switch (r.length % 4) { default: case 0: return r; case 1: return r + "==="; case 2: return r + "=="; case 3: return r + "=" } }, decompressFromBase64: function (r) { return null == r ? "" : "" == r ? null : i._decompress(r.length, 32, function (e) { return o(n, r.charAt(e)) }) }, compressToUTF16: function (o) { return null == o ? "" : i._compress(o, 15, function (o) { return r(o + 32) }) + " " }, decompressFromUTF16: function (o) { return null == o ? "" : "" == o ? null : i._decompress(o.length, 16384, function (r) { return o.charCodeAt(r) - 32 }) }, compressToUint8Array: function (o) { for (var r = i.compress(o), n = new Uint8Array(2 * r.length), e = 0, t = r.length; t > e; e++) { var s = r.charCodeAt(e); n[2 * e] = s >>> 8, n[2 * e + 1] = s % 256 } return n }, decompressFromUint8Array: function (o) { if (null === o || void 0 === o) return i.decompress(o); for (var n = new Array(o.length / 2), e = 0, t = n.length; t > e; e++)n[e] = 256 * o[2 * e] + o[2 * e + 1]; var s = []; return n.forEach(function (o) { s.push(r(o)) }), i.decompress(s.join("")) }, compressToEncodedURIComponent: function (o) { return null == o ? "" : i._compress(o, 6, function (o) { return e.charAt(o) }) }, decompressFromEncodedURIComponent: function (r) { return null == r ? "" : "" == r ? null : (r = r.replace(/ /g, "+"), i._decompress(r.length, 32, function (n) { return o(e, r.charAt(n)) })) }, compress: function (o) { return i._compress(o, 16, function (o) { return r(o) }) }, _compress: function (o, r, n) { if (null == o) return ""; var e, t, i, s = {}, p = {}, u = "", c = "", a = "", l = 2, f = 3, h = 2, d = [], m = 0, v = 0; for (i = 0; i < o.length; i += 1)if (u = o.charAt(i), Object.prototype.hasOwnProperty.call(s, u) || (s[u] = f++, p[u] = !0), c = a + u, Object.prototype.hasOwnProperty.call(s, c)) a = c; else { if (Object.prototype.hasOwnProperty.call(p, a)) { if (a.charCodeAt(0) < 256) { for (e = 0; h > e; e++)m <<= 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++; for (t = a.charCodeAt(0), e = 0; 8 > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } else { for (t = 1, e = 0; h > e; e++)m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0; for (t = a.charCodeAt(0), e = 0; 16 > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } l--, 0 == l && (l = Math.pow(2, h), h++), delete p[a] } else for (t = s[a], e = 0; h > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1; l--, 0 == l && (l = Math.pow(2, h), h++), s[c] = f++, a = String(u) } if ("" !== a) { if (Object.prototype.hasOwnProperty.call(p, a)) { if (a.charCodeAt(0) < 256) { for (e = 0; h > e; e++)m <<= 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++; for (t = a.charCodeAt(0), e = 0; 8 > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } else { for (t = 1, e = 0; h > e; e++)m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0; for (t = a.charCodeAt(0), e = 0; 16 > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } l--, 0 == l && (l = Math.pow(2, h), h++), delete p[a] } else for (t = s[a], e = 0; h > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1; l--, 0 == l && (l = Math.pow(2, h), h++) } for (t = 2, e = 0; h > e; e++)m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1; for (; ;) { if (m <<= 1, v == r - 1) { d.push(n(m)); break } v++ } return d.join("") }, decompress: function (o) { return null == o ? "" : "" == o ? null : i._decompress(o.length, 32768, function (r) { return o.charCodeAt(r) }) }, _decompress: function (o, n, e) { var t, i, s, p, u, c, a, l, f = [], h = 4, d = 4, m = 3, v = "", w = [], A = { val: e(0), position: n, index: 1 }; for (i = 0; 3 > i; i += 1)f[i] = i; for (p = 0, c = Math.pow(2, 2), a = 1; a != c;)u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1; switch (t = p) { case 0: for (p = 0, c = Math.pow(2, 8), a = 1; a != c;)u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1; l = r(p); break; case 1: for (p = 0, c = Math.pow(2, 16), a = 1; a != c;)u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1; l = r(p); break; case 2: return "" }for (f[3] = l, s = l, w.push(l); ;) { if (A.index > o) return ""; for (p = 0, c = Math.pow(2, m), a = 1; a != c;)u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1; switch (l = p) { case 0: for (p = 0, c = Math.pow(2, 8), a = 1; a != c;)u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1; f[d++] = r(p), l = d - 1, h--; break; case 1: for (p = 0, c = Math.pow(2, 16), a = 1; a != c;)u = A.val & A.position, A.position >>= 1, 0 == A.position && (A.position = n, A.val = e(A.index++)), p |= (u > 0 ? 1 : 0) * a, a <<= 1; f[d++] = r(p), l = d - 1, h--; break; case 2: return w.join("") }if (0 == h && (h = Math.pow(2, m), m++), f[l]) v = f[l]; else { if (l !== d) return null; v = s + s.charAt(0) } w.push(v), f[d++] = s + v.charAt(0), h--, s = v, 0 == h && (h = Math.pow(2, m), m++) } } }; return i }(); 
