const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
// const { Socket } = require("socket.io");

dotenv.config();

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT Exception Shutting Down ....");
  process.exit(1);
});

const http = require("http");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const DB = process.env.DBURI.replace("<PASSWORD>", process.env.DBPASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("DB Connection is Successful");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App is running on the PORT ${port}`);
});

io.on("connection", async (socket) => {
  console.log(`socket: ${socket}`);
  const user_id = socket.handshake.query("user_id");

  const socket_id = socket.id;

  console.log(`User Connected to the socket id: ${socket_id}`);

  if (user_id) {
    await User.findByIdAndUpdate(user_id, { socket_id });
  }

  //We can write out socket lisstener here...
  socket.on("friend_reuest", async (data) => {
    console.log(data.to);

    const to = await User.findById(data.to);

    //TODO create a friend request...

    io.to(to.socket_id).emit("new_friend_request", {
      //
    });
  });
});
