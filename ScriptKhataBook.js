function khataBookUserGridBtnClick(tableId) {
  IsLoading(true); // Show loader

  setTimeout(() => {
    const dateForExcel = getFormattedDateForDownload();
    exportTableToExcel(tableId, `Credit_User_List_${dateForExcel}.xlsx`);
    IsLoading(false); // Hide loader after export
  }, 2000); // 2 seconds delay
}

async function submitKBAmount() {
  const amountInput = document.getElementById("kbAmountInput").value.trim();
  let selectedDropdownValue = document.getElementById("kbCashBankDdl").value;
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
    CALL_API_WITHOUT_LOADING("UPDATE_CUST_CREDIT_BALANCE", inputData);
    const updatedData = resetKhataBookAndUpdateTable(inputData);
    let filteredData = preprocessKBGridData(updatedData);
    fillKhataBookGridData(filteredData, "kbTableTHead", "kbTableTBody");
    SHOW_SUCCESS_POPUP("Balance Updated! Thank you");
  }
}

function resetKhataBookAndUpdateTable(inputData) {
  document.getElementById("kbAmountInput").value = "";
  document.getElementById("kbLiveSearchInput").value = "";
  document.getElementById("kbCashBankDdl").value = "";
  document.getElementById("kbLiveSearchInputClrBtn").style.display = "none";
  let customer = khataBookUserGridData.find(
    (item) => item.Name.trim() === inputData.name.trim()
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
