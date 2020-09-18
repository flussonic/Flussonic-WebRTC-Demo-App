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
const getQualityElement = () => document.getElementById("quality");
const getMuteElement = () => document.getElementById("mute");
const getVideoPublishElement = () => document.getElementById("videoPublish");
const getSendError = () => document.getElementById("error");
const getSendErrorWS = () => document.getElementById("errorWS");

const getStreamUrl = (
  hostElement = getHostElement(),
  nameElement = getNameElement()
) =>
  `${query.host || (hostElement && hostElement.value)}/${
    query.name || (nameElement && nameElement.value)
  }`;

const getPublisherOpts = (height = null) => {
  let video = {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
  };
  if (height && (typeof height === "string" || typeof height === "number")) {
    video = {
      height: { exact: height },
    };
  }

  const videoPublishElement = getVideoPublishElement();
  if (videoPublishElement.checked === false) {
    video = false;
  }

  return {
    preview: document.getElementById("preview"),
    constraints: {
      video,
      audio: true,
    },
    password: query.password,
    trackStats: false,
    // statsContainer: document.querySelector('.stats-box'),
    videoPreview: document.getElementById("preview-video"),
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
  getSendError().disabled = true;
  getSendErrorWS().disabled = true;
  getMuteElement().disabled = true;
};

const play = () => {
  wrtcPlayer = getPlayer();
  getPlayElement().innerText = "Playing...";
  wrtcPlayer.play();
};

const publish = (height = null) => {
  if (publisher) publisher.stop();

  publisher = new Publisher(getStreamUrl(), getPublisherOpts(height), true);
  publisher.on(PUBLISHER_EVENTS.STREAMING, () => {
    getPublishElement().innerText = "Publishing...";
    getSendError().disabled = false;
    getSendErrorWS().disabled = false;
  });
  publisher.start();
  getMuteElement().disabled = false;
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

const sendError = () => {
  if (publisher) {
    publisher.sendErrorLog(true);
  }
};

const sendErrorWS = () => {
  if (publisher) {
    publisher.sendErrorLog();
  }
};

const setEventListeners = () => {
  // Set event listeners
  getPublishElement().addEventListener("click", publish);
  getPlayElement().addEventListener("click", play);
  getStopElement().addEventListener("click", stop);
  getQualityElement().onchange = (e) => {
    const [, , height] = e.currentTarget.value.split(/:/);
    publish(height);
  };
  getMuteElement().addEventListener("click", mute);
  getSendError().addEventListener("click", sendError);
  getSendErrorWS().addEventListener("click", sendErrorWS);
};

const mute = () => {
  getMuteElement().innerText =
    getMuteElement().innerText === "Mute" ? "Unmute" : "Mute";
  publisher.mute();
};

const main = () => {
  setDefaultValues();
  setEventListeners();
};

window.addEventListener("load", main);
