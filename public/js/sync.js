// const socket = io('http://192.168.1.100:3000');
// const socket = io('http://localhost:3000');
// const socket = io('https://vp-sync-staging.herokuapp.com/');
let socket;
// let's assume that the client page, once rendered, knows what room it wants to join
let guid;
let token;
let entityId;
let recreateDBCol;

function setup(guidParam,tokenParam,entityIdParam){
   guid = guidParam;
   token = tokenParam;
   entityId = entityIdParam;

// const guid = 'abc123_guid2';
// const token = 'abc123_token2';
// const entityId = '24a74cec-0b4a-3a69-8418-8ebdce386034';

// const socket = io('http://192.168.1.100:3000');
 // socket = io('http://localhost:3000');
 const socket = io('https://vp-sync-staging.herokuapp.com/');

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

socket.on('pushActivity', (data) => {
  var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
  dbObj.transaction(function (tx) {
      const log = data.changes;
      let logSQL = `INSERT INTO trans (id,recordId,tableName,transactionType,dataBefore,dataAfter,changedProperties,changeSource,creationTime,isSync,syncTo,entityId) 
      values 
      (
        '${log.recordId}',
        '${log.recordId}',
        '${log.tableName}',
        '${log.transactionType}',
        '${log.dataBefore}',
        '${log.dataAfter}',
        '${log.changedProperties}',
        '${log.changeSource}',
        '${log.creationTime}',
        'false',
        '${log.syncTo}',
        '${log.entityId}'
        )`
      console.log('logSQL', JSON.stringify(logSQL));
      tx.executeSql(logSQL);
      
  });
  var dbOptObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
  dbOptObj.transaction(function (tx2) {
   
    const transaction = data.changes.dataAfter ? data.changes.dataAfter :data.changes.dataBefore;

    let transactionSQL;
    if(data.changes.transactionType === 'insert')
    {
    transactionSQL = 
    `insert into ${data.changes.tableName}
        (${Object.keys(transaction).map((s) => s).join(',')})
        values ('${Object.values(transaction).map((s) => s).join("','")}')`;
    } else if(data.changes.transactionType === 'update'){
    const columnUpdates = [];
      for (const [key, value] of Object.entries(transaction)) {
        columnUpdates.push(`${key}='${value}'`)
      }
      columnUpdates.shift();

      transactionSQL = 
      `UPDATE ${data.changes.tableName}
      SET  ${columnUpdates.join(',')}
      WHERE id = '${transaction.id}'`;
    } else if(data.changes.transactionType === 'delete'){
      transactionSQL = `DELETE FROM ${data.changes.tableName} WHERE id = '${transaction.id}'`;
    }
    console.log('transactionSQL', JSON.stringify(transactionSQL));
    tx2.executeSql(transactionSQL);

    loadDbToGrid();
    pushNotifyToolbar(data.changes.tableName,data.changes.transactionType)
});
  console.log('please mark this data as synced:', data);
});

// in case of error
socket.on('error', (evData) => {
  console.error('Connection Error:', evData);
  mainStatus.innerHTML = `<span style="color:red">ERROR</span>`;
});

socket.on('syncReply', (data, callback) => {
  let createColumn;
  if(data.records) {
  createColumn =  Object.keys(data.records[0]).map((s)=>s);
  recreateDBCol = `${createColumn.join(',')}`
    // if(createColumn[0]=='id'){
    //   createColumn.shift();
    //   recreateDBCol = `id unique,${createColumn.join(',')}`
    // } else {
    //   recreateDBCol = `${createColumn.join(',')}`
    // }
}
 
  var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
  dbObj.transaction(function (tx2) {
    tx2.executeSql(`CREATE TABLE IF NOT EXISTS ${data.table} (${recreateDBCol})`);
  });

  dbObj.transaction(function (tx) {
    console.log(`syncReply done: ${data.table}`);
    console.log('Socket (server-side): date to be saved in my local db:', data);
    const records = [];
    data.records.forEach((element) => {
       console.log('element', JSON.stringify(element));
       if(element.deleted_at === null) delete element.deleted_at;
       if(element.compilance_metadata === null) delete element.compilance_metadata;
       if(element.department_id === null) delete element.department_id;
      tx.executeSql(`insert into ${data.table}
          (${Object.keys(element).map((s) => s).join(',')})
          values ('${Object.values(element).map((s) => typeof(s)=== 'object'?JSON.stringify(s):s).join("','")}')`);
          
          console.log(`insert into ${data.table}
          (${Object.keys(element).map((s) => s).join(',')})
          values ('${Object.values(element).map((s) => typeof(s)=== 'object'?JSON.stringify(s):s).join("','")}')`)
      console.log('data added');
      records.push(Object.values(element)[0]);
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


}


