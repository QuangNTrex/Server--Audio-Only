const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/music/:videoId", (req, res, next) => {
  const videoId = req.params.videoId;
  console.log(videoId);
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });

  res.setHeader("Content-Type", "audio/mpeg");

  stream.pipe(res);

  stream.on("end", () => {
    console.log("end");
  });
});

app.use("/musics", express.static(path.join(__dirname, "musics")));

app.use("/test", (req, res, next) => {});

app.listen(8888, () => {
  console.log("connected!");
});
