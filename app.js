const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const app = express();

// const delay = (ms) => new Promise((res) => setTimeout(res, ms));
// (async () => {
//   while (true === true) {
//     const used = process.memoryUsage();
//     for (let key in used) {
//       console.log(
//         `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
//       );
//     }
//     await delay(10000);
//   }
// })();

const mapCheck = new Map();

app.use(cors());
app.use(express.json());

async function convertToM4a(mp3File, m4aFile, res, startTime) {
  exec(
    `ffmpeg -i ${__dirname.replace(/\\/g, "/") + `/musics/${mp3File}`} ${
      __dirname.replace(/\\/g, "/") + `/musics/${m4aFile}`
    }`,
    (err) => {
      if (err)
        res.send({
          error: { time: (Date.now() - startTime) / 1000, message: err },
        });
      else {
        res.send({
          result: {
            time: (Date.now() - startTime) / 1000,
            message: "converted",
            url: `https://audio-only.onrender.com/musics/${m4aFile}`,
          },
        });
        mapCheck.set(m4aFile, true);
        if (fs.existsSync(path.join(__dirname, "musics", mp3File)))
          fs.unlinkSync(path.join(__dirname, "musics", mp3File));
        mapCheck.delete(mp3File);
      }
    }
  );
}

app.use("/music-check/:musicPath", (req, res, next) => {
  const startTime = Date.now();
  const musicPath = req.params.musicPath;
  const musicId = req.params.musicPath.split(".")[0];
  const format = req.params.musicPath.split(".")[1];
  console.log(musicId);

  if (mapCheck.has(musicPath))
    return res.send({
      result: {
        time: (Date.now() - startTime) / 1000,
        message: "converted",
        url: `https://audio-only.onrender.com/musics/${musicPath}`,
      },
    });

  const stream = ytdl(`https://www.youtube.com/watch?v=${musicId}`, {
    filter: "audioonly",
    quality: "highestaudio",
  });

  stream.pipe(
    fs.createWriteStream(path.join(__dirname, "musics", musicId + ".mp3"))
  );

  stream.on("error", (err) => {
    console.log(err);
  });

  stream.on("end", () => {
    stream.destroy();
    mapCheck.set(musicId + ".mp3", true);

    if (format !== "mp3")
      convertToM4a(musicId + ".mp3", musicPath, res, startTime);
    else
      return res.send({
        result: {
          time: (Date.now() - startTime) / 1000,
          message: "converted",
          url: `https://audio-only.onrender.com/musics/${musicPath}`,
        },
      });
  });
});

app.use("/musics", express.static(path.join(__dirname, "musics")));

app.use("/test", (req, res, next) => {
  res.send({ result: { text: "oke" } });
});

app.use("/delete", (req, res) => {
  mapCheck.forEach((value, key) => {
    console.log(key, value);
    if (fs.existsSync(path.join(__dirname, "musics", key)))
      fs.unlinkSync(path.join(__dirname, "musics", key));
  });
  res.send({ result: "oke" });
});

app.listen(8888, () => {
  console.log("connected!");
});
