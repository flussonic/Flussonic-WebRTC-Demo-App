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
const getNameElement = () => document.getElementById("publishName");
const getNameContainerElement = () =>
  document.getElementById("publishNameContainer");
const getPlayingNameElement = () => document.getElementById("playingName");
// const getPlayingNameContainerElement = () =>
//   document.getElementById('playingNameContainer');
const getPlayerElement = () => document.getElementById("player");
const getPlayElement = () => document.getElementById("play");
const getPublishElement = () => document.getElementById("publish");
const getStopElement = () => document.getElementById("stop");
const getQualityElement = () => document.getElementById("quality");
const getMuteElement = () => document.getElementById("mute");
const getScreenShareElement = () => document.getElementById("screen_share");
const getVideoPublishElement = () => document.getElementById("videoPublish");
const getSameSource = () => document.getElementById("sameSource");
// const getSendError = () => document.getElementById('error');
// const getSendErrorWS = () => document.getElementById('errorWS');
const videoQElement = document.getElementById("videoQuality");
const audioQElement = document.getElementById("audioQuality");
const autoQContainerElement = document.getElementById("autoQ");
const autoQualityElement = document.getElementById("autoQuality");
const abrInfoElement = document.getElementById("abrInfo");
const getCapabilitiesElement = () => document.getElementById("capabilities");

const statsSendEnable = query.statsSendEnable === "true" || false;
const statsSendTime = Number(query.statsSendTime) || 60;

// enables WHIP/WHAP protocol
const whipwhap = query.whipwhap === "true" || false;

const authTokenName = query.authTokenName || "token";
const tokenValue = query[authTokenName] || "";

const getStreamUrl = (
  player = false,
  hostElement = getHostElement(),
  nameElement = getNameElement(),
  playingNameElement = getPlayingNameElement(),
  sameSource = getSameSource()
) => {
  let streamName = query.name || (nameElement && nameElement.value);
  if (player && !sameSource.checked) {
    streamName = playingNameElement && playingNameElement.value;
  }
  return `${query.host || (hostElement && hostElement.value)}/${streamName}`;
};

const returnCapabilities = (data) => {
  let maxDeviceWidth = 320;
  let maxDeviceHeight = 240;
  const { height: maxHeight, width: maxWidth } = data;
  const qualityElement = getQualityElement();
  if (maxHeight && "max" in maxHeight) {
    maxDeviceHeight = maxHeight.max;
  }
  if (maxWidth && "max" in maxWidth) {
    maxDeviceWidth = maxWidth.max;
  }
  Array.prototype.forEach.call(qualityElement.options, (option) => {
    const { dataset } = option;
    const { height, width } = dataset;
    if (maxDeviceHeight && maxDeviceWidth) {
      if (
        maxDeviceHeight < Number.parseInt(height, 10) ||
        maxDeviceWidth < Number.parseInt(width, 10)
      ) {
        option.disabled = true;
        option.classList.add("disabled");
      } else {
        option.disabled = false;
        option.classList.remove("disabled");
      }
    }
  });
};

const getPublisherOpts = (minWidth = null, minHeight = null) => {
  let video = {
    width: { min: 320, ideal: 1920, max: 4096 },
    height: { min: 240, ideal: 1080, max: 2160 },
  };
  if (
    minHeight &&
    (typeof minHeight === "string" || typeof minHeight === "number")
  ) {
    video = {
      ...video,
      // height: { min: minHeight, exact: minHeight },
      height: { exact: Number.parseInt(minHeight) },
    };
  }
  if (
    minWidth &&
    (typeof minWidth === "string" || typeof minWidth === "number")
  ) {
    video = {
      ...video,
      // width: { min: minWidth, exact: minWidth },
      width: { exact: Number.parseInt(minWidth) },
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
      // audio: { echoCancellation: true },
      audio: true,
    },
    returnCapabilities,
    password: query.password,
    sentryConfig: query.sentryConfig,
    // trackStats: false,
    // statsContainer: document.querySelector('.stats-box'),
    statsSendEnable,
    statsSendTime,
    whipwhap,
    videoPreview: document.getElementById("preview-video"),
  };
};

const onVideoChange = (event) => {
  wrtcPlayer.changeTracks(`${event.target.value}${audioQElement.value}`);
};
const onAudioChange = (event) => {
  wrtcPlayer.changeTracks(`${videoQElement.value}${event.target.value}`);
};

const onAutoQualityChange = (event) => {
  if (event.target.checked) {
    videoQElement.disabled = true;
    audioQElement.disabled = true;
    wrtcPlayer.changeTracks("auto");
  } else {
    videoQElement.disabled = false;
    audioQElement.disabled = false;
    wrtcPlayer.changeTracks(`${videoQElement.value}${audioQElement.value}`);
  }
};

const onMediaInfo = (tracks, abr) => {
  const videoLength = videoQElement.options.length;
  for (let i = videoLength - 1; i >= 0; i--) {
    videoQElement.options[i] = null;
  }
  const audioLength = audioQElement.options.length;
  for (let i = audioLength - 1; i >= 0; i--) {
    audioQElement.options[i] = null;
  }

  videoQElement.addEventListener("change", onVideoChange);
  audioQElement.addEventListener("change", onAudioChange);
  autoQualityElement.addEventListener("change", onAutoQualityChange);

  if (abr) {
    autoQContainerElement.style.display = "flex";
    autoQualityElement.checked = true;
    videoQElement.disabled = true;
    audioQElement.disabled = true;
  }

  tracks.forEach((track) => {
    const { content } = track;
    if (content && content.length) {
      if (!abr) {
        videoQElement.disabled = false;
        audioQElement.disabled = false;
      }
      if (content === "audio") {
        const { track_id, sample_rate } = track;
        const option = document.createElement("option");
        option.value = track_id;
        option.text = `${sample_rate} kbps`;
        audioQElement.add(option, null);
      } else if (content === "video") {
        const { track_id } = track;
        const { width = "", height = "" } = params;
        const option = document.createElement("option");
        option.value = track_id;
        option.text = `${width} x ${height}`;
        videoQElement.add(option, null);
      }
    }
  });
};

const onTrackInfo = (trackInfo) => {
  const { audio_track_id, video_track_id } = trackInfo;
  let videoText = "";
  let audioText = "";
  if (video_track_id) {
    const videoLength = videoQElement.options.length;
    for (let i = videoLength - 1; i >= 0; i--) {
      if (videoQElement.options[i].value === video_track_id) {
        videoQElement.value = video_track_id;
        videoText = videoQElement.options[i].text;
      }
    }
  }
  if (audio_track_id) {
    const audioLength = audioQElement.options.length;
    for (let i = audioLength - 1; i >= 0; i--) {
      if (audioQElement.options[i].value === audio_track_id) {
        audioQElement.value = audio_track_id;
        audioText = audioQElement.options[i].text;
      }
    }
  }
  abrInfoElement.innerText = `Auto bitrate set on ${videoText}${
    audioText ? ` with ${audioText} audio` : ""
  }`;
  abrInfoElement.style.opacity = "1";
  setTimeout(() => {
    abrInfoElement.style.opacity = "0";
  }, 3000);
};

const getPlayer = (
  playerElement = getPlayerElement(),
  streamUrl = getStreamUrl(true),
  playerOpts = {
    retryMax: 10,
    retryDelay: 1000,
    sentryConfig: query.sentryConfig,
    onMediaInfo,
    onTrackInfo,
    statsSendEnable,
    statsSendTime,
    whipwhap,
    authTokenName,
    tokenValue,
  },
  shouldLog = true,
  log = (...defaultMessages) =>
    (...passedMessages) =>
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

  const qualityElement = getQualityElement();
  // Array.prototype.forEach.call(qualityElement.options, (option) => {
  //   if (option.value.length) {
  //     option.disabled = true;
  //     option.classList.add('disabled');
  //   }
  // });
  qualityElement.selectedIndex = 0;
  getPublishElement().disabled = false;
};

const stopPlaying = () => {
  autoQContainerElement.style.display = "none";
  videoQElement.disabled = true;
  audioQElement.disabled = true;
  if (wrtcPlayer) {
    wrtcPlayer.destroy && wrtcPlayer.destroy();
    wrtcPlayer = null;
  }
};

const stop = () => {
  stopPublishing();
  stopPlaying();

  // getSendError().disabled = true;
  // getSendErrorWS().disabled = true;
  getMuteElement().disabled = true;
  getScreenShareElement().disabled = true;
  getPublishElement().disabled = false;
  // getPlayElement().innerText = 'Play';

  videoQElement.removeEventListener("change", onVideoChange);
  audioQElement.removeEventListener("change", onAudioChange);
  autoQualityElement.removeEventListener("change", onAutoQualityChange);
};

const play = () => {
  if (wrtcPlayer) {
    wrtcPlayer.destroy && wrtcPlayer.destroy();
    wrtcPlayer = null;
  }
  wrtcPlayer = getPlayer();
  // getPlayElement().innerText = 'Playing...';
  autoQContainerElement.style.display = "none";
  window.webrtcPlayer = wrtcPlayer;
  wrtcPlayer.play();
};

const publish = (width = null, height = null) => {
  if (publisher) publisher.stop();
  publisher = new Publisher(
    getStreamUrl(),
    getPublisherOpts(width, height),
    true
  );
  publisher.on(PUBLISHER_EVENTS.STREAMING, () => {
    getPublishElement().disabled = true;
    // getSendError().disabled = false;
    // getSendErrorWS().disabled = false;
  });
  window.webrtcPublisher = publisher;
  publisher.start();
  getPublishElement().disabled = true;
  getMuteElement().disabled = false;
  getScreenShareElement().disabled = false;
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

const mute = () => {
  getMuteElement().innerHTML =
    getMuteElement().innerHTML === '<i class="icon-volume-mute2"></i>'
      ? '<i class="icon-volume-high"></i>'
      : '<i class="icon-volume-mute2"></i>';
  publisher.mute();
};

const getDevices = async () => {
  // Получаем список устройств
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }

  // List cameras and microphones.
  let deviceList = [];

  await navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      deviceList = devices;
      return deviceList;
    })
    .catch((error) => {
      console.log(
        "Publisher::mediaDevices.getUserMedia exception occured.",
        error
      );
    });

  const inputVideoDevices = deviceList.filter(
    (device) => device.kind === "videoinput"
  );
  return inputVideoDevices;
};

const getCapabilities = () => {
  getDevices().then((inputVideoDevices) => {
    inputVideoDevices[0].getCapabilities &&
      returnCapabilities(inputVideoDevices[0].getCapabilities());
  });
};

const shareScreen = () => {
  if (publisher) {
    publisher.shareScreen();
    getScreenShareElement().classList.toggle("active");
  }
};

const setEventListeners = () => {
  // Set event listeners
  getPublishElement().addEventListener("click", publish);
  getPlayElement().addEventListener("click", play);
  getStopElement().addEventListener("click", stop);
  getQualityElement().onchange = (e) => {
    const [width, height] = e.currentTarget.value.split(/:/);
    publish(width, height);
  };
  getMuteElement().addEventListener("click", mute);
  getCapabilitiesElement().addEventListener("click", getCapabilities);
  getScreenShareElement().addEventListener("click", shareScreen);
  // getSendError().addEventListener('click', sendError);
  // getSendErrorWS().addEventListener('click', sendErrorWS);
};

const main = () => {
  setDefaultValues();
  setEventListeners();
};

window.addEventListener("load", main);
