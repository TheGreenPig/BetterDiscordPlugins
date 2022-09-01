/**
 * @name MoreConfirm
 * @author AGreenPig
 * @updateUrl https://raw.githubusercontent.com/TheGreenPig/BetterDiscordPlugins/main/MoreConfirm/MoreConfirm.plugin.js
 * @authorLink https://github.com/TheGreenPig
 * @source https://github.com/TheGreenPig/BetterDiscordPlugins/main/MoreConfirm/MoreConfirm.plugin.js
 * @invite JsqBVSCugb
 * @version 1.0.0
 * @description A plugin that adds more confirmations to certain actions you might not want to do accidentally.
 */
const { Webpack, Patcher, showConfirmationModal } = BdApi;
const { Filters } = Webpack;
const UserStore = Webpack.getModule(Filters.byProps("getCurrentUser", "getUser"));
const ChannelStore = Webpack.getModule(Filters.byProps("getChannel", "getDMFromUserId"));
const confirmations = [
	{
		filter: Filters.byProps("stopRinging"),
		functionName: "call",
		title: "Start call confirm",
		description: "Are you sure you want to call **$1?**",
		placeholders: [(args) => UserStore.getUser(args[3]).username],
	},
	{
		filter: Filters.byProps("selectVoiceChannel"),
		functionName: "selectVoiceChannel",
		title: "Join Voice Channel confirm",
		description: "Are you sure you want join the **$1** voice channel?",
		placeholders: [(args) => ChannelStore.getChannel(args[0])?.name],
	},
	{
		filter: Filters.byProps("addRelationship"),
		functionName: "addRelationship",
		title: "Add Friend confirm",
		description: "Are you sure you want to make **$1** your friend?",
		placeholders: [(args) => !args[0].type && UserStore.getUser(args[0]?.userId)?.username],
	},
	{
		filter: Filters.byProps("removeRelationship"),
		functionName: "removeRelationship",
		title: "Remove Friend confirm",
		description: "Are you sure you want to remove **$1** from your friends list?",
		placeholders: [(args) => UserStore.getUser(args[0])?.username],
	},
];
module.exports = class {
	start() {
		confirmations.forEach((confirmation) => {
			this.wrapConfirm(confirmation);
		});
	}
	wrapConfirm(confirmation) {
		const { filter, functionName, title, description, placeholders } = confirmation;
		const module = Webpack.getModule(filter);
		Patcher.instead("MoreConfirm", module, functionName, (_, args, original) => {
			let showModal = true;
			const callOriginal = () => {
				original(...args);
				showModal = false;
			};
			let finalDescription = description;
			if (args.wrappedConfirm) callOriginal();
			args.wrappedConfirm = true;
			if (placeholders) {
				placeholders.forEach((placeholder, index) => {
					const placeHolderValue = placeholder(args);
					if (!placeHolderValue) callOriginal();
					finalDescription = finalDescription.replace(`$${index + 1}`, placeHolderValue);
				});
			}
			if (showModal) {
				showConfirmationModal(title, finalDescription, {
					confirmText: "Yes",
					cancelText: "Cancel",
					onConfirm: () => {
						callOriginal();
					},
				});
			}
		});
	}
	stop() {
		Patcher.unpatchAll("MoreConfirm");
	}
};
