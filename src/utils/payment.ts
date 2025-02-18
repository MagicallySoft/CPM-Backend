export const processPayment = async (paymentDetails: any, subscriptionPlan: string) => {
    // Simulate a successful payment result for testing purposes
    return {
      success: true, // or false in case of a failure
      transactionData: {
        transactionId: "fake-transaction-id",
        amount: 100,
        currency: "USD",
        status: "approved",
      },
      error: null, // On success, there will be no error
    };
  };
  