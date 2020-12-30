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

function drawGrid(mainData) {
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
                        tx2.executeSql(`insert into visits
                            (id, user_id, host_id, entity_id, scan_data_type_id, notes, date, signed_in, signed_out, deleted_at , created_at, updated_at)
                            values
                            (
                                '${e.data.id}',
                                '${e.data.user_id}',
                                '${e.data.host_id}',
                                '${e.data.entity_id}',
                                '${e.data.scan_data_type_id}',

                                '${e.data.notes}',
                                '${e.data.date}',

                                '${e.data.signed_in}',
                                '${e.data.signed_out}',

                                '${e.data.deleted_at}',
                                '${e.data.created_at}',
                                '${e.data.updated_at}'
                            )`);

                        alert('Added to both RDB and TransDB')
                        loadDbToGrid()
                    });
                });
                // On failure.
                //e.error("XHR response", "status code", "error message");
            },
            update: function (e) {
                // Locate item in original datasource and update it.
                mainData[getIndexById(e.data.id)] = e.data;
                // On success.
                e.success();
                // On failure.
                // e.error("XHR response", "status code", "error message");
            },
            destroy: function (e) {
                // Locate item in original datasource and remove it.
                mainData.splice(getIndexById(e.data.id), 1);
                // On success.
                e.success();
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
                fields: {
                    id: { editable: false, nullable: true },
                    user_id: { validation: { required: false } },
                    host_id: { validation: { required: false } },
                    entity_id: { validation: { required: false } },
                    scan_data_type_id: { validation: { required: false } },
                    date: { type: "date" },
                    notes: { validation: { required: false } },
                    signed_in: { type: "date" },
                    signed_out: { type: "date" },
                    created_at: { type: "date" },
                    updated_at: { type: "date" },
                    deleted_at: { type: "date" },
                }
            }
        }
    });

    $("#grid").kendoGrid({
        dataSource: dataSource,
        pageable: true,
        toolbar: ["create"],
        columns: [
            { field: "id" },
            { field: "user_id" },
            { field: "host_id" },
            { field: "entity_id" },
            { field: "scan_data_type_id" },
            { field: "date", title: "date", format: "{0:yyyy/MM/dd}" },
            { field: "notes", title: "notes" },
            { field: "signed_in", title: "signed_in", format: "{0:yyyy/MM/dd hh:mm:ss}" },
            { field: "signed_out", title: "signed_out", format: "{0:yyyy/MM/dd hh:mm:ss}" },
            { field: "created_at", title: "created_at", format: "{0:yyyy/MM/dd hh:mm:ss}" },
            { field: "updated_at", title: "updated_at", format: "{0:yyyy/MM/dd hh:mm:ss}" },
            { field: "deleted_at", title: "deleted_at", format: "{0:yyyy/MM/dd hh:mm:ss}" },
            { command: ["edit", "destroy"], title: "&nbsp;" },
        ],
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

function dropDb() {
    var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        tx.executeSql(`drop TABLE IF EXISTS visits`);
        alert('Db is dropped')
        loadDbToGrid();
    });
}

function halfSyncDb() {
    socket.emit('syncRequest', {
        table: 'visits', entityId, token, guid,
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


                const mainDataRecord = JSON.parse(results.rows.item(i).dataAfter);

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


                payLoad.push({
                    "_id": results.rows.item(i).id,
                    "recordId": results.rows.item(i).recordId,
                    "tableName": results.rows.item(i).tableName,
                    "transactionType": results.rows.item(i).transactionType,
                    "dataBefore": {},
                    "dataAfter": mainDataRecord,
                    "changedProperties": Object.keys(mainDataRecord),
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

function recreateDb() {
    dropDb()
    var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS visits (id unique, user_id, host_id,entity_id, scan_data_type_id, notes, date, signed_in, signed_out,
                deleted_at , created_at, updated_at)`);
    });
    socket.emit('syncRequest', {
        table: 'visits', entityId, token, guid,
        syncType: 'full',
    });
}

function loadDbToGrid() {
    mainCounter.innerHTML = 0;
    drawGrid([]);
    var dbObj = openDatabase(Database_Name, Version, Text_Description, Database_Size);
    dbObj.transaction(function (tx) {
        let mainData = [];
        tx.executeSql('SELECT * from visits', [], function (tx, results) {
            var len = results.rows.length, i;
            mainCounter.innerHTML = len;
            console.log('len', JSON.stringify(len));
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
