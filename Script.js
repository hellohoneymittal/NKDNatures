let userDataArr = [];
let khataBookUserGridData = [];
let selectedKBUser = "";
let rowStockReponse = [];
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".leftNavBar-dynamicNavLink").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      let menuLabel = this.innerText || this.textContent;
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
        let menuLabel = this.innerText || this.textContent;
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
});

function fillKhataBookGridData(data, headerId, tableId) {
  fillDynamicTableRowsWithShareOption(
    data,
    headerId,
    tableId,
    onKBWhatsappClick,
  );
}

function preprocessKBGridData(data) {
  return data
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
  const response = await CALL_API("GET_KHATA_BOOK_BY_USER_ID", request);
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
  let modifiedData = preprocessKBGridData(khataBookUserGridData);
  fillKhataBookGridData(modifiedData, "kbTableTHead", "kbTableTBody");
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
      selectedKBUser = selectedText.trim();
      filterKBTableRows(selectedText);
    },
  );

  const request = {};
  const response = await CALL_API(
    API_TYPE_CONSTANT.GET_KHATA_BOOK_USER_LIST,
    request,
  );
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
      apiType: API_TYPE_CONSTANT.getAllUserList,
      password: passwordInputValue.toString().trim().toLowerCase(),
    };
    const response = await API_HANDLER_AXIOS(request);

    if (response.status && response.data.isAdminAccess) {
      SHOW_SPECIFIC_DIV("adminHomeContainer");

      if (Array.isArray(response?.data?.data)) {
        userDataArr = response?.data?.data;
      }

      initializedCustomerList(response?.data?.data.map((item) => item.name));
      initializedItemList();
    } else {
      SHOW_ERROR_POPUP(
        "Authentication failed. You might not have admin privileges, or the password entered is invalid.",
      );
    }
  } else {
    const request = {
      password: passwordInputValue.toString().trim().toLowerCase(),
    };
    const response = await CALL_API("GET_USER_INFO_BY_PASSWORD", request);
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

async function populateStock() {
  const request = {
    apiType: API_TYPE_CONSTANT.getStock,
    request: "Stock",
  };
  try {
    const response = await API_HANDLER_AXIOS(request);
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
