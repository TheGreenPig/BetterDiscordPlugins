# UserStatus
A lot of people use Animated Status plugins, but these increase the chances of getting banned since they abuse the Discord api. 
Instead of actually making api requests and updating the status every few seconds, the plan of this project is to have a big css and json file where users can submit their animation and get it verified.
This is similar to [USRBG](https://github.com/Discord-Custom-Covers/usrbg), where the idea for this came from.
The main advantage of this method over using any other animated status plugin is that you don't have to risk account suspension or rate limits since you aren't actually updating your status through the api, it's just css keyframes.

## Usage:
First you will have to get your custom status added to the database. There is currently no way to do this, but it will probably be through my Discord server or something.
### Method 1: (**BDFDB MUST BE INSTALLED FOR THIS TO WORK**)
You don't need to install the plugin for this method. Simply paste `@import url("https://cdn.jsdelivr.net/gh/TheGreenPig/BetterDiscordPlugins/UserStatus/dist/userstatus.css")` in your custom css or Theme and it will import the Status database. 
### Method 2: 
Install this plugin. That's it. It will import `@import url("https://cdn.jsdelivr.net/gh/TheGreenPig/BetterDiscordPlugins/UserStatus/dist/userstatus_internal.css")` and add the correct classes everywhere the status shows up (I hope this improves performance over Method 1, but I haven't done any testing...) 

## TODO
(This is still very early development and I might abandon it at anytime if it's too performance heavy or such)
<ul>
  <li>Patch the status better (aka everywhere)</li>
<li>Make a way to generate the instructions json file with a ui</li>
<li>Set up a channel + possibly bot for the status verification process (how to automatically make git pushes with a bot?)</li>
<li>Possibly move it to it's own repo to not spam commits and bury the updates of other plugins</li>
<li>Set up good restrictions what the minimum delay of a frame should be, max number of frames etc. </li>
<li>Set up good rules what should be allowed in the status and what not (should self promotion be allowed for example? Special UTF-8 characters allowed? Lot's of white space allowed?)</li>
<li>Think about if this is even a good idea or is it just going to turn into a spammy plugin that no one will use?  </li>
</ul>

