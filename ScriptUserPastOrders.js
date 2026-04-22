async function initializedUserPastOrdersList() {
  const response = await CALL_API("GET_USER_ORDER_LIST", {});
  const filteredData = {};
  const userName = getUserName();
  for (const [key, items] of Object.entries(response.data)) {
    const validItems = items.filter(
      (item) =>
        item.OrderStatus !== "Deleted" &&
        item.Name.trim().toString() === userName.trim().toString()
    );
    if (validItems.length > 0) {
      filteredData[key] = validItems;
    }
  }
  populateListViewForObjectOfArrayUserPastOrder(
    "adminUserPastOrderListView",
    filteredData,
    onUserOrderProceed
  );
}

function populateListViewForObjectOfArrayUserPastOrder(
  containerId,
  data,
  onProceed
) {
  const listContainer = document.getElementById(containerId);

  if (!listContainer) {
    console.error(`Container with id "${containerId}" not found.`);
    return;
  }

  listContainer.innerHTML = ""; // clear old content if any

  for (const billKey in data) {
    const billItems = data[billKey];
    console.log("billItems - ", billItems);
    const billCard = document.createElement("div");
    billCard.className = "uo-bill-card";

    const header = document.createElement("div");

    const totalBillAmount = billItems?.[0]?.TotalBillCost || "";
    header.className = "uo-bill-header";
    header.textContent = `${billKey} - ${totalBillAmount}`;
    debugger;
    if (billItems?.[0]?.OrderStatus === "Received") {
      header.style.backgroundColor = "Orange";
    } else if (billItems?.[0]?.OrderStatus === "Ready") {
      header.style.backgroundColor = "Green";
    }

    const itemContainer = document.createElement("div");
    itemContainer.className = "uo-bill-items";
    itemContainer.style.display = "none";

    const box = document.createElement("div");
    box.className = "uo-items-box";

    // 🔑 rowStates = har row ka status track karne ke liye
    const rowStates = new Map();

    // ✅ helper: recalc total bill cost
    function recalcTotal() {
      const totalBill = billItems.reduce(
        (sum, i) => sum + parseFloat(i.Total || 0),
        0
      );
      billItems.forEach((i) => {
        i.TotalBillCost = totalBill.toString();
      });

      // ✅ Header update: Name + BillNo + TotalBillCost
      const name = billItems?.[0]?.Name || "";
      const billNo = billItems?.[0]?.BillNo || "";
      header.textContent = `${name} - ${billNo} - ${totalBill}`;
    }

    billItems.forEach((item, index) => {
      if (item.OrderStatus === "Deleted") {
        return; // skip deleted items
      }

      const row = document.createElement("div");
      row.className = "uo-item-row";

      const product = document.createElement("div");
      product.className = "uo-product-name";
      product.textContent = `${item.Key}`;

      const qty = document.createElement("div");
      qty.className = "uo-qty";
      qty.textContent = item.Quantity;

      row.appendChild(product);
      row.appendChild(qty);

      box.appendChild(row);
    });

    itemContainer.appendChild(box);

    billCard.appendChild(header);
    billCard.appendChild(itemContainer);
    listContainer.appendChild(billCard);

    header.addEventListener("click", () => {
      const currentDisplay = window.getComputedStyle(itemContainer).display;
      itemContainer.style.display =
        currentDisplay === "none" ? "block" : "none";
    });
  }
}
