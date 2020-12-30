
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
    var sampleDataNextID = sampleData.length + 1;
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