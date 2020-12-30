// const socket = io('http://192.168.1.100:3000');
// const socket = io('http://localhost:3000');
const socket = io('https://vp-sync-staging.herokuapp.com/');

// let's assume that the client page, once rendered, knows what room it wants to join
const guid = 'abc123_guid2';
const token = 'abc123_token2';
const entityId = 'b9bcf91f-bd42-3f84-973b-98534146daeb';

socket.on('disconnect', () => {
  mainStatus.innerHTML = `<span style="color:red">Disconnected</span>`;
});

socket.on('connect', () => {
  console.log('connect done');
  // Connected, let's sign-up for to receive messages for this room
  socket.emit('register', {
    entityId, token, guid,
  });
  // you can always check your room under URL/api/v1/stats/all-online
  mainStatus.innerHTML = `<span style="color:green">Connected</span>`;
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
  mainStatus.innerHTML = `<span style="color:red">ERROR</span>`;
});

socket.on('syncReply', (data, callback) => {
  var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
  dbObj.transaction(function (tx) {
    console.log(`syncReply done: ${data.table}`);
    console.log('Socket (server-side): date to be saved in my local db:', data);
    const records = [];
    data.records.forEach((element) => {
      console.log('element', JSON.stringify(element));
      tx.executeSql(`insert into visits
          (id, user_id, host_id, entity_id, scan_data_type_id, notes, date, signed_in, signed_out, deleted_at , created_at, updated_at)
          values
          (
            '${element.id}',
            '${element.user_id}',
            '${element.host_id}',
            '${element.entity_id}',
            '${element.scan_data_type_id}',

            '${element.notes}',
            '${element.date}',

            '${element.signed_in}',
            '${element.signed_out}',

            '${element.deleted_at}',
            '${element.created_at}',
            '${element.updated_at}'
          )`);
      console.log('data added');
      records.push(element.id);
    });
    if (records.length === 0) {
      alert('No new records')
    } else {
      console.log('please mark this data as synced:', records);
      callback(records);
      loadDbToGrid()
    }
  });
});




