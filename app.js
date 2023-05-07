const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const app = express();

app.use(cors());
app.use(express.json());

async function convertToM4a(mp3FilePath, m4aFilePath) {
  ffmpeg(mp3FilePath)
    .format("m4a")
    .on("error", (err) => console.error(err))
    .on("end", () => console.log("Finished!"))
    .save(m4aFilePath);
  console.log("before convert");
}

app.use("/musics/:musicPath", (req, res, next) => {
  const musicPath = req.params.musicPath;
  const musicId = req.params.musicPath.split(".")[0];
  const format = req.params.musicPath.split(".")[1];
  console.log(musicId);

  console.log("in check exist file");
  if (fs.existsSync(path.join(__dirname, "musics", musicPath))) return next();

  // delete after 10 minutes
  console.log("in add setTimeout");
  setTimeout(
    ((musicId, musicPath) => {
      if (fs.existsSync(path.join(__dirname, "musics", musicId + ".mp3")))
        fs.unlinkSync(path.join(__dirname, "musics", musicId + ".mp3"));
      if (fs.existsSync(path.join(__dirname, "musics", musicPath)))
        fs.unlinkSync(path.join(__dirname, "musics", musicPath));
    }).bind(null, musicId, musicPath),
    1000 * 60 * 5
  );

  console.log("in create stream music");
  const stream = ytdl(`https://www.youtube.com/watch?v=${musicId}`, {
    filter: "audioonly",
    quality: "highestaudio",
    format: "mp3",
  });

  console.log("pipe");
  stream.pipe(
    fs.createWriteStream(path.join(__dirname, "musics", musicId + ".mp3"))
  );

  console.log("check on end");
  stream.on("end", () => {
    stream.destroy();
    if (format !== "mp3") {
      convertToM4a(
        path.join(__dirname, "musics", musicId + ".mp3"),
        path.join(__dirname, "musics", musicPath)
      );
      console.log("after convert");
    }

    console.log("in next");
    console.log(__dirname);
    console.log(
      "is have file:",
      fs.existsSync(path.join(__dirname, "musics", musicId + ".mp3"))
    );
    next();
  });
});

app.use("/musics", express.static(path.join(__dirname, "musics")));
app.use("/music-folder", express.static(path.join(__dirname, "musics")));

app.use("/test", (req, res, next) => {
  res.send({ result: { text: "oke" } });
});

app.listen(8888, () => {
  console.log("connected!");
});
