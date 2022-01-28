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
Install this plugin. That's it. 

## TODO
(This is still very early development and I might abandon it at anytime if it's too performance heavy or such)
<ul>
  <li>Create plugin so it's not BDFDB dependent and a little more efficient</li>
  <li>Add an easy way to generate and submit an animation (ideally a bot like USRBG does it)</li>
  <li>Improve efficency and do testing with lot's of animations (I suck at css, maybe there's a better way to do it than the way I am currently?)</li>
</ul>

