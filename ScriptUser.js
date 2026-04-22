let rawProductsList = [];
let orignalProductsList = [];
let cart = {};
let products = [];
let overallTotal = 0;
const PRODUCT_TYPE_CONSTANT = {
  wgt: "Wgt",
};

function preprocessStockData(data) {
  const aggregatedData = {};
  let productIdCounter = 1;
  let wgtOptions = null;
  data.forEach((row) => {
    if (!row.Item || !row.Category) return;
    let available = 0;
    let price = 0;
    const natures = formatNumber(row["Natures"] || "0");
    const itemPrice = formatNumber(row["Price"] || "0");

    if (row.Type === PRODUCT_TYPE_CONSTANT.wgt) {
      price = itemPrice;
      available = parseFloat((natures / 1000).toFixed(2));
      wgtOptions = ["Select", 100, 250, 500, 1000]; // Add weight options
    } else {
      available = parseFloat(natures.toFixed(2));
      price = itemPrice;
      wgtOptions = null;
    }

    const key = `${row["Item"]}_${row["Category"]}`;
    if (aggregatedData[key]) {
      aggregatedData[key].available += available;
    } else {
      aggregatedData[key] = {
        id: productIdCounter++,
        name: row["Item"],
        available: available,
        price: price,
        type: row?.Type,
        category: row["Category"],
      };
    }
    if (wgtOptions) {
      aggregatedData[key].wgtOptions = wgtOptions;
    }
  });

  return Object.values(aggregatedData);
}

async function populateHMTable() {
  let data = await populateStock();

  rawProductsList = preprocessStockData(data);
  orignalProductsList = [...rawProductsList];
  products = orignalProductsList;

  renderUserOrderProducts();
  localStorage.setItem("hmTableData", JSON.stringify(rawProductsList));
  fillDynamicTableRowsByGroup(rawProductsList, "hmTableTHead", "hmTableTBody");
}

function filterHMTableRows() {
  const searchValue = document
    .getElementById("searchHMTableInput")
    .value.toLowerCase();
  const data = JSON.parse(localStorage.getItem("hmTableData")) || [];

  const filteredData = data.filter((row) => {
    // Check if any value in the row matches the search term
    return Object.values(row).some((value) =>
      value.toString().toLowerCase().includes(searchValue),
    );
  });

  fillDynamicTableRowsByGroup(filteredData, "hmTableTHead", "hmTableTBody");
}

function fillDynamicTableRowsByGroup(data, headerId, bodyId) {
  const tableHead = document.getElementById(headerId);
  const tableBody = document.getElementById(bodyId);

  // Clear any existing content
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  // Check if data is not empty
  if (data.length === 0) return;

  // Generate the table header excluding the 'Category' column
  const headers = Object.keys(data[0]).filter((key) => key !== "Category");
  const headerRow = document.createElement("tr");
  headers.forEach((headerCell) => {
    const th = document.createElement("th");
    th.textContent = headerCell;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Group data by category
  const groupedData = groupByCategory(data);

  // Loop through each category and create rows
  for (const category in groupedData) {
    // Add category header row with expand/collapse functionality
    const categoryRow = document.createElement("tr");
    const categoryCell = document.createElement("td");
    categoryCell.textContent = category;
    categoryCell.colSpan = headers.length;
    categoryCell.style.fontWeight = "bold";
    categoryCell.style.backgroundColor = "#2e7d32";
    categoryCell.style.cursor = "pointer";

    // Create a span for expand/collapse text
    const toggleSpan = document.createElement("span");
    toggleSpan.textContent = "Expand";
    toggleSpan.style.float = "right";
    toggleSpan.style.color = "white";
    categoryCell.appendChild(toggleSpan);

    categoryRow.appendChild(categoryCell);
    tableBody.appendChild(categoryRow);

    // Add data rows for each item in the current category
    groupedData[category].forEach((row) => {
      const tr = document.createElement("tr");
      tr.classList.add("data-row"); // Add a class to control visibility
      headers.forEach((headerCell) => {
        const td = document.createElement("td");
        td.textContent = row[headerCell] || "";
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    // Hide rows by default
    const dataRows = Array.from(
      tableBody.querySelectorAll("tr.data-row"),
    ).slice(-groupedData[category].length);
    dataRows.forEach((row) => (row.style.display = "none"));

    // Add toggle functionality
    categoryCell.addEventListener("click", () => {
      const isExpanded = toggleSpan.textContent === "Collapse";
      dataRows.forEach(
        (row) => (row.style.display = isExpanded ? "none" : "table-row"),
      );
      toggleSpan.textContent = isExpanded ? "Expand" : "Collapse";
    });
  }
}

// Helper function to group data by category
function groupByCategory(data) {
  return data.reduce((acc, item) => {
    const category = item.Category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
}

const OldrawProductsList = [
  {
    id: 1,
    name: "Bread Whole Wheat",
    available: 5,
    price: 48,
    image: "bread.jpg",
    type: "quantity",
    category: "Bakery",
  },
  {
    id: 2,
    name: "Bun Plain",
    available: 5,
    price: 50,
    image: "BunPlain.jpeg",
    type: "quantity",
    category: "Bakery",
  },
  {
    id: 3,
    name: "Carrot",
    available: 5.5,
    price: 40,
    image: "Carrot.webp",
    type: "weight",
    wgtOptions: [100, 250, 500, 1000],
    category: "Foot Item",
  },
  {
    id: 4,
    name: "Potato",
    available: 5,
    price: 30,
    image: "Potato.jpg",
    type: "weight",
    wgtOptions: [100, 250, 500, 1000],
    category: "Foot Item",
  },
  {
    id: 5,
    name: "Banana",
    available: 5.5,
    price: 40,
    image: "Carrot.webp",
    type: "weight",
    wgtOptions: [100, 250, 500, 1000],
    category: "Foot Item",
  },
  {
    id: 6,
    name: "SweetPotato",
    available: 5,
    price: 30,
    image: "Potato.jpg",
    type: "weight",
    wgtOptions: [100, 250, 500, 1000],
    category: "Foot Item",
  },
];

function uoCalculateItemPrice(product, weight, quantity) {
  if (product.type === PRODUCT_TYPE_CONSTANT.wgt) {
    if (isNaN(weight)) {
      weight = 0;
    }
    return parseFloat(((product.price / 1000) * weight * quantity).toFixed(2));
  }
  return parseFloat((product.price * quantity).toFixed(2));
}

function filterUOProducts() {
  const query = document.getElementById("search-box").value.toLowerCase();
  if (query) {
    products = orignalProductsList.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.price?.toString().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  } else {
    products = orignalProductsList;
  }

  renderUserOrderProducts();
}

function toggleCategory(category) {
  const categoryDiv = document.getElementById(`category-${category}`);

  if (
    categoryDiv.style.display === "none" ||
    categoryDiv.style.display === ""
  ) {
    categoryDiv.style.display = "block";
  } else if (categoryDiv.style.display === "block") {
    categoryDiv.style.display = "none";
  }
}

function renderUserOrderProducts() {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";
  const categoryList = document.getElementById("category-list");
  categoryList.innerHTML = ""; // Clear existing categories

  const categories = [...new Set(products.map((p) => p.category))];

  categories.forEach((category) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.classList.add("category");

    categoryDiv.innerHTML = `
      <div class="category-header" onclick="toggleCategory('${category}')">
        <span class="category-title" id="category-title-${category}">${category}</span> 
      </div>
      <div id="category-${category}" class="category-products"></div>
    `;

    categoryList.appendChild(categoryDiv);
  });

  renderProducts(); // Render the products inside their categories

  uoUpdateTotal(); // Update category-wise total
}

function formatAvailable(available) {
  const num = parseFloat(available) || 0;
  return num % 1 === 0
    ? parseFloat(num.toFixed(0))
    : parseFloat(num.toFixed(2));
}

function renderProducts() {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";
  products.forEach((product) => {
    const categoryDiv = document.getElementById(`category-${product.category}`);
    if (categoryDiv) {
      const cartItem = cart[product.id] || {
        quantity: 0,
        weight: product.wgtOptions?.[0] || 0,
      };
      const productDiv = document.createElement("div");
      productDiv.classList.add("product-container");
      productDiv.setAttribute("data-product-id", product.id); // Add this line ✅

      if (cartItem.quantity > 0) {
        productDiv.classList.add("active-product");
      }

      productDiv.innerHTML = `
      <div class="flex-container user-order-item-container">
        
        <div class="flex-item-left details">
          <h4 style="margin: 3px">${product.name}</h4>
        </div>
        <div class="flex-item-right">
          <p style="margin: 3px">
            ${
              product.type === PRODUCT_TYPE_CONSTANT.wgt
                ? `₹${product.price}/kg`
                : `₹${product.price}/item`
            } | Avl: ${formatAvailable(product.available)}
          </p>
        </div>
      </div>
      <div class="flex-container user-order-quantity-container" data-product-id="${
        product.id
      }">
        <div class="flex-item-left quantitySelection">
          <button class="minus-btn" onclick="updateQuantity(${
            product.id
          }, -1)" ${cartItem.quantity === 0 ? "disabled" : ""}>-</button>
          <span class="quantity-value" style="padding: 0px 5px;font-size: 16px;margin-top: 10px;">${
            cartItem.quantity
          }</span>
          <button class="plus-btn" onclick="updateQuantity(${product.id}, 1)" ${
            cartItem.quantity >= product.available ||
            cartItem.weight == "Select" ||
            (cartItem.weight == "" &&
              product.type === PRODUCT_TYPE_CONSTANT.wgt)
              ? "disabled"
              : ""
          }>+</button>
        </div>
        ${
          product.type === PRODUCT_TYPE_CONSTANT.wgt
            ? `
              <div class=flex-item-mid>
              <select class="weight-select" onchange="userOrderUpdateWeight(${
                product.id
              }, this.value)">
                  
                    ${product?.wgtOptions
                      .map(
                        (w, i) =>
                          `<option value="${i === 0 ? "" : w}" ${
                            w == cartItem.weight ? "selected" : ""
                          }>
                            ${w === "Select" ? "Select" : w + "g"}
                          </option>`,
                      )
                      .join("")}
               </select>
               </div>`
            : ""
        }
        
        <div class="flex-item-right total">₹${uoCalculateItemPrice(
          product,
          cartItem.weight,
          cartItem.quantity,
        )}</div>
      </div>
      `;

      categoryDiv.appendChild(productDiv);
    }
  });
  uoUpdateTotal();
}

function updateQuantity(productId, change) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const container = document.querySelector(
    `.user-order-quantity-container[data-product-id="${productId}"]`,
  );

  const quantitySpan = container.querySelector(".quantity-value");
  const minusBtn = container.querySelector(".minus-btn");
  const plusBtn = container.querySelector(".plus-btn");
  const totalPrice = container.querySelector(".total");
  const weightSelect = container.querySelector("select");

  let selectedWeight = weightSelect ? parseInt(weightSelect.value, 10) : 1;

  let availableGrams = 0;
  if (product?.type?.toLowerCase() == "qty") {
    availableGrams = product.available;
  } else {
    availableGrams = product.available * 1000;
  }

  // Init cart if empty
  cart[productId] = cart[productId] || {
    quantity: 0,
    weight: selectedWeight,
  };

  let newQuantity = cart[productId].quantity + change;
  let totalWeightRequested = newQuantity * selectedWeight;
  if (totalWeightRequested > availableGrams) {
    plusBtn.disabled = true;
    return;
  }

  cart[productId].quantity = Math.max(0, newQuantity);

  // Update UI
  quantitySpan.textContent = cart[productId].quantity;
  minusBtn.disabled = cart[productId].quantity === 0;
  plusBtn.disabled =
    cart[productId].quantity * selectedWeight >= availableGrams;

  // 🔹 Price calculate
  let itemPrice = uoCalculateItemPrice(
    product,
    cart[productId].weight,
    cart[productId].quantity,
  );
  const userInfo = JSON.parse(localStorage.getItem("userDetails")) || {};
  // 🔹 Apply discount if Bakery category
  let discount = 0;
  if (product.category?.toLowerCase() === "bakery" && userInfo?.schDiscount) {
    discount = (itemPrice * parseFloat(userInfo?.schDiscount)) / 100;
  }
  let finalPrice = itemPrice - discount;

  // Update UI total
  totalPrice.textContent = `₹${finalPrice.toFixed(2)}`;

  // Store discounted price in cart (for overall total)
  cart[productId].finalPrice = finalPrice;

  handleActiveProduct(productId);

  // Update overall total
  uoUpdateTotal();
}

function userOrderUpdateWeight(productId, newWeight) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const container = document.querySelector(
    `.user-order-quantity-container[data-product-id="${productId}"]`,
  );

  const quantitySpan = container.querySelector(".quantity-value");
  const minusBtn = container.querySelector(".minus-btn");
  const plusBtn = container.querySelector(".plus-btn");
  const totalPrice = container.querySelector(".total");

  // Reset quantity to 0 when weight is changed
  cart[productId] = {
    quantity: 0,
    weight: parseInt(newWeight, 10),
  };

  handleActiveProduct(productId);

  // Update UI
  quantitySpan.textContent = "0";
  minusBtn.disabled = true;
  plusBtn.disabled = newWeight === "";

  // Update total price
  totalPrice.textContent = `₹${uoCalculateItemPrice(
    product,
    cart[productId].weight,
    cart[productId].quantity,
  )}`;

  // Update overall total
  uoUpdateTotal();
}

function uoUpdateTotal() {
  overallTotal = 0;
  const categoryTotals = {}; // Store category-wise totals

  // Calculate total price for each category
  Object.keys(cart).forEach((productId) => {
    const product = orignalProductsList.find((p) => p.id == productId);
    if (!product) return;

    const quantity = cart[productId].quantity;
    const weight = cart[productId].weight;

    // 🔹 Use discounted price if available, else calculate normally
    let itemTotal = 0;
    if (quantity > 0) {
      if (cart[productId].finalPrice !== undefined) {
        itemTotal = cart[productId].finalPrice;
      } else {
        itemTotal = uoCalculateItemPrice(product, weight, quantity);
      }
    }

    // Ensure numeric addition
    overallTotal += parseFloat(itemTotal);

    // Ensure category total is also calculated properly
    if (!categoryTotals[product.category]) {
      categoryTotals[product.category] = 0;
    }
    categoryTotals[product.category] += parseFloat(itemTotal);
  });

  //  Update category-wise total UI
  Object.keys(categoryTotals).forEach((category) => {
    const categoryTitle = document.getElementById(`category-title-${category}`);
    if (categoryTitle) {
      categoryTitle.textContent = `${category} - ₹${categoryTotals[
        category
      ].toFixed(2)}`;
    }
  });

  // Ensure total is actually displayed in the UI
  const totalPriceElement = document.getElementById("total-price");
  if (totalPriceElement) {
    totalPriceElement.textContent = parseFloat(overallTotal.toFixed(2));
  }
}

async function onUserOrderSubmitClick() {
  if (!cart || Object.keys(cart).length === 0) {
    SHOW_ERROR_POPUP("No items selected in the cart.");
    return;
  }

  // Check if all items have quantity 0
  const allQuantitiesZero = Object.values(cart).every(
    (item) => item.quantity === 0,
  );

  if (allQuantitiesZero) {
    SHOW_ERROR_POPUP("No items selected in the cart.");
    return;
  }

  const salesData = generateSalesData(rawProductsList, cart);
  const userInfo = JSON.parse(localStorage.getItem("userDetails")) || {};
  const desiredOrder = [
    "key",
    "name",
    "price",
    "quantity",
    "schDiscountAmount",
    "total",
    "category",
    "billNo",
    "totalBillCost",
    "type",
    "mobile",
    "role",
    "email",
    "devType",
    "orderStatus",
    "schDiscount",
  ];

  const updatedItems = salesData?.map((item) => ({
    ...item,
    ...userInfo,
  }));

  const finalItems = updatedItems.map((item) =>
    reorderObject(item, desiredOrder),
  );
  console.log(JSON.stringify(finalItems, null, 2));
  const request = {
    data: finalItems,
  };

  return;
  const response = await CALL_API("SAVE_USER_ORDER_DATA", request);

  if (response?.status) {
    SHOW_SUCCESS_POPUP("Your order accepted, thank you!");
    resetUserOrderScreen();
  } else {
    SHOW_ERROR_POPUP("Failed , try again.");
  }
}

function resetUserOrderScreen() {
  cart = {};
  overallTotal = 0;
  renderUserOrderProducts();
  const totalPriceElement = document.getElementById("total-price");
  if (totalPriceElement) {
    totalPriceElement.textContent = "0.00";
  }
}

function generateSalesData(rowStock, cart) {
  const salesData = [];
  const currentDateTime = generateBillNumber("User");

  Object.keys(cart).forEach((productId) => {
    const product = rowStock.find((p) => p.id == productId);
    if (!product) return;

    let usedQty = 0;
    let total = 0;

    if (product.type === "Qty") {
      usedQty = cart[productId].quantity;
      total = usedQty * product.price;
    } else {
      const totalWeightInGrams =
        cart[productId].weight * cart[productId].quantity;
      usedQty = totalWeightInGrams; // Still storing grams for Wgt
      total = (usedQty / 1000) * product.price; // Price calculation in kg
    }
    const userInfo = JSON.parse(localStorage.getItem("userDetails")) || {};
    let schDiscountAmount = 0;
    if (product.category?.toLowerCase() === "bakery" && userInfo?.schDiscount) {
      schDiscountAmount = (total * parseFloat(userInfo?.schDiscount)) / 100;
    }

    // 🔹 Final total after discount
    let finalTotal = total - schDiscountAmount;

    salesData.push({
      key: `${product.name}`,
      name: product.name,
      price: product.price,
      quantity: usedQty,
      schDiscountAmount: parseFloat(schDiscountAmount.toFixed(2)), // Discount value
      total: parseFloat(finalTotal.toFixed(2)), // Discounted total
      category: product.category,
      billNo: `UO/${currentDateTime}`,
      totalBillCost: parseFloat(overallTotal.toFixed(2)), // Overall cart total (already discounted)
      type: product.type,
      orderStatus: "Received",
    });
  });
  return salesData;
}

function handleActiveProduct(productId) {
  const productContainer = document.querySelector(
    `.product-container[data-product-id="${productId}"]`,
  );

  if (productContainer) {
    if (cart[productId].quantity > 0) {
      productContainer.classList.add("active-product");
    } else {
      productContainer.classList.remove("active-product");
    }
  }
}

function getUserName() {
  const userInfo = JSON.parse(localStorage.getItem("userDetails")) || {};
  return userInfo.name || "";
}
