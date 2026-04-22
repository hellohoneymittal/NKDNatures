let selectedlibCustNameObj = "";
let selectedLibCustomerName = "";
let selectedBook = "";
let selectedCustomerNameLib = "";

async function issueLibBook() {
  // Get input values
  let custName = document.getElementById("libCustName").value.trim();
  let bookName = document.getElementById("libBookName").value.trim();
  let issueDate = document.getElementById("libBookIssueDate").value.trim();

  // Check if any field is empty
  if (custName === "" || bookName === "" || issueDate === "") {
    SHOW_ERROR_POPUP("Please fill in all the required fields.");
    return;
  }

  // Prepare data for API
  let inputData = {
    devoteeName: custName,
    bookName: bookName,
    issueDate: issueDate,
    status: "Issued",
  };
  let response = await CALL_API("LIB_ISSUE_BOOK", inputData);
  if (response) {
    resetLibBookForm();
    SHOW_SUCCESS_POPUP("Book Issued! Thank you");
  }
}

async function initializedLibCustomerList() {
  debugger;
  setupLiveSearch(
    "libCustName",
    "libCustNameClrBtn",
    "libCustNameULList",
    function (selectedText) {
      selectedLibCustomerName = selectedText;
    }
  );

  const request = {};

  const response = await CALL_API(API_TYPE_CONSTANT.LIB_USER_LIST, request);
  const libCustNameList = response?.data?.map((item) => item[0]);
  initializedLiveSearchControl(
    "libCustName",
    "libCustNameClrBtn",
    "libCustNameULList",
    libCustNameList
  );
}

async function initializedLibBookList() {
  setupLiveSearch(
    "libBookName",
    "libBookNameCrlBtn",
    "libBookNameULList",
    function (selectedText) {
      selectedBook = selectedText;
    }
  );
  const request = {};
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    const libResponse = await CALL_API(
      API_TYPE_CONSTANT.LIB_BOOK_LIST,
      request
    );

    const bookList = libResponse?.data?.bookMasterResponse;
    const activityList = libResponse?.data?.libraryActivityMasterResponse;

    const issuedCountMap = {};

    for (const activity of activityList) {
      const bookName = activity[2];
      const status = activity[4];
      if (status === "Issued") {
        issuedCountMap[bookName] = (issuedCountMap[bookName] || 0) + 1;
      }
    }

    const libResponseModified = bookList.map((book) => {
      const name = book[1];
      const qty = parseInt(book[2], 10);
      const issuedQty = issuedCountMap[name] || 0;
      return {
        bookName: name,
        availableQty: qty - issuedQty,
      };
    });
    const libBookNameList = [];
    libResponseModified?.map((item) => {
      if (parseInt(item.availableQty) > 0) {
        libBookNameList.push(item.bookName);
      }
    });

    initializedLiveSearchControl(
      "libBookName",
      "libBookNameCrlBtn",
      "libBookNameULList",
      libBookNameList
    );
  }
}

function resetLibBookForm() {
  document.getElementById("libCustName").value = "";
  document.getElementById("libBookName").value = "";
  document.getElementById("libBookIssueDate").value = "";
}

async function newLibMembershipInsert() {
  const newUserTxtBoxCtrl = document.getElementById("newUserTxtBoxMShip");

  let mobileNumber = document
    .getElementById("mobileNumberTxtBoxMShip")
    .value.trim();

  let email = document.getElementById("emailTxtBoxMShip").value.trim();

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

  selectedCustomerNameLib = newUserTxtBoxCtrl.value.trim();
  selectedCustomerNameLib = selectedCustomerNameLib.replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

  const request = {
    name: selectedCustomerNameLib,
    mobileNumber: mobileNumber,
    email: email,
  };
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    await CALL_API(API_TYPE_CONSTANT.ADD_LIB_USER, request);
    document.getElementById("newUserTxtBoxMShip").value = "";
    document.getElementById("mobileNumberTxtBoxMShip").value = "";
    document.getElementById("emailTxtBoxMShip").value = "";
    SHOW_SUCCESS_POPUP("User Inserted Successfully!");
  }
}
