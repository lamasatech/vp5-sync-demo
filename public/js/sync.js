const socket = io('http://localhost:3000');

// let's assume that the client page, once rendered, knows what room it wants to join
const guid = 'abc123_guid2';
const token = 'abc123_token2';
const entityId = 'abc123_entityId';

socket.on('connect', () => {
  console.log('connect done');
  // Connected, let's sign-up for to receive messages for this room
  socket.emit('register', {
    entityId, token, guid,
  });

  // this code can be run when the client going online after being offline or for full sync
  setTimeout(() => {
    // hey server please send all data I do no have
    socket.emit('syncRequest', {
      table: 'all', entityId, token, guid,
    });
  }, 3000);
});

socket.on('pushActivity', (data, callback) => {
  console.log('Incoming pushActivity:', data);
  const records = [];
  console.log('please mark this data as synced:', records);
  callback(records);
});

// in case of error
socket.on('error', (evData) => {
  console.error('Connection Error:', evData);
});

socket.on('syncReply', (data, callback) => {
  console.log(`syncReply done: ${data.table}`);
  console.log('Socket (server-side): date to be saved in my local db:', data);
  const records = [];
  data.records.forEach((element) => {
    records.push(element.id);
  });
  console.log('please mark this data as synced:', records);
  callback(records);
});


var sampleData = [
    { ProductID: 1, ProductName: "Apple iPhone 5s", Introduced: new Date(2013, 8, 10), UnitPrice: 525, Discontinued: false, UnitsInStock: 10 },
    { ProductID: 2, ProductName: "HTC One M8", Introduced: new Date(2014, 2, 25), UnitPrice: 425, Discontinued: false, UnitsInStock: 3 },
    { ProductID: 3, ProductName: "Nokia 5880", Introduced: new Date(2008, 10, 2), UnitPrice: 275, Discontinued: true, UnitsInStock: 0 }
];


