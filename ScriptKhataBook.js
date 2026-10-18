function khataBookUserGridBtnClick(tableId) {
  IsLoading(true); // Show loader

  setTimeout(() => {
    try {
      const dateForExcel = getFormattedDateForDownload();
      const rows = preprocessKBGridData(khataBookUserGridData);
      if (!rows.length) {
        SHOW_INFO_POPUP("No data to download yet.");
        return;
      }
      // Name + numeric Balance, straight from the data
      const sheet = XLSX.utils.json_to_sheet(rows);
      sheet["!cols"] = [{ wch: 32 }, { wch: 14 }];
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Data");
      XLSX.writeFile(book, `Credit_User_List_${dateForExcel}.xlsx`);
    } finally {
      IsLoading(false); // Hide loader after export, even if it failed
    }
  }, 2000); // 2 seconds delay
}

async function submitKBAmount() {
  const amountInput = document.getElementById("kbAmountInput").value.trim();
  let selectedDropdownValue =
    document.querySelector('input[name="kbPayMode"]:checked')?.value || "";
  if (!amountInput) {
    SHOW_ERROR_POPUP("Please enter an amount before proceeding.");
    return;
  }
  if (!selectedKBUser) {
    SHOW_ERROR_POPUP("Please select Users");
    return;
  }
  if (!selectedDropdownValue) {
    SHOW_ERROR_POPUP("Please select type (cash) or (bank)");
    return;
  }

  let inputData = {
    name: selectedKBUser,
    amount: amountInput,
    selectedType: selectedDropdownValue,
  };
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    CALL_API_CF_WITHOUT_LOADING("UPDATE_CUST_CREDIT_BALANCE", inputData);
    const updatedData = resetKhataBookAndUpdateTable(inputData);
    let filteredData = preprocessKBGridData(updatedData);
    selectedKBUser = "";
    fillKhataBookGridData(filteredData, "kbTableTHead", "kbTableTBody");
    updateKBSelectedCard();
    SHOW_SUCCESS_POPUP("Balance Updated! Thank you");
  }
}

function resetKhataBookAndUpdateTable(inputData) {
  document.getElementById("kbAmountInput").value = "";
  document.getElementById("kbLiveSearchInput").value = "";
  document
    .querySelectorAll('input[name="kbPayMode"]')
    .forEach((radio) => (radio.checked = false));
  document.getElementById("kbLiveSearchInputClrBtn").style.display = "none";
  let customer = khataBookUserGridData.find(
    (item) => item.Name.trim() === inputData.name.trim(),
  );

  if (customer) {
    let currentBalance = parseFloat(customer.Balance) || 0;
    let amount = parseFloat(inputData.amount);

    if (!isNaN(amount)) {
      customer.Balance = (currentBalance - amount).toFixed(2); // Update balance
    }
  }
  return khataBookUserGridData;
}
