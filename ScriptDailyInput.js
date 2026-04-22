window.onload = function () {
  document.getElementById("dailyInputDate").value = getYesterdayDate();
};

function getYesterdayDate() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function resetDailyInputFields() {
  SHOW_CONFIRMATION_POPUP(
    "Do you want to reset , Date Control set to Yesterday ?",
    clearDailyInputFieldValue
  );
}

function clearDailyInputFieldValue() {
  document.getElementById("dailyInputDate").value = getYesterdayDate();
  document.getElementById("adminCashSaleInput").value = "";
  document.getElementById("adminBankSaleInput").value = "";
  document.getElementById("adminDebtorsAmountInput").value = "";
}

async function submitDailyInput() {
  const dailyInputDate = document.getElementById("dailyInputDate").value;
  const adminCashSaleInput =
    document.getElementById("adminCashSaleInput").value;
  const adminBankSaleInput =
    document.getElementById("adminBankSaleInput").value;
  const adminDebtorsAmountInput = document.getElementById(
    "adminDebtorsAmountInput"
  ).value;

  // Create an object to store all values
  const formData = {
    date: dailyInputDate,
    cashSale: adminCashSaleInput,
    bankSale: adminBankSaleInput,
    debtorsAmount: adminDebtorsAmountInput,
  };

  // Check if all required fields are filled
  if (
    !dailyInputDate ||
    !adminCashSaleInput ||
    !adminBankSaleInput ||
    !adminDebtorsAmountInput
  ) {
    SHOW_ERROR_POPUP("Please fill in all fields.");
    return;
  }

  const request = {
    inputData: formData,
    apiType: API_TYPE_CONSTANT.insertDailyInput,
  };
  console.log(request);

  const response = await API_HANDLER(request);
  if (response?.status) {
    SHOW_SUCCESS_POPUP("Record Inserted, thank you!");
    clearDailyInputFieldValue();
  } else {
    SHOW_ERROR_POPUP("Something went wrong to save daily Input data");
  }
}
