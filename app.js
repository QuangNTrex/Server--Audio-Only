const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/musics/:musicId", (req, res, next) => {
  const musicId = req.params.musicId.split(".")[0];
  console.log(musicId);

  if (fs.existsSync(path.join(__dirname, "musics", musicId + ".mp3")))
    return next();

  // delete after 10 minutes
  setTimeout(
    ((musicId) => {
      fs.unlinkSync(path.join(__dirname, "musics", musicId + ".mp3"));
    }).bind(null, musicId),
    1000 * 60 * 10
  );

  const stream = ytdl(`https://www.youtube.com/watch?v=${musicId}`, {
    filter: "audioonly",
    quality: "highestaudio",
    format: "mp3",
  });

  stream.pipe(
    fs.createWriteStream(path.join(__dirname, "musics", musicId + ".mp3"))
  );

  stream.on("end", () => next());
});

app.use("/musics", express.static(path.join(__dirname, "musics")));

app.use("/test", (req, res, next) => {});

app.listen(8888, () => {
  console.log("connected!");
});
