let selectedItemsNKD = [];

document.addEventListener("DOMContentLoaded", function () {
  setupLiveSearch(
    "adminItemInputNKD",
    "adminItemInputClrBtnNKD",
    "adminItemInputULListNKD",
    function (selectedText) {
      selectedItem = selectedText;
    }
  );

  // Customer: pick from the list (or type a new name)
  setupLiveSearch(
    "adminCustNameNKD",
    "adminCustNameNKDClrBtn",
    "adminCustNameNKDULList",
    function () {
      updateNKDCartMeta();
    }
  );
  document
    .getElementById("adminCustNameNKD")
    ?.addEventListener("input", updateNKDCartMeta);
});

async function initializedItemListNKD() {
  let itemData = preprocessItemData(rowStockReponse);
  // debugger;
  itemArray = itemData.map((row) => `${row.item} - ${row.price}`);

  if (itemArray) {
    initializedItemListLiveSearchControlNKD(itemArray);
  }

  // same customer list as Admin Sale (filled at login)
  const customerNames = [
    "General Customer",
    ...(Array.isArray(userDataArr) ? userDataArr : [])
      .map((user) => user?.name)
      .filter(Boolean),
  ];
  initializedLiveSearchControl(
    "adminCustNameNKD",
    "adminCustNameNKDClrBtn",
    "adminCustNameNKDULList",
    [...new Set(customerNames)]
  );
  updateNKDCartMeta();
}

function initializedItemListLiveSearchControlNKD(itemArray) {
  initializedLiveSearchControl(
    "adminItemInputNKD",
    "adminItemInputClrBtnNKD",
    "adminItemInputULListNKD",
    itemArray
  );
}

function addItemInBillNKD() {
  const itemInput = document.getElementById("adminItemInputNKD");
  const qtyInput = document.getElementById("adminQuantityInputNKD");
  const disInput = document.getElementById("adminDisInputNKD");
  const tableBody = document.getElementById("billTableBodyNKD");

  const itemText = itemInput.value.trim();
  const qty = Number(qtyInput.value);
  const discount = Number(disInput.value) || 0;

  if (!itemText || !qty) {
    SHOW_ERROR_POPUP("Please enter item and quantity");
    return;
  }

  // Parse "Product - 99"
  const [itemName, priceText] = itemText.split(" - ");
  const selectedObj = getSelectedItemObject(itemName);
  // debugger;
  if (!selectedObj || !priceText) {
    SHOW_ERROR_POPUP("Please select an item from the list.");
    return;
  }
  const price = Number(priceText.trim());
  const gstPercentage = Number(selectedObj["GST %"] || 0);
  const hsnNo = selectedObj["HSN"] || "";

  // ---- CALCULATIONS ----
  const totalBeforeDiscount = qty * price;
  const discountAmount = (totalBeforeDiscount * discount) / 100;
  const discountedTotal = totalBeforeDiscount - discountAmount;

  const baseAmount = discountedTotal / (1 + gstPercentage / 100);
  const gstAmount = discountedTotal - baseAmount;
  const totalWithGST = discountedTotal; // Final total including GST

  const uniqueKey = `${itemName}-${Date.now()}`;

  // ---- ADD HTML ROW ----
  const row = document.createElement("tr");
  row.id = `row-${uniqueKey}`;
  row.innerHTML = `
      <td>
        <img src="https://i.postimg.cc/cJZRzYzT/delete-Icon.png"
        alt="Remove" title="Remove item" onclick="deleteSaleRowNKD('${uniqueKey}')"
        style="cursor:pointer; width:18px; height:18px;">
      </td>
      <td>${itemName}</td>
      <td>${qty}</td>
      <td>₹${price.toFixed(2)}</td>
      <td>${discount}%</td>
      <td>₹${baseAmount.toFixed(2)}</td>
      <td>${gstPercentage}%</td>
      <td>₹${gstAmount.toFixed(2)}</td>
      <td>₹${totalWithGST.toFixed(2)}</td>
  `;

  tableBody.appendChild(row);

  // ---- STORE CLEAN DATA ONLY ----
  selectedItemsNKD.push({
    key: uniqueKey,
    itemName,
    qty,
    price,
    discount,
    gstPercentage,
    baseAmount: Number(baseAmount.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    totalWithGST: Number(totalWithGST.toFixed(2)),
    hsnNo,
  });

  updateTotalNKD();

  // RESET INPUTS
  itemInput.value = "";
  qtyInput.value = "";
  disInput.value = "";
  document.getElementById("adminItemInputClrBtnNKD").style.display = "none";
  itemInput.focus();
}

function deleteSaleRowNKD(key) {
  const row = document.getElementById(`row-${key}`);
  if (row) row.remove();

  const index = selectedItemsNKD.findIndex((item) => item.key === key);
  if (index > -1) selectedItemsNKD.splice(index, 1);

  updateTotalNKD();
}

function updateTotalNKD() {
  const total = selectedItemsNKD.reduce((sum, item) => {
    return sum + (item.totalWithGST ? Number(item.totalWithGST) : 0);
  }, 0);

  const totalEl = document.getElementById("totalCostNKD");
  totalEl.textContent = `₹${total.toFixed(2)}`;
  // replay the "bump" animation on every change
  totalEl.classList.remove("is-bumped");
  void totalEl.offsetWidth;
  totalEl.classList.add("is-bumped");
  updateNKDCartMeta();
}

// Item count, empty state and the summary in the checkout card
function updateNKDCartMeta() {
  const count = selectedItemsNKD.length;
  const gst = selectedItemsNKD.reduce(
    (sum, item) => sum + (Number(item.gstAmount) || 0),
    0
  );
  const customer = document.getElementById("adminCustNameNKD")?.value.trim();
  const items = `${count} ${count === 1 ? "item" : "items"}`;
  const setText = (id, text, isWarning) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-warning", Boolean(isWarning));
  };
  setText("nkdItemCount", items);
  setText("nkdSumItems", items);
  setText("nkdSumGst", `₹${gst.toFixed(2)}`);
  setText("nkdSumCustomer", customer || "Not selected", !customer);
  document.getElementById("nkdCart")?.classList.toggle("is-empty", !count);
}

async function onSaleConfirmClickNKD() {
  // Same API layer as the other screens (sends the array, not a string,
  // like SAVE_PRODUCTION_DATA)
  const response = await CALL_API_CF("CREATE_SALE_NKD", selectedItemsNKD);
  if (response?.status) {
    SHOW_SUCCESS_POPUP("Sale Created Successfully");
    clearNKDSaleForm();
    console.log("Sale Creation Response:", response);
  }
}

function getSelectedItemObject(itemName) {
  return rowStockReponse.find((obj) => obj.Item === itemName);
}

function submitOrderNKD() {
  const generatedBillNo = generateBillNumber("NKD");
  const customerSelect = document.getElementById("adminCustNameNKD");
  let customerName = customerSelect.value;

  if (!selectedItemsNKD || selectedItemsNKD.length === 0) {
    SHOW_ERROR_POPUP("No items selected");
    return;
  }

  let subtotal = 0;
  let totalGST = 0;

  // First pass: calculate totals
  selectedItemsNKD = selectedItemsNKD.map((item) => {
    const baseAmount = Number(item.baseAmount) || 0;
    const gstAmount = Number(item.gstAmount) || 0;
    const totalWithGST = Number(item.totalWithGST) || 0;

    subtotal += baseAmount;
    totalGST += gstAmount;

    return {
      ...item,
      customerName,
      billNo: item?.billNo ? item.billNo : generatedBillNo,
      totalWithGST: totalWithGST.toFixed(2),
    };
  });

  // Final bill total (same for all rows)
  const billTotal = subtotal + totalGST;

  selectedItemsNKD = selectedItemsNKD.map(({ key, ...rest }) => ({
    ...rest,
    billTotal: billTotal.toFixed(2),
  }));

  // Update UI
  document.getElementById("totalCostNKD").textContent =
    `₹${billTotal.toFixed(2)}`;

  // Columns
  const columnNames = [
    { displayName: "Item", actualName: "itemName" },
    { displayName: "Quantity", actualName: "qty" },
    { displayName: "Price", actualName: "price" },
    { displayName: "Disc. %", actualName: "discount" },
    { displayName: "Base (Excl. GST)", actualName: "baseAmount" },
    { displayName: "GST Amt", actualName: "gstAmount" },
    { displayName: "Total (Incl. GST)", actualName: "totalWithGST" },
    { displayName: "Bill Total", actualName: "billTotal" }, // ⭐ new column
  ];

  // Confirmation popup
  SHOW_CONFIRMATION_GRID_POPUP(
    selectedItemsNKD,
    columnNames,
    onSaleConfirmClickNKD,
    "Proceed",
    "Back",
    `Summary - Total ₹${billTotal.toFixed(2)}`
  );
}

function clearNKDSaleForm() {
  // Input fields clear
  document.getElementById("adminCustNameNKD").value = "";
  document.getElementById("adminItemInputNKD").value = "";
  document.getElementById("adminQuantityInputNKD").value = "";
  document.getElementById("adminDisInputNKD").value = "";

  selectedItemsNKD = [];

  // Bill table clear
  const tableBody = document.getElementById("billTableBodyNKD");
  tableBody.innerHTML = "";

  // Total reset
  document.getElementById("totalCostNKD").innerText = "₹0.00";
  document.getElementById("adminCustNameNKDClrBtn").style.display = "none";
  document.getElementById("adminItemInputClrBtnNKD").style.display = "none";
  updateNKDCartMeta();
}
