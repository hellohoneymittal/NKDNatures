let orignalAdminStockList = [];
const adminContainerKey = "adminContainer";
let selectedCustomerName = "";
let selectedItem = "";
let selectedItems = [];
let isCustomerManuallyAdded = false;
let itemArray = [];
let stockItemDataList = [];
let selectedUserObj = {};
let inputDataForSale = [];
let unitType = "wgt";
setupKeyPressHandler("adminSale", "addItemInBillBtn", ["s"], { ctrl: true });
setupKeyPressHandler("adminProduction", "productionInputBtn", ["p"], {
  ctrl: true,
});
document.addEventListener("DOMContentLoaded", function () {
  setupLiveSearch(
    "adminCustName",
    "adminCustNameClrBtn",
    "adminCustNameULList",
    function (selectedText) {
      selectedUserObj = userDataArr.find(
        (item) => item.name === selectedText.trim(),
      );

      selectedCustomerName = selectedText;
      if (selectedUserObj?.schemeDiscount > 0) {
        const discountDiv = document.getElementById("customerDiscountInfo");
        discountDiv.innerText = `🎉 Applicable Discount: ${selectedUserObj.schemeDiscount} %`;
        discountDiv.style.display = "block";
      } else {
        const discountDiv = document.getElementById("customerDiscountInfo");
        discountDiv.innerText = "";
        discountDiv.style.display = "None";
      }
    },
  );

  setupLiveSearch(
    "adminItemInput",
    "adminItemInputClrBtn",
    "adminItemInputULList",
    function (selectedText) {
      selectedItem = selectedText;
    },
  );
});

function initializedCustomerList(data) {
  data.unshift("General Customer");
  data.push("Promotional Customer");
  data.push("Testing Customer");
  data.push("Obsolete Item");
  initializedLiveSearchControl(
    "adminCustName",
    "adminCustNameClrBtn",
    "adminCustNameULList",
    data,
  );
}

function preprocessItemData(data) {
  const aggregatedData = {};
  let productIdCounter = 1;

  data.forEach((row) => {
    let available = 0;
    let price = 0;
    const natures = formatNumber(row["Natures"] || "0");
    const itemPrice = formatNumber(row["Price"] || "0");
    const hsnNo = row["HSN"] || "";
    const gstPercentage = formatNumber(row["GST %"] || "0");

    if (
      row.Type.toString().toLowerCase() === unitType.toString().toLowerCase()
    ) {
      price = itemPrice;
      available = parseFloat((natures / 1000).toFixed(2));
    } else {
      price = itemPrice;
      available = parseFloat(natures.toFixed(2));
    }

    const adminStockKey = `${row["Item"]}_${row["Category"]}`;

    if (aggregatedData[adminStockKey]) {
      aggregatedData[adminStockKey].available += available;
      aggregatedData[adminStockKey].available = parseFloat(
        aggregatedData[adminStockKey].available.toFixed(2),
      ); // Maintain 2-digit precision
      aggregatedData[adminStockKey].batches.push({
        batch: row["Batch/Date of Manufacture"],
        qty: available,
      });
    } else {
      aggregatedData[adminStockKey] = {
        id: productIdCounter++,
        item: row["Item"], // updated to match your downstream usage
        category: row["Category"],
        available: parseFloat(available.toFixed(2)),
        price: price,
        type: row?.Type,
        batches: [
          {
            batch: row["Batch/Date of Manufacture"],
            qty: available,
          },
        ],
        hsnNo: hsnNo,
        gstPercentage: gstPercentage,
      };
    }
  });

  return Object.values(aggregatedData).filter((item) => item.available > 0);
}

async function initializedItemList() {
  orignalAdminStockList = await populateStock();
  let itemData = preprocessItemData(orignalAdminStockList);
  stockItemDataList = itemData;

  itemArray = itemData.map(
    (row) => `${row.item} - ${row.available} - ${row.price}`,
  );

  if (itemArray) {
    initializedItemListLiveSearchControl(itemArray);
  }
}

async function reInitializedItemList() {
  const request = {
    apiType: API_TYPE_CONSTANT.getStock,
    request: "Stock",
  };
  try {
    const response = await API_HANDLER_WITHOUT_LOADING_AXIOS(request);
    if (response) {
      const data = response.data;
      let itemData = preprocessItemData(data);

      itemArray = itemData.map(
        (row) => `${row.item} - ${row.available} - ${row.price}`,
      );

      if (itemArray) {
        initializedItemListLiveSearchControl(itemArray);
      }
    } else {
      SHOW_ERROR_POPUP("Something Went Wrong");
    }
  } catch (ex) {
    SHOW_ERROR_POPUP("Error :- " + ex);
  }
}

function initializedItemListLiveSearchControl(itemArray) {
  initializedLiveSearchControl(
    "adminItemInput",
    "adminItemInputClrBtn",
    "adminItemInputULList",
    itemArray,
  );
}

function validateItemInputLiveSearch() {
  const adminSkNameCtrl = document.getElementById("adminItemInput");
  const input = adminSkNameCtrl.value;
  if (!selectedItem || selectedItem !== input) {
    SHOW_ERROR_POPUP("Please select Item from the list.");
    return false; // Validation failed
  }
  return true; // Validation successful
}

function customValidateCustomerInputLiveSearch() {
  if (isCustomerManuallyAdded) {
    return true;
  } else {
    const adminSkNameCtrl = document.getElementById("adminCustName");
    const input = adminSkNameCtrl.value;
    if (!selectedCustomerName || selectedCustomerName !== input) {
      SHOW_ERROR_POPUP("Please select Customer from the list.");
      return false; // Validation failed
    }
    return true; // Validation successful
  }
}

function addItemInBill() {
  if (!customValidateCustomerInputLiveSearch()) return;
  if (!validateItemInputLiveSearch()) return;

  let adminItemInputCtrl = document.getElementById("adminItemInput");
  let adminQtyInputCtrl = document.getElementById("adminQuantityInput");
  let adminDisInputCtrl = document.getElementById("adminDisInput");

  const selectedItem = adminItemInputCtrl.value;
  const itemQty = Number(adminQtyInputCtrl.value);
  const discount = Number(adminDisInputCtrl.value);
  const adminSkNameCtrl = document.getElementById("adminCustName");
  const custName = adminSkNameCtrl?.value;

  const parts = selectedItem.toString().split(" - ");
  const itemName = parts[0].trim();
  const itemAvailability = Number(parts[1].trim());
  const itemPrice = Number(parts[2].trim());

  if (!itemName) {
    SHOW_ERROR_POPUP("Please select a valid product.");
    return;
  }

  if (!itemQty || isNaN(itemQty) || Number(itemQty) === 0) {
    SHOW_ERROR_POPUP("Please enter a valid quantity.");
    return;
  }

  const itemData = stockItemDataList.find(
    (data) => data.item.trim().toLowerCase() === itemName.trim().toLowerCase(),
  );

  if (!itemData) {
    SHOW_ERROR_POPUP("Item data not found. Please check the item name.");
  }

  let adjustedPrice = itemPrice;
  let minusStockQty = itemQty;

  if (
    itemData.type.toString().toLowerCase() === unitType.toString().toLowerCase()
  ) {
    adjustedPrice = itemPrice / 1000;
    minusStockQty = parseFloat((itemQty / 1000).toFixed(3));
  }

  if (itemAvailability < minusStockQty) {
    SHOW_ERROR_POPUP("Cannot select more than the available quantity.");
    return;
  }

  const itemTotal = adjustedPrice * itemQty;
  const discountAmount = (itemTotal * discount) / 100;
  const schemeDiscountPercentage =
    selectedUserObj?.schemeDiscount > 0 && itemData?.category === "Bakery"
      ? selectedUserObj.schemeDiscount
      : 0;
  const schemeDiscountAmount = (itemTotal * schemeDiscountPercentage) / 100;
  const finalTotal = itemTotal - discountAmount - schemeDiscountAmount;

  const uniqueKey = `${itemName}`;
  const existingItem = selectedItems.find(
    (item) => item.key.trim() === uniqueKey.trim(),
  );

  if (existingItem) {
    existingItem.quantity += itemQty;
    existingItem.discount = discount;
    existingItem.discountAmount =
      (existingItem.discountAmount || 0) + discountAmount;
    existingItem.schemeDiscount =
      schemeDiscountPercentage || existingItem.schemeDiscount || 0;
    existingItem.schemeDiscountAmount =
      (existingItem.schemeDiscountAmount || 0) + schemeDiscountAmount;

    // Recalculate final total
    existingItem.total =
      existingItem.total +
      finalTotal -
      existingItem.discountAmount -
      existingItem.schemeDiscountAmount;

    const row = document.getElementById(`row-${uniqueKey}`);
    row.innerHTML = `
      <td>
        <img src="https://i.postimg.cc/cJZRzYzT/delete-Icon.png" alt="Delete" onclick="deleteSaleRow('${uniqueKey}')" 
        style="cursor: pointer; width: 20px; height: 20px;">
      </td>
      <td>${itemName}</td>
      <td>${existingItem.quantity}</td>
      <td>₹${itemPrice.toFixed(2)}</td>
      <td>${discount}%</td>
      <td>${existingItem.schemeDiscount || 0}%</td>
      <td>₹${existingItem.total.toFixed(2)}</td>
    `;
  } else {
    const newItem = {
      key: uniqueKey,
      name: itemName,
      price: itemPrice,
      quantity: itemQty,
      discount: discount,
      discountAmount: discountAmount,
      schemeDiscount: schemeDiscountPercentage,
      schemeDiscountAmount: schemeDiscountAmount,
      total: finalTotal,
      category: itemData.category,
      type: itemData.type,
    };
    selectedItems.push(newItem);

    const tableBody = document.getElementById("adSaleTableTBody");
    const row = document.createElement("tr");
    row.id = `row-${uniqueKey}`;
    row.innerHTML = `
      <td>
        <img src="https://i.postimg.cc/cJZRzYzT/delete-Icon.png" alt="Delete" onclick="deleteSaleRow('${uniqueKey}')" 
        style="cursor: pointer; width: 20px; height: 20px;">
      </td>
      <td>${itemName}</td>
      <td>${itemQty}</td>
      <td>₹${itemPrice.toFixed(2)}</td>
      <td>${discount}%</td>
      <td>${schemeDiscountPercentage}%</td>
      <td>₹${finalTotal.toFixed(2)}</td>
    `;
    tableBody.appendChild(row);
  }

  const itemIndex = itemArray.findIndex(
    (item) => item.split("-")[0].trim() == itemName.trim(),
  );

  if (itemIndex > -1) {
    const remainingQty = (itemAvailability - minusStockQty).toFixed(2);
    if (remainingQty > 0) {
      itemArray[itemIndex] = `${itemName} - ${remainingQty} - ${itemPrice}`;
    } else {
      itemArray.splice(itemIndex, 1);
    }
    initializedItemListLiveSearchControl(itemArray);
  }

  adminItemInputCtrl.value = "";
  document.getElementById("adminItemInputClrBtn").style.display = "none";
  adminQtyInputCtrl.value = "";
  adminDisInputCtrl.value = "";

  updateFinalTotal();
}

function addNewUserButtonClick() {
  const adminSkNameCtrl = document.getElementById("adminCustName");
  const input = adminSkNameCtrl.value;
  if (selectedCustomerName === input && input !== "") {
    SHOW_SUCCESS_POPUP("User already there, thank you!");
  } else if (
    (!selectedCustomerName || selectedCustomerName !== input) &&
    input !== ""
  ) {
    SHOW_CONFIRMATION_POPUP("Do you want to add a new user?", addNewUser);
  } else {
    SHOW_ERROR_POPUP("Something went wrong!");
  }
}

function addNewUser() {
  const adminCustNameCtrl = document.getElementById("adminCustName");
  if (adminCustNameCtrl?.value) {
    SHOW_SPECIFIC_DIV("newUserContainer");
    const newUserTxtBoxCtrl = document.getElementById("newUserTxtBox");
    newUserTxtBoxCtrl.value = adminCustNameCtrl?.value;
  } else {
    SHOW_ERROR_POPUP("Please Enter Some Value");
  }
}

function deleteSaleRow(itemName) {
  // Find the index of the item in selectedItems array

  const itemIndex = selectedItems.findIndex(
    (item) => item.key?.trim() === itemName?.trim(),
  );

  if (itemIndex !== -1) {
    const deletedItem = selectedItems[itemIndex];

    const itemArrayIndex = itemArray.findIndex(
      (item) => item.split(" - ")[0].trim() === itemName.trim(),
    );

    const oldQty = deletedItem.quantity;
    let oldStockQty = oldQty;

    const itemPrice = deletedItem.price;
    if (
      deletedItem?.type.toString().toLowerCase() ===
      unitType.toString().toLowerCase()
    ) {
      oldStockQty = parseFloat((oldQty / 1000).toFixed(3));
    }

    if (itemArrayIndex > -1) {
      // Item already exists in the dropdown array, so add back the stock
      const parts = itemArray[itemArrayIndex].split(" - ");
      const existingQty = Number(parts[1].trim());
      const newQty = parseFloat((existingQty + oldStockQty).toFixed(2));

      itemArray[itemArrayIndex] = `${itemName} - ${newQty} - ${itemPrice}`;
    } else {
      // Item doesn't exist in array anymore, so re-add it
      itemArray.push(`${itemName} - ${oldStockQty} - ${itemPrice}`);
    }

    initializedItemListLiveSearchControl(itemArray);

    selectedItems.splice(itemIndex, 1);
  }

  // Remove the corresponding row from the table
  const row = document.getElementById(`row-${itemName}`);
  if (row) {
    row.remove();
  }

  updateFinalTotal();
}

function updateFinalTotal() {
  let totalCostDisplay = document.getElementById("totalCost");
  const finalTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  totalCostDisplay.textContent = `₹${finalTotal.toFixed(2)}`;
}

function submitOrder() {
  const customerSelect = document.getElementById("adminCustName");
  let customerName = customerSelect.value;
  if (selectedItems.length === 0) {
    SHOW_ERROR_POPUP("No items selected");
    return;
  }

  debugger;
  const selectedPaymentStatus = getSelectedPaymentStatus();
  if (!selectedPaymentStatus) {
    SHOW_ERROR_POPUP("Payment status not selected");
    return;
  }

  let orderSummary = `Customer: ${customerName}\nOrder Summary:\n`;
  let totalCost = 0;

  selectedItems.forEach((item) => {
    let itemTotal = item.price * item.quantity;
    totalCost += itemTotal;
    orderSummary += `Item: ${item.name}, Quantity: ${item.quantity}, Total: ₹${itemTotal}\n\n`;
  });

  const columnNames = [
    { displayName: "Item", actualName: "name" },
    { displayName: "Quantity", actualName: "quantity" },
    { displayName: "Price", actualName: "price" },
    { displayName: "Disc. %", actualName: "discount" },
    { displayName: "S Disc. %", actualName: "schemeDiscount" },
    { displayName: "Total", actualName: "total" },
  ];

  orderSummary += `\nTotal Cost: ₹${totalCost}`;
  let totalCostDisplay = document.getElementById("totalCost");
  const totalCostDisplayValue = totalCostDisplay.textContent;

  SHOW_CONFIRMATION_GRID_POPUP(
    selectedItems,
    columnNames,
    onSaleConfirmClick,
    "Proceed",
    "Back",
    `Summary - ${totalCostDisplayValue}`,
  );
}

function generateBillNumber(type = "Nature") {
  const now = new Date();

  // Format date (DDMMYY)
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  // Format time (HHmm)
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  // Add random 3-digit number
  const random = Math.floor(100 + Math.random() * 900);

  if (type === "Nature") {
    return `Nature/${dd}${mm}${yy}${hh}${min}${random}`;
  } else {
    return `${dd}${mm}${yy}${hh}${min}${random}`;
  }
}

function prepareInputDataForSale() {
  const paymentStatus = getSelectedPaymentStatus();
  const saleType = getSelectedSaleType();
  const comment = document.getElementById("commentsSaleInput").value;
  let totalCostDisplay = document.getElementById("totalCost");
  const totalCostDisplayValue = totalCostDisplay.textContent;
  let totalCostNumValue = parseFloat(
    totalCostDisplayValue.replace(/[₹,]/g, ""),
  );
  const adminSkNameCtrl = document.getElementById("adminCustName");
  const customerName = adminSkNameCtrl?.value || "Unknown";

  const generatedBillNo = generateBillNumber();

  let inputData = [];

  selectedItems.forEach((item) => {
    let remainingQty = item.quantity;

    // Get all matching stock entries for the item
    const matchingStocks = orignalAdminStockList.filter(
      (stock) => stock.Item.trim() === item.name.trim(),
    );

    matchingStocks.forEach((stock) => {
      const availableQty = parseFloat(stock.Natures);

      if (remainingQty !== 0 && availableQty > 0) {
        const usedQty = Math.min(availableQty, remainingQty);

        let usedQtyModified = usedQty;
        let priceModified = item.price;
        if (
          item.type.toString().toLowerCase() ===
          unitType.toString().toLowerCase()
        ) {
          usedQtyModified = parseFloat((usedQty / 1000).toFixed(3));
        }
        const baseTotal = usedQtyModified * priceModified;
        const discAmt = Number(item.discountAmount) || 0;
        const schemeAmt = Number(item.schemeDiscountAmount) || 0;
        inputData.push({
          ...item,
          quantity: usedQty,
          discount: item.discount ?? 0,
          discountAmount: discAmt,
          schemeDiscount: item.schemeDiscount ?? 0,
          schemeDiscountAmount: schemeAmt,
          paymentStatus: paymentStatus,
          saleType: saleType,
          comment: comment,
          customerName: customerName,
          location: "Natures",
          type: "Sale",
          baseTotal: baseTotal,
          total: parseFloat((baseTotal - discAmt - schemeAmt).toFixed(2)),
          totalBillCost: totalCostNumValue,
          billNo: item?.billNo ? item.billNo : generatedBillNo,
          category: item.category,
          devType: selectedUserObj?.devType,
          batch: stock["Batch/Date of Manufacture"] ?? "",
          expiryDays: stock.ExpiryDays ?? "",
          productType: stock.ProductType ?? "",
          stockDateTime: stock.DateTime ?? "",
        });

        remainingQty -= usedQty;
      }
    });
  });

  inputDataForSale = inputData; // assign to main inputDataForSale
  return inputData;
}

function resetBill() {
  resetSaleFields();
}

function combineItemsByNameForWhatsapp() {
  const grouped = {};
  inputDataForSale.forEach((item) => {
    const name = item.name;

    if (!grouped[name]) {
      // Shallow copy the object to avoid mutation
      grouped[name] = { ...item };
    } else {
      // Combine fields
      grouped[name].quantity += item.quantity;
      grouped[name].baseTotal += item.baseTotal;
      grouped[name].total += item.total;

      // Optionally: keep the latest stockDateTime
      const prevDate = new Date(grouped[name].stockDateTime);
      const currentDate = new Date(item.stockDateTime);
      if (currentDate > prevDate) {
        grouped[name].stockDateTime = item.stockDateTime;
      }
    }
  });

  // Convert grouped object back to array
  const updatedDataForSale = Object.values(grouped);
  return updatedDataForSale;
}

async function onSaleConfirmClick() {
  const dataForSale = prepareInputDataForSale();
  console.log("Data for Sale:", dataForSale);
  if (dataForSale?.length > 0) {
    const request = {
      inputData: JSON.stringify(dataForSale),
      apiType: API_TYPE_CONSTANT.createSale,
    };

    const response = await API_HANDLER_AXIOS(request);
    if (response?.status) {
      SHOW_SPECIFIC_DIV("billContainer");
      const downloadButton = document.getElementById("downloadPdfButton");
      downloadButton.onclick = () => downloadBillAsPDF(); // Attach PDF download function
    }
    const updateStockRequest = {
      apiType: API_TYPE_CONSTANT.UPDATE_STOCK,
      data: "",
    };
    await API_HANDLER_WITHOUT_LOADING_AXIOS(updateStockRequest);
  } else {
    SHOW_ERROR_POPUP("Click the + button to add new data.");
  }
}

function getSelectedPaymentStatus() {
  const paidRadio = document.getElementById("paidStatus");
  const pendingRadio = document.getElementById("pendingStatus");

  if (paidRadio.checked) {
    return "paid";
  } else if (pendingRadio.checked) {
    return "pending";
  }
  return null;
}

function resetSaleFields() {
  const tableBody = document.getElementById("adSaleTableTBody");
  const adminSkNameCtrl = document.getElementById("adminCustName");
  document.getElementById("adminCustNameClrBtn").style.display = "none";
  let totalCostDisplay = document.getElementById("totalCost");
  adminSkNameCtrl.value = "";
  selectedCustomerName = "";
  selectedItem = "";
  selectedItems = [];
  isCustomerManuallyAdded = false;

  tableBody.innerHTML = "";
  totalCostDisplay.textContent = `₹0.00`;
  document.querySelectorAll('input[name="paymentStatus"]').forEach((radio) => {
    radio.checked = false;
  });

  SHOW_SPECIFIC_DIV("adminHomeContainer");
}

function downloadBillAsPDF() {
  // Generate a custom timestamp
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" }); // Jan, Feb, etc.
  const year = now.getFullYear().toString().slice(2); // Last two digits of the year
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  const adminSkNameCtrl = document.getElementById("adminCustName");
  let totalCostDisplay = document.getElementById("totalCost");

  const { jsPDF } = window.jspdf; // Access jsPDF from the library
  const pdf = new jsPDF();

  // Access the dynamically created grid table
  const gridContainer = document.getElementById("confirmationGridContainer");
  const table = gridContainer.querySelector("table"); // Fetch the table inside the container

  if (!table) {
    console.error("No table found inside the confirmation grid container.");
    return;
  }

  // Extract headers and rows from the table
  const headers = [...table.querySelectorAll("thead th")].map(
    (th) => th.innerText.trim(), // Ensure no extra spaces
  );
  const rows = [...table.querySelectorAll("tbody tr")].map((tr) =>
    [...tr.querySelectorAll("td")].map((td) => td.innerText.trim()),
  );

  // Add heading and details to the PDF
  pdf.setFont("helvetica", "normal"); // Use a consistent font
  pdf.setFontSize(14);

  const customerName = adminSkNameCtrl?.value || "Unknown";
  const totalAmount = totalCostDisplay?.textContent.trim() || "0.00";

  // Write details on the PDF
  pdf.text(`Date: ${day}-${month}-${year}`, 14, 15);
  pdf.text(`Name: ${customerName}`, 14, 25); // Customer name at x=14, y=15
  pdf.text(`Total: ${totalAmount}`, 14, 35, {
    charSpace: 0.2, // Adjust character spacing to avoid extra space issues
  });

  // Add a logo to the right side
  const logo = logo64Url;
  const logoWidth = 40; // Adjust the width of the logo
  const logoHeight = 20; // Adjust the height of the logo
  const pageWidth = pdf.internal.pageSize.width;
  pdf.addImage(
    logo,
    "PNG",
    pageWidth - logoWidth - 10,
    10,
    logoWidth,
    logoHeight,
  );

  // Add the table to the PDF
  pdf.autoTable({
    startY: 45, // Start the table below the text
    head: [headers],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 10, // Adjust font size for better readability
      cellPadding: 4, // Add padding for a cleaner layout
    },
    headStyles: {
      fillColor: [0, 153, 153], // Header background color
      textColor: [255, 255, 255], // Header text color
      fontStyle: "bold",
    },
    margin: { left: 10, right: 10 }, // Add left and right margins
  });

  const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;

  // Download the PDF
  pdf.save(`Sale_${timestamp}.pdf`);

  resetBill();
}

function getSelectedSaleType() {
  const cashSaleRdo = document.getElementById("cashSale");
  const bankSaleRdo = document.getElementById("bankSale");

  if (cashSaleRdo.checked) {
    return "Cash";
  } else if (bankSaleRdo.checked) {
    return "Bank";
  }
  return null;
}

async function newUserInsert() {
  const newUserTxtBoxCtrl = document.getElementById("newUserTxtBox");
  const adminCustNameCtrl = document.getElementById("adminCustName");
  let mobileNumber = document.getElementById("mobileNumberTxtBox").value.trim();
  let email = document.getElementById("emailTxtBox").value.trim();

  if (newUserTxtBoxCtrl.value.trim() === "") {
    SHOW_ERROR_POPUP("Please enter User Name");
    return;
  }

  if (mobileNumber === "") {
    SHOW_ERROR_POPUP("Please enter Mobile Number.");
    return;
  }

  // Validate mobile number (10 digits)
  if (!/^\d{10}$/.test(mobileNumber)) {
    SHOW_ERROR_POPUP("Please enter a valid 10-digit Mobile Number.");
    return;
  }

  selectedCustomerName = newUserTxtBoxCtrl.value.trim();
  selectedCustomerName = selectedCustomerName.replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );

  isCustomerManuallyAdded = true;

  const request = {
    name: selectedCustomerName,
    mobileNumber: mobileNumber,
    email: email,
  };
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    CALL_API_WITHOUT_LOADING(API_TYPE_CONSTANT.ADD_NEW_USER, request);
    adminCustNameCtrl.value = newUserTxtBoxCtrl?.value;
    SHOW_SUCCESS_POPUP("User Inserted Successfully!");
    SHOW_SPECIFIC_DIV("adminHomeContainer");
    document.getElementById("mobileNumberTxtBox").value = "";
    document.getElementById("emailTxtBox").value = "";
  }
}

function shareWhatsappBtnClick() {
  const dataForWhatsapp = combineItemsByNameForWhatsapp();
  renderWhatsappMessage(selectedUserObj?.mobile, dataForWhatsapp);
}

function backToSaleContainer() {
  const adminCustNameCtrl = document.getElementById("adminCustName");
  const newUserTxtBoxCtrl = document.getElementById("newUserTxtBox");
  adminCustNameCtrl.value = newUserTxtBoxCtrl?.value;
  SHOW_SPECIFIC_DIV("adminHomeContainer");
}

function populateSaleFromUserOrder() {
  const adminSkNameCtrl = document.getElementById("adminCustName");
  adminSkNameCtrl.value = userOrderInfo[0]?.customerName;
  document.getElementById("adminItemInputClrBtn").style.display = "flex";
  document.getElementById("pendingStatus").checked = true;

  const tableBody = document.getElementById("adSaleTableTBody");
  tableBody.innerHTML = ""; // Clear old table data

  selectedItems = [];

  userOrderInfo.forEach((item) => {
    // 🔍 Find item in stock list
    const itemIndex = itemArray.findIndex(
      (i) => i.split("-")[0].trim() === item.name.trim(),
    );

    if (itemIndex === -1) {
      console.error(`Item '${item.name}' not found in stock.`);
      return; //
    }

    const parts = itemArray[itemIndex].split("-");
    const currentAvailability = Number(parts[1].trim());
    const currentPrice = Number(parts[2].trim());

    let minusStockQty = item.quantity;
    let adjustedPrice = item.price;
    if (
      item.type.toString().toLowerCase() === unitType.toString().toLowerCase()
    ) {
      adjustedPrice = adjustedPrice / 1000;
      minusStockQty = parseFloat((item.quantity / 1000).toFixed(3));
    }

    if (currentAvailability < minusStockQty) {
      alert(
        `Insufficient stock for item '${item.name}'. Available: ${currentAvailability}, Required: ${minusStockQty}`,
      );
      return;
    }

    // ✅ Add item to selectedItems and render in table
    selectedItems.push(item);

    const row = document.createElement("tr");
    row.id = `row-${item.key}`; // Use the key as the unique row id
    row.innerHTML = `
      <td>
        <img src="https://i.postimg.cc/cJZRzYzT/delete-Icon.png" alt="Delete" 
        onclick="deleteSaleRow('${item.key}')" 
        style="cursor: pointer; width: 20px; height: 20px;">
      </td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>₹${Number(item.price).toFixed(2)}</td>
      <td>${item.discount || 0}%</td>
       <td>${item?.schemeDiscount || 0}%</td>
      <td>₹${Number(item.total).toFixed(2)}</td>
    `;
    tableBody.appendChild(row);

    //  Update stock
    const remainingQty = currentAvailability - minusStockQty;
    if (remainingQty > 0) {
      itemArray[itemIndex] = `${item.name} - ${remainingQty} - ${currentPrice}`;
    } else {
      itemArray.splice(itemIndex, 1); // Remove item if quantity exhausted
    }
  });

  // Reinitialize item list with updated stock
  initializedItemListLiveSearchControl(itemArray);

  updateFinalTotal();
}
