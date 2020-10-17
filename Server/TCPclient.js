const clients = net.connect({port: 2222}, () => {
  // 'connect' listener
  console.log('connected to server!');
  clients.write('world!\r\n');
});
clients.on('data', (data) => {
  console.log(data.toString());
  clients.end();
});
clients.on('end', () => {
  console.log('disconnected from server');
});