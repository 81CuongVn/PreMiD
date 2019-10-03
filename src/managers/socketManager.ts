import socketIo from "socket.io";
import { createServer, Server } from "http";
import { app, dialog } from "electron";
import { success, error } from "../util/debug";
import { deinit as deinitInputs } from "./inputManager";
import { update as updateSettings } from "./settingsManager";
import { openFileDialog } from "./presenceDevManager";
import { setActivity, clearActivity, destroy } from "./discordManager";

export let io: socketIo.Server;
export let socket: socketIo.Socket;
export let server: Server;

export function init() {
  return new Promise(resolve => {
    //* Create server
    //* create SocketIo server, don't server client
    //* Try to listen to port 3020
    //* If that fails/some other error happens run socketError
    //* If someone connects to socket socketConnection
    server = createServer();
    io = socketIo(server, { serveClient: false });
    server.listen(3020, () => {
      //* Resolve promise
      //* Debug info
      resolve();
      success("Opened socket");
    });
    server.on("error", socketError);
    io.on("connection", socketConnection);
  });
}

function socketConnection(cSocket: socketIo.Socket) {
  //* Show debug
  //* Set exported socket letiable to current socket
  //* Handle setActivity event
  //* Handle clearActivity event
  //* Handle settingsUpdate
  //* Handle presenceDev
  //* Handle version request
  //* Once socket user disconnects run cleanup
  success("Socket connection");
  socket = cSocket;
  socket.on("setActivity", setActivity);
  socket.on("clearActivity", clearActivity);
  socket.on("settingUpdate", updateSettings);
  socket.on("selectLocalPresence", openFileDialog);
  socket.on("getVersion", () =>
    socket.emit("receiveVersion", app.getVersion().replace(/[\D]/g, ""))
  );
  socket.once("disconnect", () => {
    //* Show debug
    //* Destroy all open RPC connections
    //* Clear input bindings
    error("Socket disconnection.");
    destroy();
    deinitInputs();
  });
}

//* Runs on socket errors
function socketError(e: any) {
  //* Show debug
  //* If port in use
  error(e.message);
  if (e.code === "EADDRINUSE") {
    //* Focus app
    //* Show error dialog
    //* Exit app afterwards
    app.focus();
    dialog.showErrorBox(
      "Oh noes! Port error...",
      `${app.getName()} could not bind to port ${
        e.port
      }.\nIs ${app.getName()} running already?`
    );
    app.exit(0);
  }
}
