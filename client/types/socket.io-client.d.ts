// src/@types/socket.io-client.d.ts
declare module 'socket.io-client' {
  type Socket = any;
  const io: any;
  export { io, Socket };
  export default io;
}
