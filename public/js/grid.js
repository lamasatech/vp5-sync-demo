let mainData = [];
let isDateField =[];

function getIndexById(id) {
    var idx,
        l = mainData.length;

    for (var j = 0; j < l; j++) {
        if (mainData[j].id == id) {
            return j;
        }
    }
    return null;
}

var newGuid = function () {
    var result = '';
    var hexcodes = "0123456789abcdef".split("");

    for (var index = 0; index < 32; index++) {
        var value = Math.floor(Math.random() * 16);

        switch (index) {
            case 8:
                result += '-';
                break;
            case 12:
                value = 4;
                result += '-';
                break;
            case 16:
                value = value & 3 | 8;
                result += '-';
                break;
            case 20:
                result += '-';
                break;
        }
        result += hexcodes[value];
    }
    return result;
};

function generateColumns(columnNames){
    if(columnNames)
    {
        return columnNames.map(function(name){
            return { field: name, format: (isDateField[name] ? "{0:D}" : "") };
          })
    }
   
}
  
function generateModel(columnNames) {

    var sampleDataItem = columnNames;

    var model = {};
    var fields = {};
    for (var property in sampleDataItem) {
      if(property.indexOf("ID") !== -1){
        model["id"] = property;
      }
      var propType = typeof sampleDataItem[property];

      if (propType === "number" ) {
        fields[property] = {
          type: "number",
          validation: {
            required: true
          }
        };
        if(model.id === property){
          fields[property].editable = false;
          fields[property].validation.required = false;
        }
      } else if (propType === "boolean") {
        fields[property] = {
          type: "boolean"
        };
      } else if (propType === "string") {
        var parsedDate = kendo.parseDate(sampleDataItem[property]);
        if (parsedDate) {
          fields[property] = {
            type: "date",
            validation: {
              required: true
            }
          };
          isDateField[property] = true;
        } else {
          fields[property] = {
            validation: {
              required: true
            }
          };
        }
      } else {
        fields[property] = {
          validation: {
            required: true
          }
        };
      }
    }

    model.fields = fields;

    return model;
}

function drawGrid(mainData) {
    let schemaField={};
    let schemaColumn = [];

    if(mainData.length>0) {
        schemaField = generateModel(mainData[0]);
        schemaColumn = generateColumns(Object.keys(mainData[0]));
        console.log(`schemaField${JSON.stringify(schemaField)}`)
    }
    
    var mainDataNextID = mainData.length + 1;
    var dataSource = new kendo.data.DataSource({
        transport: {
            read: function (e) {
                // On success.
                e.success(mainData);
                // On failure.
                //e.error("XHR response", "status code", "error message");
            },
            create: function (e) {
                // Assign an ID to the new item.
                // Save data item to the original datasource.
                e.data.id = newGuid();
                mainData.push(e.data);
                // On success.
                e.success(e.data);
                console.log('e.data', JSON.stringify(e.data));
                var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
                dbObj.transaction(function (tx) {
                    const sql = `insert into trans
                    (
                        id,
                        changedProperties,
                        isSync,
                        syncTo,
                        recordId,
                        tableName,
                        transactionType,
                        dataAfter,
                        changeSource,
                        creationTime,
                        entityId
                    )
                    values
                    (
                        '${newGuid()}','all','no','','${e.data.id}','visits','insert','${JSON.stringify(e.data)}', '${guid}',
                        '${(new Date()).toISOString()}', '${e.data.entity_id}'
                    )`
                    console.log('sqlsqlsqlsql', JSON.stringify(sql));
                    tx.executeSql(sql);
                    var dbObj2 = openDatabase(Database_Name, Version, Text_Description, Database_Size);
                    dbObj2.transaction(function (tx2) {
                        tx2.executeSql(`insert into ${document.getElementById('tableNameDDL').value}
                            (${Object.keys(e.data).map((s) => s).join(',')})
                            values
                            ('${Object.values(e.data).map((s) => s).join("','")}')`);

                        alert('Added to both RDB and TransDB')
                       // loadDbToGrid()
                    });
                });
                // On failure.
                //e.error("XHR response", "status code", "error message");
            },
            update: function (e) {
                // Locate item in original datasource and update it.
                const dataBefore = JSON.stringify(mainData[getIndexById(e.data.id)]); 
                mainData[getIndexById(e.data.id)] = e.data;
                // On success.
                e.success();
                var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
               dbObj.transaction(function (tx) {
                    const sql = `insert into trans
                    (
                        id,
                        changedProperties,
                        isSync,
                        syncTo,
                        recordId,
                        tableName,
                        transactionType,
                        dataBefore,
                        dataAfter,
                        changeSource,
                        creationTime,
                        entityId
                    )
                    values
                    (
                        '${newGuid()}',
                        'part',
                        'no',
                        '${guid}',
                        '${e.data.id}',
                        'visits',
                        'update',
                        '${dataBefore}',                
                        '${JSON.stringify(e.data)}', 
                        '${guid}',
                        '${(new Date()).toISOString()}',
                        '${e.data.entity_id}'
                    )`
                    console.log('sqlsqlsqlsql', JSON.stringify(sql));
                    tx.executeSql(sql);
                    var dbObj2 = openDatabase(Database_Name, Version, Text_Description, Database_Size);
                    dbObj2.transaction(function (tx2) {
                        const columnUpdates = [];
                        for (const [key, value] of Object.entries(e.data)) {
                            columnUpdates.push(`${key}='${value}'`)
                        }
                        columnUpdates.shift();

                        tx2.executeSql(`UPDATE ${document.getElementById('tableNameDDL').value}
                            SET ${columnUpdates.join(',')}
                            WHERE id = '${e.data.id}'`);

                        alert('update at RDB and Added to  TransDB')
                    });
                });
                // On failure.
                // e.error("XHR response", "status code", "error message");
            },
            destroy: function (e) {
                const dataBefore = JSON.stringify(mainData[getIndexById(e.data.id)]); 
                // Locate item in original datasource and remove it.
                mainData.splice(getIndexById(e.data.id), 1);
                // On success.
                e.success();
                var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
                dbObj.transaction(function (tx) {
                     const sql = `insert into trans
                     (
                         id,
                         changedProperties,
                         isSync,
                         syncTo,
                         recordId,
                         tableName,
                         transactionType,
                         dataBefore,
                         changeSource,
                         creationTime,
                         entityId
                     )
                     values
                     (
                         '${newGuid()}',
                         'all',
                         'no',
                         '${guid}',
                         '${e.data.id}',
                         'visits',
                         'delete',
                         '${dataBefore}',                
                         '${guid}',
                         '${(new Date()).toISOString()}',
                         '${e.data.entity_id}'
                     )`
                     console.log('sqlsqlsqlsql', JSON.stringify(sql));
                     tx.executeSql(sql);
                     var dbObj2 = openDatabase(Database_Name, Version, Text_Description, Database_Size);
                     dbObj2.transaction(function (tx2) {
                         tx2.executeSql(`DELETE FROM  ${document.getElementById('tableNameDDL').value} WHERE id = '${e.data.id}'`);
                         alert('delete at RDB and Added to  TransDB')
                         //loadDbToGrid()
                     });
                 });
                // On failure.
                // e.error("XHR response", "status code", "error message");
            }
        },
        error: function (e) {
            // Handle data operation error.
            alert("Status: " + e.status + "; Error message: " + e.errorThrown);
        },
        pageSize: 100,
        batch: false,
        schema: {
            model: {
                id: "id",
                fields: schemaField,
            }
        }
    });
    $("#grid").empty();
    $("#grid").kendoGrid({
        dataSource: dataSource,
        pageable: true,
        toolbar: ["create"],
        columns: schemaColumn,
        editable: "inline"
    });
}

function dropTransDb() {
    var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        tx.executeSql(`drop TABLE IF EXISTS trans`);
        alert('Db is dropped')
        loadDbToGrid();
    });
}

function dropDb(tableName) {
    console.log(`drop table ${tableName}`)
    var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        tx.executeSql(`drop TABLE IF EXISTS ${tableName}`);
        alert('Db is dropped')
        loadDbToGrid();
    });
}

function halfSyncDb(tableName) {
    socket.emit('syncRequest', {
        table: `${tableName}`, entityId, token, guid,
        syncType: 'half',
    });
}

function doPutActivity() {
    var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        let mainData = [];
        tx.executeSql(`SELECT * from trans where isSync='no' `, [], function (tx, results) {
            const payLoad = [];
            var len = results.rows.length, i;
            mainCounter.innerHTML = len;
            console.log('trans len', JSON.stringify(len));
            for (i = 0; i < len; i++) {

                let beforeDataRecord, mainDataRecord ;
                if(results.rows.item(i).dataAfter) {
                    mainDataRecord = JSON.parse(results.rows.item(i).dataAfter);

                    let date = new Date(mainDataRecord.date);
                    mainDataRecord.date = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

                    date = new Date(mainDataRecord.signed_out);
                    mainDataRecord.signed_out = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

                    var d = new Date(mainDataRecord.signed_in);
                    mainDataRecord.signed_in = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(mainDataRecord.signed_out);
                    mainDataRecord.signed_out = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(mainDataRecord.created_at);
                    mainDataRecord.created_at = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(mainDataRecord.updated_at);
                    mainDataRecord.updated_at = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(mainDataRecord.deleted_at);
                    mainDataRecord.deleted_at = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');
                    }
                if(results.rows.item(i).dataBefore) {
                    beforeDataRecord = JSON.parse(results.rows.item(i).dataBefore);
                    let date = new Date(beforeDataRecord.date);

                    beforeDataRecord.date = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

                    date = new Date(beforeDataRecord.signed_out);
                    beforeDataRecord.signed_out = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

                    var d = new Date(beforeDataRecord.signed_in);
                    beforeDataRecord.signed_in = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(beforeDataRecord.signed_out);
                    beforeDataRecord.signed_out = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(beforeDataRecord.created_at);
                    beforeDataRecord.created_at = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(beforeDataRecord.updated_at);
                    beforeDataRecord.updated_at = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                    d = new Date(beforeDataRecord.deleted_at);
                    beforeDataRecord.deleted_at = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('/') + ' ' + [d.getHours().toString().padStart(2, '0'), d.getMinutes().toString().padStart(2, '0'), d.getSeconds().toString().padStart(2, '0')].join(':');

                }
                payLoad.push({
                    "_id": results.rows.item(i).id,
                    "recordId": results.rows.item(i).recordId,
                    "tableName": results.rows.item(i).tableName,
                    "transactionType": results.rows.item(i).transactionType,
                    "dataBefore": beforeDataRecord?beforeDataRecord:{},
                    "dataAfter": mainDataRecord,
                    "changedProperties": Object.keys(mainDataRecord || beforeDataRecord),
                    "changeSource": results.rows.item(i).changeSource,
                    "creationTime": results.rows.item(i).creationTime,
                    "syncTo": [
                        results.rows.item(i).changeSource
                    ],
                    "entityId": results.rows.item(i).entityId
                });
            }
            console.log('payLoad', JSON.stringify(payLoad));
            socket.emit('putActivity', { payLoad }, (records) => {
                records.forEach(async (record) => {
                    console.log(`update isSync yes record: ${record}`);
                    var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
                    dbObj.transaction(function (tx) {
                        let SQL = `Update trans set isSync='yes' where id='${record}'`
                        console.log('SQL', JSON.stringify(SQL));
                        tx.executeSql(SQL);
                        loadDbToGrid();
                    });

                });
            });
        });
    });

}

 function recreateDb(tableName) {
    dropDb(tableName)
    // loadDbToGrid()
    socket.emit('syncRequest', {
        table: `${tableName}`, entityId, token, guid,
        syncType: 'full',
    });
}

function loadDbToGrid() {
    mainCounter.innerHTML = 0;
    drawGrid([]);
    var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        
        tx.executeSql(`SELECT * from ${document.getElementById('tableNameDDL').value}`, [], function (tx, results) {
            var len = results.rows.length, i;
            mainCounter.innerHTML = len;
            console.log('len', JSON.stringify(len));
            mainData = [];
            for (i = 0; i < len; i++) {
                mainData.push(results.rows.item(i));
            }
            console.log('mainData');
            console.log(mainData);
            drawGrid(mainData)

            var dbObj2 = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
            dbObj2.transaction(function (tx) {
                let mainData = [];
                tx.executeSql('SELECT * from trans', [], function (tx, results) {
                    var len = results.rows.length;
                    mainCounter2.innerHTML = len;
                    console.log('trans len', JSON.stringify(len));
                }, null);
                tx.executeSql(`SELECT * from trans where isSync='no' `, [], function (tx, results) {
                    var len = results.rows.length;
                    mainCounter3.innerHTML = len;
                    console.log('trans len not synced yet', JSON.stringify(len));
                }, null);
            });
        }, null);
    });


}
function pushNotifyToolbar(tableName,transactionName) {
    pushNotify.innerHTML = '';
    if(transactionName === 'insert'){
        pushNotify.innerHTML = `record added in ${tableName}s`
    }else if(transactionName === 'update') {
        pushNotify.innerHTML = `record updated in ${tableName}`
    }else if(transactionName === 'delete') {
        pushNotify.innerHTML = `record deleted in ${tableName}`
    }
}
$(document).ready(function () {
    loadDbToGrid();
    var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS trans (
            "id",
            "changedProperties",
            "isSync",
            "syncTo",
            "recordId",
            "tableName",
            "transactionType",
            "dataBefore",
            "dataAfter",
            "changeSource",
            "creationTime",
            "entityId"
            )`);
    });
});

var Database_Name = 'vp5';
var Version = 1.0;
var Text_Description = 'Vp5 Web-SQL';
var Database_Size = 2 * 1024 * 1024;
var Database_Name_Trans = 'vp5_trans';
