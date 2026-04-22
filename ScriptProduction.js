let productionResponseRow = [];
let selectedProductionItem = "";
let ProductionListArr = [];
let formattedTodayDate = "";

async function initializedProductionItemList() {
  const request = {
    apiType: API_TYPE_CONSTANT.getProductList,
  };
  const response = await API_HANDLER(request);
  productionResponseRow = response?.data;
  setupLiveSearch(
    "adminProductionInput",
    "adminProductionInputClrBtn",
    "adminProductionInputULList",
    function (selectedText) {
      selectedProductionItem = selectedText;
    }
  );

  initializedLiveSearchControl(
    "adminProductionInput",
    "adminProductionInputClrBtn",
    "adminProductionInputULList",
    response?.data.map((item) => `${item.product}`)
  );

  const dateInput = document.getElementById("batchDate");
  const today = new Date();
  formattedTodayDate = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  dateInput.value = formattedTodayDate;
}

function validateProductionItemInputLiveSearch() {
  const adminSkNameCtrl = document.getElementById("adminProductionInput");
  const input = adminSkNameCtrl.value;
  if (!selectedProductionItem || selectedProductionItem !== input) {
    SHOW_ERROR_POPUP("Please select Item from the list.");
    return false; // Validation failed
  }
  return true; // Validation successful
}

function productionInput() {
  if (!validateProductionItemInputLiveSearch()) return;
  const selectedItem = selectedProductionItem;
  const batchDate = document.getElementById("batchDate").value;
  const formattedBatchDate = moment(batchDate).format("DD-MMM-YYYY");
  const productionCount = document.getElementById("productionCountInput").value;
  const comments = document.getElementById("commentsInput").value;

  // Validate inputs (if needed)
  if (!productionCount) {
    SHOW_ERROR_POPUP("Please fill in all the required fields.");
    return;
  }

  let existingItemIndex = ProductionListArr.findIndex(
    (item) => item.selectedItem === selectedItem
  );
  if (existingItemIndex !== -1) {
    // Update the existing entry
    ProductionListArr[existingItemIndex].batchDate = formattedBatchDate; // Latest date
    ProductionListArr[existingItemIndex].productionCount =
      parseInt(ProductionListArr[existingItemIndex].productionCount) +
      parseInt(productionCount); // Sum counts
    ProductionListArr[existingItemIndex].comments = comments; // Latest comments

    // Update the corresponding table row
    const row = document.getElementById(`row-${existingItemIndex}`);
    row.innerHTML = `
  <td><button class="red" onclick="deleteRow(this)">Delete</button></td>
  <td>${selectedItem}</td>
  <td>${formattedBatchDate}</td>
  <td>${ProductionListArr[existingItemIndex].productionCount}</td>
  <td>${comments || "N/A"}</td>`;
  } else {
    // If the item does not exist, add a new entry
    ProductionListArr.push({
      selectedItem: selectedItem,
      batchDate: formattedBatchDate,
      productionCount: productionCount,
      comments: comments,
      transactionType: "Production",
      location: "Natures",
      category: productionResponseRow.find(
        (item) => item.product.trim() === selectedItem.trim()
      )?.category,
    });

    // Get the table body element
    const tableBody = document.getElementById("piTableTBody");

    // Create a new row for the table
    const rowIndex = ProductionListArr.length - 1; // Get the current index for the new row
    const row = document.createElement("tr");
    row.id = `row-${rowIndex}`; // Set a unique ID for the row based on its index

    // Create and append cells for item details
    row.innerHTML = `
      <td>
        <button class="red" onclick="deleteRow(this)">Delete</button>
      </td>
      <td>${selectedItem}</td>
      <td>${formattedBatchDate}</td>
      <td>${productionCount}</td>
      <td>${comments || "N/A"}</td>
      
    `;

    // Append the new row to the table body
    tableBody.appendChild(row);
  }

  // Clear input fields after adding
  document.getElementById("adminProductionInput").value = "";
  document.getElementById("batchDate").value = formattedTodayDate;
  document.getElementById("productionCountInput").value = "";
  document.getElementById("commentsInput").value = "";
}

function deleteRow(button) {
  const row = button.parentElement.parentElement; // Get the row to delete
  const rowIndex = Array.from(row.parentNode.children).indexOf(row); // Get the index of the row
  row.remove(); // Remove the row
  ProductionListArr.splice(rowIndex, 1); // Remove the item from the array
  console.log(ProductionListArr);
}

async function submitProduction() {
  if (ProductionListArr?.length > 0) {
    const request = {
      productionData: JSON.stringify(ProductionListArr),
      apiType: API_TYPE_CONSTANT.saveProductionData,
    };

    const response = await API_HANDLER(request);
    if (response?.status) {
      const tableBody = document.getElementById("piTableTBody");
      tableBody.innerHTML = "";
      SHOW_SUCCESS_POPUP("Production Data added successfully!");
    }
    const updateActivityMasterRequest = {
      apiType: API_TYPE_CONSTANT.UPDATE_STOCK,
    };
    await API_HANDLER(updateActivityMasterRequest);
    await reInitializedItemList();
    resetProductionData();
  } else {
    SHOW_ERROR_POPUP("Click the + button to add new data.");
  }
}

function resetProductionData() {
  selectedProductionItem = "";
  ProductionListArr = [];
  formattedTodayDate = "";
}
