const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("ffmpeg");
const { exec } = require("child_process");
const app = express();

const mapCheck = new Map();

app.use(cors());
app.use(express.json());

async function convertToM4a(mp3File, m4aFile, res, startTime) {
  exec(
    `ffmpeg -i ${__dirname.replace(/\\/g, "/") + `/musics/${mp3File}`} ${
      __dirname.replace(/\\/g, "/") + `/musics/${m4aFile}`
    }`,
    (err, std) => {
      console.log(err);
      console.log("completed convert");
      if (err)
        res.send({
          error: { time: (Date.now() - startTime) / 1000, message: err },
        });
      else
        res.send({
          result: {
            time: (Date.now() - startTime) / 1000,
            message: "converted",
          },
        });
    }
  );
}

app.use("/musics/:musicPath", (req, res, next) => {
  const startTime = Date.now();
  const musicPath = req.params.musicPath;
  const musicId = req.params.musicPath.split(".")[0];
  const format = req.params.musicPath.split(".")[1];
  console.log(musicId);

  console.log("in check exist file");
  if (fs.existsSync(path.join(__dirname, "musics", musicPath)))
    return res.send({ result: { message: "converted" } });

  setTimeout(
    ((musicId, musicPath) => {
      if (fs.existsSync(path.join(__dirname, "musics", musicId + ".mp3")))
        fs.unlinkSync(path.join(__dirname, "musics", musicId + ".mp3"));
      if (fs.existsSync(path.join(__dirname, "musics", musicPath)))
        fs.unlinkSync(path.join(__dirname, "musics", musicPath));
    }).bind(null, musicId, musicPath),
    1000 * 60 * 5
  );

  const stream = ytdl(`https://www.youtube.com/watch?v=${musicId}`, {
    filter: "audioonly",
    quality: "highestaudio",
  });

  stream.pipe(
    fs.createWriteStream(path.join(__dirname, "musics", musicId + ".mp3"))
  );

  console.log("check on end");
  stream.on("end", () => {
    stream.destroy();
    if (format !== "mp3") {
      convertToM4a(musicId + ".mp3", musicPath, res, startTime);
      console.log("after convert");
    }
  });
});

app.use("/music-folder", express.static(path.join(__dirname, "musics")));

app.use("/test", (req, res, next) => {
  res.send({ result: { text: "oke" } });
});

app.listen(8888, () => {
  console.log("connected!");
});
