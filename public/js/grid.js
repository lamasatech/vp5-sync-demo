let mainData = [];
let isDateField =[];

function getIndexById(rowid) {
    var idx,
        l = mainData.length;

    for (var j = 0; j < l; j++) {
        if (mainData[j].rowid == rowid) {
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
         let col=[];
          columnNames.map(function(name){
            col.push({ field: name, format: (isDateField[name] ? "{0:D}" : "") });
          })
          
        col.push({ command: ["edit","destroy"] });
          return col;
    }
   
}
  
function generateModel(columnNames) {

    var sampleDataItem = columnNames;

    var model = {};
    var fields = {};
    for (var property in sampleDataItem) {
       if(property.indexOf("id") !== -1){
         model["id"] = property;
       }
      var propType = typeof sampleDataItem[property];

      if (propType === "number" ) {
        fields[property] = {
          type: "number",
          validation: {
            required: false
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
              required: false
            }
          };
          isDateField[property] = true;
        } else {
          fields[property] = {
            validation: {
              required: false
            }
          };
        }
      } else {
        fields[property] = {
          validation: {
            required: false
          }
        };
      }
    }

    if(document.getElementById('tableNameDDL').value !== 'compliance_users'
    && document.getElementById('tableNameDDL').value !== 'kiosk_setting'
    && document.getElementById('tableNameDDL').value !== 'journey_flow_compliances'
    && document.getElementById('tableNameDDL').value !== 'journey_flow_setting'
    && document.getElementById('tableNameDDL').value !== 'journey_flow_user_type'
    && document.getElementById('tableNameDDL').value !== 'journey_setting'
    && document.getElementById('tableNameDDL').value !== 'user_type_setting'
    && document.getElementById('tableNameDDL').value !== 'entity_user'
    ) {
        model.id = "id";
     }
    
    model.fields = fields;
    return model;
}

function getRecordId(transTableName,recordObj) {
    let transRecordId={};
  try {
    if (transTableName === 'kiosk_setting') {
        transRecordId.kiosk_id = recordObj.kiosk_id;
        transRecordId.setting_id = recordObj.setting_id;
        // transRecordId = `${recordObj.kiosk_id},${recordObj.setting_id}`;
    } else if (transTableName === 'compliance_users') {
        transRecordId.compliance_id = recordObj.compliance_id;
        transRecordId.user_id = recordObj.user_id;
        transRecordId.scan_id = recordObj.scan_id;
        // transRecordId = `${recordObj.compliance_id},${recordObj.user_id},${recordObj.scan_id}`;
    } else if (transTableName === 'journey_flow_compliances') {
        transRecordId.journey_flow_id = recordObj.journey_flow_id;
        transRecordId.compliance_id = recordObj.compliance_id;
        // transRecordId = `${recordObj.journey_flow_id},${recordObj.compliance_id}`;
    } else if (transTableName === 'journey_flow_setting') {
        transRecordId.setting_id = recordObj.setting_id;
        transRecordId.journey_flow_id = recordObj.journey_flow_id;
        // transRecordId = `${recordObj.setting_id},${recordObj.journey_flow_id}`;
    } else if (transTableName === 'journey_flow_user_type') {
        transRecordId.user_type_id = recordObj.user_type_id;
        transRecordId.journey_flow_id = recordObj.journey_flow_id;
        // transRecordId = `${recordObj.user_type_id},${recordObj.journey_flow_id}`;
    } else if (transTableName === 'journey_setting') {
       transRecordId.journey_id = recordObj.journey_id;
       transRecordId.setting_id = recordObj.setting_id;
       // transRecordId = `${recordObj.journey_id},${recordObj.setting_id}`;
    } else if (transTableName === 'user_type_setting') {
        transRecordId.user_type_id = recordObj.user_type_id;
        transRecordId.setting_id = recordObj.setting_id;
        // transRecordId = `${recordObj.user_type_id},${recordObj.setting_id}`;
    } else if (transTableName === 'entity_user') {
        transRecordId.user_id = recordObj.user_id;
        transRecordId.entity_id = recordObj.entity_id;
       // transRecordId = `${recordObj.user_id},${recordObj.entity_id}`;
    } else  {
        // transRecordId = `{"id":"${recordObj.id}"}`;
        transRecordId.id =  recordObj.id
    }
    return transRecordId;
  } catch (ex) {
    console.log(ex);
  }
}

function drawGrid(mainData) {
    let schemaField={};
    let schemaColumn = [];
    
    if(mainData.length>0) {
        schemaField = generateModel(mainData[0]);
        schemaColumn = generateColumns(Object.keys(mainData[0]));
        console.log(`schemaField${JSON.stringify(schemaField)}`)
        console.log(`schemaColumn${JSON.stringify(schemaColumn)}`)
    }
    let recordId={};
    var mainDataNextID = mainData.length + 1;
    var dataSource = new kendo.data.DataSource({
        transport: {
            read: function (e) {
                // On success.
                e.success(mainData);
                // On failure.
                // e.error("XHR response", "status code", "error message");
            },
            create: function (e) {
                // Assign an ID to the new item.
                // Save data item to the original datasource.
                e.data.id = newGuid();
                mainData.push(e.data);
                // On success.
                e.success(e.data);
               
                var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
                const recordId = getRecordId(document.getElementById('tableNameDDL').value,e.data);
                const dataAfter = Object.assign({}, e.data)  ; 
                delete dataAfter.rowid; 
                delete dataAfter.id; 
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
                        '${newGuid()}','all','no','','${JSON.stringify(recordId)}','${document.getElementById('tableNameDDL').value}','insert','${JSON.stringify(dataAfter)}', '${guid}',
                        '${(new Date()).toISOString()}', '${$('#entityIdTXT').val()}'
                    )`
                    console.log('sqlsqlsqlsqltxtxtxt', JSON.stringify(sql));
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
            var dbObj2 = openDatabase(Database_Name, Version, Text_Description, Database_Size);
                
            if(mainData[getIndexById(e.data.rowid)]) {
                console.log('edit')
                // Locate item in original datasource and update it.
                const dataBefore = Object.assign({}, mainData[getIndexById(e.data.rowid)]) ; 
                delete dataBefore.rowid;
                const dataAfter = Object.assign({}, e.data)  ; 
                delete dataAfter.rowid; 

                recordId = getRecordId(document.getElementById('tableNameDDL').value,dataBefore);
                mainData[getIndexById(e.data.rowid)] = e.data;
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
                        '${JSON.stringify(recordId)}',
                        '${document.getElementById('tableNameDDL').value}',
                        'update',
                        '${JSON.stringify(dataBefore)}',                
                        '${JSON.stringify(dataAfter)}', 
                        '${guid}',
                        '${(new Date()).toISOString()}',
                        '${$('#entityIdTXT').val()}'
                    )`
                    console.log('sqlsqlsqlsql', JSON.stringify(sql));
                    tx.executeSql(sql);
                   
                    dbObj2.transaction(function (tx2) {
                        const columnUpdates = [];
                        for (const [key, value] of Object.entries(e.data)) {
                            columnUpdates.push(`${key}='${value}'`)
                        }
                        columnUpdates.shift();

                        tx2.executeSql(`UPDATE ${document.getElementById('tableNameDDL').value}
                            SET ${columnUpdates.join(',')}
                            WHERE rowid = '${e.data.rowid}'`);

                        alert('update at RDB and Added to  TransDB')
                    });
                });
                // On failure.
                // e.error("XHR response", "status code", "error message");
            } 
            else {
                var maxRowId ;
                var dbObjMax = openDatabase(Database_Name, Version, Text_Description, Database_Size);
                dbObjMax.transaction( function (txMax) {
                    txMax.executeSql(`SELECT max(rowid) from ${document.getElementById('tableNameDDL').value}`, [], function (txMax, results) {
                       maxRowId=  Object.values(results.rows.item(0));  
                       }, null);
                   });

               setTimeout(function(){
                e.data.rowid = parseInt(maxRowId)+1;
                mainData.push(e.data);
                // On success.
                e.success(e.data);
                recordId = getRecordId(document.getElementById('tableNameDDL').value,e.data);
                const dataAfter = Object.assign({}, e.data)  ; 
                delete dataAfter.rowid; 
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
                        '${newGuid()}','all','no','','${JSON.stringify(recordId)}','${document.getElementById('tableNameDDL').value}','insert','${JSON.stringify(dataAfter)}', '${guid}',
                        '${(new Date()).toISOString()}', '${$('#entityIdTXT').val()}'
                    )`
                   
                    tx.executeSql(sql);
                   
                    dbObj2.transaction(function (tx2) {
                        tx2.executeSql(`insert into ${document.getElementById('tableNameDDL').value}
                            (${Object.keys(e.data).map((s) => s).join(',')})
                            values
                            ('${Object.values(e.data).map((s) => s).join("','")}')`);

                        alert('Added to both RDB and TransDB')
                       // loadDbToGrid()
                    });
                });
               },4000)
               
            }
            },
            destroy: function (e) {
                const dataBefore = JSON.stringify(mainData[getIndexById(e.data.rowid)]); 
                // Locate item in original datasource and remove it.
                const deletedItem = mainData[getIndexById(e.data.rowid)];
                mainData.splice(getIndexById(e.data.rowid), 1);
                // On success.
                e.success();
                var dbObj = openDatabase(Database_Name_Trans, Version, Text_Description, Database_Size);
                dbObj.transaction(function (tx) {
                    
                    recordId = getRecordId(document.getElementById('tableNameDDL').value,deletedItem)
                     console.log('ddd'+recordId)
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
                         '${JSON.stringify(recordId)}',
                         '${document.getElementById('tableNameDDL').value}',
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
                         tx2.executeSql(`DELETE FROM  ${document.getElementById('tableNameDDL').value} WHERE rowid = '${deletedItem.rowid}'`);
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
            console.log("Status: " + e.status + "; Error message: " + e.errorThrown+JSON.stringify(e));
        },
        pageSize: 100,
        batch: false,
        schema: {
            model: schemaField,
        }
    });
    $("#grid").empty();
    $("#grid").kendoGrid({
        dataSource: dataSource,
        pageable: true,
        toolbar: ["create"],
        columns: schemaColumn,
        editable: "popup"
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
            console.log(`results${results}`)
            var len = results.rows.length, i;
            mainCounter.innerHTML = len;
            console.log('trans len', JSON.stringify(len));
            for (i = 0; i < len; i++) {

                let beforeDataRecord, mainDataRecord ;
                console.log(`results.rows.item(i).dataAfter${results.rows.item(i).dataAfter}`)
                if(results.rows.item(i).dataAfter !== 'undefined' && results.rows.item(i).dataAfter !== null) {
                    const dataAfterObj = JSON.parse(results.rows.item(i).dataAfter)

                    for (const key of Object.keys(dataAfterObj)) {
                       if(dataAfterObj[key]=='') dataAfterObj[key] =null;
                    }

                    for (const key of Object.keys(dataAfterObj)) {
                        if(dataAfterObj[key]=='null') dataAfterObj[key] =null;
                     }

                    if(dataAfterObj.created_at)
                    {
                        var m = new Date(dataAfterObj.created_at);
                        dataAfterObj.created_at = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
                    }

                    if(dataAfterObj.updated_at)
                    {
                        var m = new Date(dataAfterObj.updated_at);
                        dataAfterObj.updated_at = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
                    }

                    if(dataAfterObj.deleted_at)
                    {
                        
                        var m = new Date(dataAfterObj.deleted_at);
                        dataAfterObj.deleted_at = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
                    }

                    mainDataRecord = dataAfterObj; //JSON.parse(results.rows.item(i).dataAfter);

                }
                console.log(`JSON.parse(results.rows.item(i).dataBefore)${JSON.parse(results.rows.item(i).dataBefore)}`)
                if(results.rows.item(i).dataBefore !== 'undefined') {

                    beforeDataRecord = JSON.parse(results.rows.item(i).dataBefore);
                }
                payLoad.push({
                    "_id": results.rows.item(i).id,
                    "recordId": JSON.parse(results.rows.item(i).recordId),
                    "tableName": results.rows.item(i).tableName,
                    "transactionType": results.rows.item(i).transactionType,
                    "dataBefore": beforeDataRecord?beforeDataRecord:{},
                    "dataAfter": mainDataRecord,
                    "changedProperties": mainDataRecord? Object.keys(mainDataRecord) :  Object.keys(beforeDataRecord),
                    "changeSource": results.rows.item(i).changeSource,
                    "creationTime": results.rows.item(i).creationTime,
                    "syncTo": [
                        results.rows.item(i).changeSource
                    ],
                    "entityId": $('#entityIdTXT').val()
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
        
        tx.executeSql(`SELECT rowid,* from ${document.getElementById('tableNameDDL').value}`, [], function (tx, results) {
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
