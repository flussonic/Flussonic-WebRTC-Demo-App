import qs from "query-string";
import {
  PUBLISHER_EVENTS,
  PLAYER_EVENTS,
  Player,
  Publisher,
} from "@flussonic/flussonic-webrtc-player";

const query = qs.parse(window.location.search);

let wrtcPlayer = null;
let publisher = null;

const getHostElement = () => document.getElementById("host");
const getHostContainerElement = () => document.getElementById("hostContainer");
const getNameElement = () => document.getElementById("name");
const getNameContainerElement = () => document.getElementById("nameContainer");
const getPlayerElement = () => document.getElementById("player");
const getPlayElement = () => document.getElementById("play");
const getPublishElement = () => document.getElementById("publish");
const getStopElement = () => document.getElementById("stop");
const getQualityElement = () => document.getElementById("stop");

const getStreamUrl = (
  hostElement = getHostElement(),
  nameElement = getNameElement()
) =>
  `${query.host || (hostElement && hostElement.value)}/${
    query.name || (nameElement && nameElement.value)
  }`;
const getPublisherOpts = () => {
  const [, , height] = document.getElementById("quality").value.split(/:/);
  return {
    preview: document.getElementById("preview"),
    constraints: {
      // video: {
      //   height: { exact: height }
      // },
      video: true,
      audio: true,
    },
  };
};

const getPlayer = (
  playerElement = getPlayerElement(),
  streamUrl = getStreamUrl(),
  playerOpts = {
    retryMax: 10,
    retryDelay: 1000,
  },
  shouldLog = true,
  log = (...defaultMessages) => (...passedMessages) =>
    console.log(...[...defaultMessages, ...passedMessages])
) => {
  const player = new Player(playerElement, streamUrl, playerOpts, true);
  player.on(PLAYER_EVENTS.PLAY, log("Started playing", streamUrl));
  player.on(PLAYER_EVENTS.DEBUG, log("Debugging play"));
  return player;
};

const stopPublishing = () => {
  if (publisher) {
    publisher.stop && publisher.stop();
    publisher = null;
  }
};

const stopPlaying = () => {
  if (wrtcPlayer) {
    wrtcPlayer.destroy && wrtcPlayer.destroy();
    wrtcPlayer = null;
  }
};

const stop = () => {
  stopPublishing();
  stopPlaying();

  getPublishElement().innerText = "Publish";
  getPlayElement().innerText = "Play";
};

const play = () => {
  wrtcPlayer = getPlayer();
  getPlayElement().innerText = "Playing...";
  wrtcPlayer.play();
};

const publish = () => {
  if (publisher) publisher.stop();

  publisher = new Publisher(getStreamUrl(), getPublisherOpts(), true);
  publisher.on(PUBLISHER_EVENTS.STREAMING, () => {
    getPublishElement().innerText = "Publishing...";
  });
  publisher.start();
};

const setDefaultValues = () => {
  if (query.host) {
    getHostContainerElement().style.display = "none";
  } else {
    getHostElement().value = config.host;
  }

  if (query.name) {
    getNameContainerElement().style.display = "none";
  } else {
    getNameElement().value = config.name;
  }
};

const setEventListeners = () => {
  // Set event listeners
  getPublishElement().addEventListener("click", publish);
  getPlayElement().addEventListener("click", play);
  getStopElement().addEventListener("click", stop);
  getQualityElement().onchange = publish;
};

const main = () => {
  setDefaultValues();
  setEventListeners();
};

window.addEventListener("load", main);
