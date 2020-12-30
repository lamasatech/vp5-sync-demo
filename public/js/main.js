const socket = io('http://localhost:5000');

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

// Custom logic start.
var sampleDataNextID = sampleData.length + 1;

function getIndexById(id) {
    var idx,
        l = sampleData.length;

    for (var j = 0; j < l; j++) {
        if (sampleData[j].ProductID == id) {
            return j;
        }
    }
    return null;
}

function drawGrid() {
    var dataSource = new kendo.data.DataSource({
        transport: {
            read: function (e) {
                // On success.
                e.success(sampleData);
                // On failure.
                //e.error("XHR response", "status code", "error message");
            },
            create: function (e) {
                // Assign an ID to the new item.
                e.data.ProductID = sampleDataNextID++;
                // Save data item to the original datasource.
                sampleData.push(e.data);
                // On success.
                e.success(e.data);
                // On failure.
                //e.error("XHR response", "status code", "error message");
            },
            update: function (e) {
                // Locate item in original datasource and update it.
                sampleData[getIndexById(e.data.ProductID)] = e.data;
                // On success.
                e.success();
                // On failure.
                // e.error("XHR response", "status code", "error message");
            },
            destroy: function (e) {
                // Locate item in original datasource and remove it.
                sampleData.splice(getIndexById(e.data.ProductID), 1);
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
        pageSize: 10,
        batch: false,
        schema: {
            model: {
                id: "ProductID",
                fields: {
                    ProductID: { editable: false, nullable: true },
                    ProductName: { validation: { required: true } },
                    Introduced: { type: "date" },
                    UnitPrice: { type: "number", validation: { required: true, min: 1 } },
                    Discontinued: { type: "boolean" },
                    UnitsInStock: { type: "number", validation: { min: 0, required: true } }
                }
            }
        }
    });

    $("#grid").kendoGrid({
        dataSource: dataSource,
        pageable: true,
        toolbar: ["create"],
        columns: [
            { field: "ProductName", title: "Mobile Phone" },
            { field: "Introduced", title: "Introduced", format: "{0:yyyy/MM/dd}", width: "200px" },
            { field: "UnitPrice", title: "Price", format: "{0:c}", width: "120px" },
            { field: "UnitsInStock", title: "Units In Stock", width: "120px" },
            { field: "Discontinued", width: "120px" },
            { command: ["edit", "destroy"], title: "&nbsp;", width: "200px" }
        ],
        editable: "inline"
    });
}

$(document).ready(function () {
    drawGrid()
});