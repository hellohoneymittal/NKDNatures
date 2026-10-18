let userDataArr = [];
let khataBookUserGridData = [];
let selectedKBUser = "";
let rowStockReponse = [];
document.addEventListener("DOMContentLoaded", async function () {
  const loginData = await DB_GET(
    "GET_ALL_USER_LIST",
    INDEX_DB.dbName,
    INDEX_DB.storeName,
  );
  if (loginData?.status) {
    populateAdminPage(loginData?.data);
  } else {
    SHOW_SPECIFIC_DIV("mainContainer");
  }

  document.querySelectorAll(".leftNavBar-dynamicNavLink").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      // title holds the full name (the mini rail hides the text)
      let menuLabel = this.title || this.innerText || this.textContent;
      let formId = this.getAttribute("data-form");
      showLeftNavBarItemContainer(
        formId,
        "leftSideNavAdmin",
        "leftSideNav-itemContainer",
        menuLabel,
        navCallBackMethod,
      );
    });
  });

  document
    .querySelectorAll(".leftNavBarUser-dynamicNavLink")
    .forEach((link) => {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        // title holds the full name (the mini rail hides the text)
      let menuLabel = this.title || this.innerText || this.textContent;
        let formId = this.getAttribute("data-form");
        showLeftNavBarItemContainer(
          formId,
          "leftSideNavUser",
          "leftSideNav-itemContainer",
          menuLabel,
          navCallBackMethod,
        );
      });
    });

  function togglePasswordField() {
    const isAdmin = document.getElementById("permissionRadioAdmin").checked;
    const passwordField = document.getElementById("password-field");
  }

  // Add event listeners to both radio buttons
  document
    .getElementById("permissionRadioUser")
    .addEventListener("change", togglePasswordField);
  document
    .getElementById("permissionRadioAdmin")
    .addEventListener("change", togglePasswordField);

  // Enter in the password box signs in
  const passwordInput = document.getElementById("passwordInputAdmin");
  passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      viewHomePage();
    }
  });

  // Warn while Caps Lock is on
  const capsLockHint = document.getElementById("capsLockHint");
  ["keydown", "keyup"].forEach((type) => {
    passwordInput.addEventListener(type, function (event) {
      const isOn = event.getModifierState && event.getModifierState("CapsLock");
      capsLockHint.classList.toggle("is-visible", Boolean(isOn));
    });
  });
  passwordInput.addEventListener("blur", () =>
    capsLockHint.classList.remove("is-visible"),
  );

  // Time-of-day greeting on the login card
  const hour = new Date().getHours();
  document.getElementById("authGreeting").textContent =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
});

// Show / hide the login password
function togglePasswordVisibility() {
  const input = document.getElementById("passwordInputAdmin");
  const toggle = document.querySelector("#password-field .pw-toggle");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  toggle.classList.toggle("is-visible", show);
  toggle.setAttribute("aria-pressed", String(show));
  toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
  input.focus();
}

// Khata Book list: avatar + name, coloured balance pill, WhatsApp button.
// Clicking a row picks that customer for "Record payment".
function fillKhataBookGridData(data, headerId, tableId) {
  const tableHead = document.getElementById(headerId);
  const tableBody = document.getElementById(tableId);
  const rows = data || [];

  tableHead.innerHTML =
    '<tr><th>Customer</th><th class="kb-col-balance">Balance</th>' +
    '<th class="kb-col-action"><span class="sr-only">Share</span></th></tr>';
  tableBody.innerHTML = "";

  rows.forEach((row) => {
    const name = String(row.Name || "").trim();
    const tr = document.createElement("tr");
    tr.className = "kb-row";
    tr.dataset.name = name;
    tr.classList.toggle("is-selected", name === selectedKBUser);

    const nameTd = document.createElement("td");
    const avatar = document.createElement("span");
    avatar.className = "kb-avatar";
    avatar.textContent = getKBInitials(name);
    const nameText = document.createElement("span");
    nameText.className = "kb-name";
    nameText.textContent = name;
    nameTd.append(avatar, nameText);

    const balanceTd = document.createElement("td");
    balanceTd.className = "kb-col-balance";
    balanceTd.appendChild(createKBBalancePill(row.Balance));

    const actionTd = document.createElement("td");
    actionTd.className = "kb-col-action";
    const share = document.createElement("button");
    share.type = "button";
    share.className = "kb-share";
    share.title = "Send khata on WhatsApp";
    share.setAttribute("aria-label", `Send khata to ${name} on WhatsApp`);
    share.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z"/></svg>';
    share.addEventListener("click", (event) => {
      event.stopPropagation();
      onKBWhatsappClick(row);
    });
    actionTd.appendChild(share);

    tr.append(nameTd, balanceTd, actionTd);
    tr.addEventListener("click", () => selectKBCustomer(name));
    tableBody.appendChild(tr);
  });

  document.getElementById("kbEmpty")?.classList.toggle("is-visible", !rows.length);
  updateKBSummary();
}

function getKBInitials(name) {
  const parts = String(name).split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function formatKBAmount(value) {
  return (
    "₹" +
    Math.abs(Number(value) || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  );
}

// Positive balance = the customer still has to pay; negative = advance
function createKBBalancePill(balance) {
  const pill = document.createElement("span");
  const isDue = Number(balance) > 0;
  pill.className = `kb-balance ${isDue ? "kb-balance--due" : "kb-balance--adv"}`;
  pill.textContent = formatKBAmount(balance);
  const tag = document.createElement("small");
  tag.textContent = isDue ? "Due" : "Advance";
  pill.appendChild(tag);
  return pill;
}

// Totals across all customers (not just the filtered rows)
function updateKBSummary() {
  const rows = preprocessKBGridData(khataBookUserGridData);
  const due = rows.filter((row) => row.Balance > 0);
  const adv = rows.filter((row) => row.Balance < 0);
  const sum = (list) => list.reduce((total, row) => total + row.Balance, 0);
  const plural = (n) => `${n} ${n === 1 ? "customer" : "customers"}`;
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("kbStatDue", formatKBAmount(sum(due)));
  setText("kbStatDueCount", plural(due.length));
  setText("kbStatAdv", formatKBAmount(sum(adv)));
  setText("kbStatAdvCount", plural(adv.length));
  setText("kbStatCount", String(rows.length));
}

// Pick a customer for "Record payment" (row click or search)
function selectKBCustomer(name) {
  selectedKBUser = (name || "").trim();
  const search = document.getElementById("kbLiveSearchInput");
  if (search && selectedKBUser) {
    search.value = selectedKBUser;
    document.getElementById("kbLiveSearchInputClrBtn").style.display = "block";
  }
  document.querySelectorAll("#kbTableTBody .kb-row").forEach((tr) => {
    tr.classList.toggle("is-selected", tr.dataset.name === selectedKBUser);
  });
  updateKBSelectedCard();
  if (selectedKBUser) {
    if (window.matchMedia("(max-width: 1024px)").matches) {
      document
        .getElementById("kbPayCard")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      document.getElementById("kbAmountInput")?.focus();
    }
  }
}

function updateKBSelectedCard() {
  const card = document.getElementById("kbSelected");
  if (!card) return;
  const row = preprocessKBGridData(khataBookUserGridData).find(
    (item) => String(item.Name).trim() === selectedKBUser,
  );
  card.classList.toggle("is-picked", Boolean(selectedKBUser));
  document.getElementById("kbSelectedAvatar").textContent = selectedKBUser
    ? getKBInitials(selectedKBUser)
    : "?";
  document.getElementById("kbSelectedName").textContent =
    selectedKBUser || "No customer selected";
  const balanceEl = document.getElementById("kbSelectedBalance");
  balanceEl.textContent = !selectedKBUser
    ? "Pick a customer from the list"
    : row
      ? `${row.Balance > 0 ? "Due" : "Advance"}: ${formatKBAmount(row.Balance)}`
      : "No balance";
}

function preprocessKBGridData(data) {
  return (data || [])
    .map((row) => ({
      // date: ConvertDateToSpecificFormat(
      //   row["Input Date"],
      //   DATE_FORMAT_CONSTANT.grid
      // ),
      Name: row["Name"],
      Balance: Number(row.Balance), // Convert Balance to a number
    }))
    .filter((row) => row.Balance !== 0 && !isNaN(row.Balance)); // Remove rows where Balance is 0 or NaN
}

async function onKBWhatsappClick(data) {
  console.log(data);

  let selecteKhataBookUser = khataBookUserGridData.find(
    (item) => item.Name.trim() === data.Name.trim(),
  );

  let selectedUserObj = userDataArr.find(
    (item) => item.name === data.Name.trim(),
  );

  const request = {
    sheetId: selecteKhataBookUser?.SheetId,
  };
  const response = await CALL_API_CF("GET_KHATA_BOOK_BY_USER_ID", request);
  console.log(response);
  renderKhataBookWhatsappMessage(
    selectedUserObj?.mobile,
    response?.data,
    data.Name.trim(),
  );
}

function filterKBTableRows(selectedText) {
  let filteredData = preprocessKBGridData(khataBookUserGridData);
  if (selectedText) {
    filteredData = filteredData.filter((row) => {
      return row.Name.trim() == selectedText.trim();
    });
  }
  fillKhataBookGridData(filteredData, "kbTableTHead", "kbTableTBody");
}

function kbLiveSearchInputClrBtnClick() {
  selectedKBUser = "";
  let modifiedData = preprocessKBGridData(khataBookUserGridData);
  fillKhataBookGridData(modifiedData, "kbTableTHead", "kbTableTBody");
  updateKBSelectedCard();
}
async function navCallBackMethod(formId) {
  switch (formId) {
    case "adminKhataBook": {
      await initializedKhatabook();
      break;
    }

    case "adminProduction": {
      await initializedProductionItemList();
      break;
    }

    case "adminOrderList": {
      await initializedAdminOrderList();
      break;
    }

    case "libIssueBook": {
      await initializedLibBookList();
      await initializedLibCustomerList();
      break;
    }

    case "libMembership": {
      await initializedLibCustomerList();
      break;
    }

    case "userPastOrders": {
      await initializedUserPastOrdersList();
      break;
    }

    case "adminNKDCommunitySale": {
      await initializedItemListNKD();
      break;
    }

    // These screens need no data loading when opened
    case "adminSale":
    case "adminDailyInput":
    case "natureGSTBill":
    case "userOrder": {
      break;
    }

    default: {
      console.warn("Unknown formId:", formId);
    }
  }
}

async function initializedKhatabook() {
  setupLiveSearch(
    "kbLiveSearchInput",
    "kbLiveSearchInputClrBtn",
    "kbLiveSearchInputULList",
    function (selectedText) {
      if (selectedText) {
        selectedKBUser = selectedText.trim();
        filterKBTableRows(selectedText);
      } else {
        selectedKBUser = "";
      }
      updateKBSelectedCard();
    },
  );

  const request = {};
  const response = await CALL_API_CF("GET_KHATA_BOOK_USER_LIST", request);
  khataBookUserGridData = response?.data;
  let modifiedData = preprocessKBGridData(khataBookUserGridData);
  fillKhataBookGridData(modifiedData, "kbTableTHead", "kbTableTBody");

  initializedLiveSearchControl(
    "kbLiveSearchInput",
    "kbLiveSearchInputClrBtn",
    "kbLiveSearchInputULList",
    response?.data.map((user) => `${user.Name}`),
  );
}
async function viewHomePage() {
  const isAdmin = document.getElementById("permissionRadioAdmin").checked;
  const passwordInputValue =
    document.getElementById("passwordInputAdmin").value;
  if (!passwordInputValue) {
    SHOW_ERROR_POPUP("Please enter password");
    return;
  }
  if (isAdmin) {
    const request = {
      password: passwordInputValue.toString().trim().toLowerCase(),
    };
    const response = await CALL_API_CF_WITH_CACHE("GET_ALL_USER_LIST", request);

    if (response?.status && response?.data?.isAdminAccess) {
      populateAdminPage(response?.data);
    } else {
      SHOW_ERROR_POPUP(
        "Authentication failed. You might not have admin privileges, or the password entered is invalid.",
      );
    }
  } else {
    const request = {
      password: passwordInputValue.toString().trim().toLowerCase(),
    };
    const response = await CALL_API_CF("GET_USER_INFO_BY_PASSWORD", request);
    if (response?.data?.userDetails) {
      localStorage.setItem(
        "userDetails",
        JSON.stringify(response?.data?.userDetails),
      );
    } else {
      SHOW_ERROR_POPUP(
        "Authentication failed. The password entered is invalid.",
      );
      return;
    }
    await populateHMTable();
    SHOW_SPECIFIC_DIV("userHomeContainer");
  }
}

function populateAdminPage(response) {
  SHOW_SPECIFIC_DIV("adminHomeContainer");
  //document.getElementById("loginName").textContent = response?.data?.name;
  if (Array.isArray(response?.data)) {
    userDataArr = response?.data;
  }
  initializedCustomerList(response?.data.map((item) => item.name));
  initializedItemList();
}

async function logoutBtnClick() {
  await DB_CLEAR(INDEX_DB.dbName, INDEX_DB.storeName);
  SHOW_SPECIFIC_DIV("mainContainer");
}

async function populateStock() {
  try {
    const response = await CALL_API_CF("GET_STOCK", {});
    if (response) {
      rowStockReponse = response.data;
      return response.data;
    } else {
      SHOW_ERROR_POPUP("Something Went Wrong");
    }
  } catch (ex) {
    SHOW_ERROR_POPUP("Error :- " + ex);
  }
}

function renderWhatsappMessage(number, selectedItem) {
  let todayDate = convertDateToFormat(new Date());
  let phone =
    number && number.length === 10 && !isNaN(number) && number !== "0"
      ? `91${number}`
      : "";

  let grandTotal = 0;
  let rawStatus = selectedItem[0]?.paymentStatus?.toLowerCase() || "n/a";
  let formattedStatus =
    rawStatus === "paid"
      ? "✅ Paid"
      : rawStatus === "pending"
        ? "❌ Pending"
        : "N/A";

  let billMessage =
    `🛒 *Nature's Bill* 🛒\n` +
    `Customer: ${selectedItem[0]?.customerName || ""}\n` +
    `Payment Status: ${formattedStatus}\n\n`;

  billMessage += "📅 *Date:* " + todayDate + "\n\n";

  // Separate sale and return items
  const saleItems = selectedItem.filter(
    (item) => item.quantity > 0 && item.total > 0,
  );

  const returnItems = selectedItem.filter(
    (item) => item.quantity < 0 && item.total < 0,
  );

  // 👉 Sale section

  if (saleItems.length > 0) {
    billMessage += `🛍️ *Purchased Items*\n\n`;
    let counter = 1;
    saleItems.forEach((item) => {
      const baseTotal = Number(item.baseTotal) || 0;
      const discAmt = Number(item.discountAmount) || 0;
      const schemeAmt = Number(item.schemeDiscountAmount) || 0;
      const netTotal = baseTotal - discAmt - schemeAmt;
      grandTotal += netTotal;

      billMessage += `${counter++}. *${item.name}*\n`;
      billMessage += `   Qty: ${item.quantity} × ₹${
        item.price
      } = ₹${baseTotal.toFixed(2)}\n`;

      if (discAmt > 0) {
        billMessage += `   🔹 Discount: -₹${discAmt.toFixed(2)}\n`;
      }
      if (schemeAmt > 0) {
        billMessage += `   🔸 Scheme Discount: -₹${schemeAmt.toFixed(2)}\n`;
      }

      // ✅ Add this only if discount or scheme discount is applied
      if (discAmt > 0 || schemeAmt > 0) {
        billMessage += `   ➡ Final: ₹${netTotal.toFixed(2)}\n`;
      }

      billMessage += `\n`; // Line break after each item
    });
    billMessage += `\n`;
  }

  // 🔁 Return section
  if (returnItems.length > 0) {
    billMessage += `🔁 *Returned Items*\n`;
    let returnCounter = 1;
    returnItems.forEach((item) => {
      const qty = Math.abs(item.quantity);
      const total = Math.abs(item.total);
      grandTotal -= total;

      billMessage += `${returnCounter++}. *${item.name}* - ${qty} x ₹${
        item.price
      } = ₹${total.toFixed(2)}\n`;
    });
    billMessage += `\n`;
  }

  billMessage += `*Grand Total: ₹${grandTotal.toFixed(2)}*\n\n`;
  if (grandTotal > 0) {
    let link =
      "upi://pay?pa=vyapar.173204529590@hdfcbank&am=" +
      grandTotal.toFixed(2) +
      "&cu=INR";

    billMessage += "\n💳 *Pay Now:*\n" + link + "\n\n";
  }
  billMessage += `Chant and be Happy!\n🛍️ Hare Krishna 🛍️`;

  let message = encodeURIComponent(billMessage);
  const whatsappUrl =
    "https://api.whatsapp.com/send?" +
    (phone ? "phone=" + phone + "&" : "") +
    "text=" +
    message;

  resetSaleFields();
  window.open(whatsappUrl, "_blank");
}

function renderKhataBookWhatsappMessage(number, selectedItem, userName) {
  let phone =
    number && number.length === 10 && !isNaN(number) && number !== "0"
      ? "91" + number
      : "";

  if (!selectedItem || selectedItem.length === 0) return;
  let displayFinalTotalBalance = "";
  // Extract final total balance from the first row
  let finalTotalBalance = selectedItem[0]["Balance Amount"] || "0";

  let billMessage = "📜 *Pending Dues Summary* 📜\n\n";
  billMessage += "*" + userName + "*\n";

  selectedItem.forEach((item, index) => {
    let date = item["Bill Date"]
      ? ConvertDateToSpecificFormat(
          item["Bill Date"],
          DATE_FORMAT_CONSTANT.grid,
        )
      : "";
    let billAmount = item["Bill Amount"] ? "(+)₹" + item["Bill Amount"] : "";

    let creditAmount = item["Credit Amount"]
      ? "(-)₹" + item["Credit Amount"]
      : "";
    let balanceAmount = Number(item["Balance Amount"]);

    let displayBalance = "";

    if (balanceAmount < 0) {
      displayBalance = `(Adv: (+)₹${Math.abs(balanceAmount)})`;
    } else if (balanceAmount > 0) {
      displayBalance = `(Due: (-)₹${balanceAmount})`;
    }

    if (finalTotalBalance) {
      let sign = finalTotalBalance > 0 ? "(-)" : "(+)";
      displayFinalTotalBalance = `${sign}${Math.abs(finalTotalBalance)}`;
    }

    billMessage +=
      "*" +
      date +
      "* : " +
      billAmount +
      " " +
      creditAmount +
      " " +
      displayBalance +
      "\n";
  });

  let totalBalMessage = "";

  if (finalTotalBalance > 0) {
    totalBalMessage =
      "\n💰 *Total Balance: ₹" +
      displayFinalTotalBalance +
      "*🔴 *(You Need to Pay)*";
  } else if (finalTotalBalance < 0) {
    totalBalMessage =
      "\n💰 *Total Balance: ₹" +
      Math.abs(displayFinalTotalBalance) +
      "*🟢 *(You Will Receive)*";
  } else {
    totalBalMessage = "\n💰 *Total Balance: ₹0*✅ *(No amount due.)*";
  }

  billMessage += totalBalMessage;
  billMessage += "\n\n📞 *For any queries, contact us. 9205581666*";

  if (finalTotalBalance > 0) {
    let link =
      "upi://pay?pa=vyapar.173204529590@hdfcbank&am=" +
      finalTotalBalance +
      "&cu=INR";
    billMessage += "\n💳 *Pay Now:* (" + link + ")\n\n";
  }

  billMessage += "\n *Hare Krishna !*";

  // Encode message for WhatsApp
  let message = encodeURIComponent(billMessage);
  const whatsappUrl =
    "https://api.whatsapp.com/send?" +
    (phone ? "phone=" + phone + "&" : "") +
    "text=" +
    message;

  window.open(whatsappUrl, "_blank");
}

function animateBell() {
  const bell = document.querySelector("span[style*='font-size: 24px']");
  if (bell) {
    // Play sound on notification
    const audio = new Audio(
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    );
    audio.play();

    setTimeout(() => {
      audio.pause(); // Pause the audio
      audio.currentTime = 0; // Reset the playback position to the start
    }, 10000);

    // Make bell bigger and shake
    bell.classList.add("bell-shake", "bell-grow");

    // Remove animations after some time
    setTimeout(() => {
      bell.classList.remove("bell-shake", "bell-grow");
    }, 600);
  }
}

// Status card on the GST page: idle / working / done / failed
function setGSTStatus(state, title, message) {
  const card = document.getElementById("gstStatus");
  if (!card) return;
  card.className = `gst-status is-${state}`;
  document.getElementById("gstStatusTitle").textContent = title;
  document.getElementById("gstStatusMsg").textContent = message || "";
  document.getElementById("gstStatusTime").textContent =
    state === "idle"
      ? ""
      : new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });
}

async function processNatureGSTBillRequest() {
  const button = document.getElementById("gstGenerateBtn");
  // one request at a time
  if (button?.disabled) return;
  if (button) button.disabled = true;
  setGSTStatus("working", "Generating…", "Building the GST invoice, please wait.");
  SHOW_INFO_POPUP("Request submitted. I will proceed shortly.");
  try {
    const response = await CALL_API_CF_WITHOUT_LOADING(
      "GENERATE_NATURES_GST_INVOICE",
      {},
    );
    if (response?.data?.success) {
      setGSTStatus("done", "Invoice generated", response?.data?.message);
      SHOW_SUCCESS_POPUP(response?.data?.message);
    } else {
      setGSTStatus(
        "failed",
        "Generation failed",
        response?.data?.message || "Please try again.",
      );
      SHOW_ERROR_POPUP(
        "Error in GST Bill Generation " + (response?.data?.message || ""),
      );
    }
  } finally {
    if (button) button.disabled = false;
  }
}
