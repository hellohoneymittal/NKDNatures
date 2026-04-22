let userOrderInfo = [];
let rowDataAdmin;
let userOrderCount = 0;

async function initializedAdminOrderList() {
  const response = await CALL_API("GET_USER_ORDER_LIST", {});
  const filteredData = {};
  for (const [key, items] of Object.entries(response.data)) {
    const validItems = items.filter((item) => item.OrderStatus !== "Deleted");
    if (validItems.length > 0) {
      filteredData[key] = validItems;
    }
  }
  populateListViewForObjectOfArray(
    "adminOrderListView",
    filteredData,
    onUserOrderProceed
  );
}

function populateListViewForObjectOfArray(containerId, data, onProceed) {
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

      // ✏️ Edit button
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "uo-edit-btn";

      editBtn.addEventListener("click", () => {
        // input box create only for Quantity
        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.value = item.Quantity;

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";

        // पुराना content साफ (but product name fixed रहे)
        row.innerHTML = "";
        row.appendChild(product); // product unchanged
        row.appendChild(qtyInput);
        row.appendChild(saveBtn);

        // row ko "edit mode" mark karo
        rowStates.set(index, true);

        saveBtn.addEventListener("click", () => {
          // value update
          item.Quantity = qtyInput.value;

          // ✅ Total update logic
          if (item.Type === "Qty") {
            item.Total = (
              parseFloat(item.Price) * parseFloat(item.Quantity)
            ).toString();
          } else if (item.Type === "Wgt") {
            item.Total = (
              (parseFloat(item.Price) * parseFloat(item.Quantity)) /
              1000
            ).toString();
          }

          recalcTotal();

          const btnWrapper = document.createElement("div");
          btnWrapper.className = "uo-btn-wrapper"; // styling ke liye class

          // dono buttons ko wrapper me add kar do
          btnWrapper.appendChild(editBtn);
          btnWrapper.appendChild(deleteBtn);

          // वापस normal row बनाना
          row.innerHTML = "";
          qty.textContent = item.Quantity;
          row.appendChild(product);
          row.appendChild(qty);
          row.appendChild(btnWrapper);

          // row ko "saved" mark karo
          rowStates.set(index, false);

          console.log("Updated Items:", billItems);
        });
      });

      // ❌ Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "uo-delete-btn";

      deleteBtn.addEventListener("click", () => {
        const confirmDelete = confirm(
          `Are you sure you want to delete "${item.Key}"?`
        );
        if (confirmDelete) {
          // array से item हटाओ
          const idx = billItems.indexOf(item);
          if (idx > -1) {
            billItems.splice(idx, 1);
          }
          // row हटाओ
          row.remove();
          // recalc total
          recalcTotal();
          console.log("After Delete:", billItems);
        }
      });

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "uo-btn-wrapper"; // styling ke liye class

      // dono buttons ko wrapper me add kar do
      btnWrapper.appendChild(editBtn);
      btnWrapper.appendChild(deleteBtn);

      row.appendChild(product);
      row.appendChild(qty);
      row.appendChild(btnWrapper);
      box.appendChild(row);

      // initially edit mode = false
      rowStates.set(index, false);
    });

    // ✅ Common function to check unsaved edits
    function hasUnsavedEdits() {
      for (let [_, isEditing] of rowStates) {
        if (isEditing) return true;
      }
      return false;
    }

    // 🟢 Order Ready button
    const orderReadyButton = document.createElement("button");
    orderReadyButton.className = "uo-order-btn";
    orderReadyButton.textContent = "Order Ready";

    orderReadyButton.addEventListener("click", () => {
      if (hasUnsavedEdits()) {
        alert("Please save all edited items first.");
        return;
      }
      if (typeof onProceed === "function") {
        onProceed(billKey, billItems, "orderReady");
      }
    });

    // 🟢 Proceed button
    const proceedButton = document.createElement("button");
    proceedButton.className = "uo-proceed-btn";
    proceedButton.textContent = "Go to Sale ➔";

    proceedButton.addEventListener("click", () => {
      if (hasUnsavedEdits()) {
        alert("Please save all edited items first.");
        return;
      }
      if (typeof onProceed === "function") {
        onProceed(billKey, billItems, "orderSale");
      }
    });

    itemContainer.appendChild(box);
    itemContainer.appendChild(orderReadyButton);
    itemContainer.appendChild(proceedButton);
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

async function onUserOrderProceed(billKey, billItems, orderType = "orderSale") {
  if (orderType === "orderSale") {
    console.log("billKey, billItems");
    console.log(billKey, billItems);

    userOrderInfo = billItems.map((item) => ({
      key: item.Key,
      name: item.Key,
      price: parseFloat(item.Price),
      quantity: parseFloat(item.Quantity),
      discount: 0,
      total: parseFloat(item.Total),
      totalBillCost: parseFloat(item.TotalBillCost),
      category: item.Category,
      customerName: billKey?.split("-")[0].trim(),
      billNo: billKey?.split("-")[1].trim(),
      type: item.Type,
      paymentStatus: "Pending",
    }));

    showLeftNavBarItemContainer(
      "adminSale",
      "leftSideNavAdmin",
      "leftSideNav-itemContainer",
      "NKD Sale",
      navCallBackMethod
    );

    populateSaleFromUserOrder();
  } else if (orderType === "orderReady") {
    console.log("Order marked as Ready:", billKey, billItems);
    billItems = billItems.map((item) => ({
      ...item,
      OrderStatus: "Ready",
    }));

    const response = await CALL_API("READY_USER_ORDER", billItems);
    console.log("READY_USER_ORDER response:", response);
    const billNo = billItems[0].BillNo;
    const headers = document.querySelectorAll(".uo-bill-header");
    headers.forEach((header) => {
      if (header.textContent.includes(billNo)) {
        header.style.backgroundColor = "Green";
      }
    });
  }
}
